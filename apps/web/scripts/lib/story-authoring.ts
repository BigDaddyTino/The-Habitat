import { randomUUID } from "node:crypto";
import type { getPrismaClient } from "@habitat/db/client";

/**
 * Idempotent authoring helpers for the scripts that write story boards.
 *
 * Every authoring script in this repo has to be safe to run twice — a board is
 * production canon, and a script that appends instead of reconciling turns one
 * mistake into a duplicated quest nobody can untangle. Nodes are keyed by
 * `(arc, key)` and edges by `(arc, from, to, label)`, so a second run updates
 * what it wrote the first time and touches nothing else.
 *
 * Everything reports before it writes. `apply: false` is the default at every
 * call site; nothing here decides on its own to change production.
 */
export type Database = ReturnType<typeof getPrismaClient>;
export type NodeKind = "BEAT" | "SCENE" | "DIALOGUE" | "CHOICE" | "CONDITION" | "QUEST_START" | "QUEST_STEP" | "ENDING";
export type EndingKind = "SUCCESS" | "FAILURE" | "NEUTRAL";
export type Status = "DRAFT" | "PROPOSED" | "CANON";
/** The audit-log verbs this library records. Narrower than the full enum on
 *  purpose: authoring only ever creates, rewrites, or unlinks. */
type RevisionAction = "CREATED" | "UPDATED" | "UNLINKED";

export type NodeSpec = {
  key: string;
  kind: NodeKind;
  title: string;
  summary?: string | null;
  body: string;
  status?: Status;
  endingKind?: EndingKind | null;
  effects?: string[];
  rewards?: string[];
  completion?: string | null;
  /** The bible entry speaking, by slug — never free text, so a speaker cannot be a typo. */
  speakerSlug?: string | null;
  /** The arc this node hands off to, by slug. */
  continuesInSlug?: string | null;
  x?: number;
  y?: number;
};

export type EdgeSpec = {
  from: string;
  to: string;
  label?: string | null;
  /**
   * Read by `scanStoryFlagSites` — a FLAG slug appearing here is what makes the
   * promise ledger record a payoff. Prose alone reads well and counts for
   * nothing, which is why six planted promises had never been answered.
   */
  condition?: string | null;
  effects?: string[];
  status?: Status;
};

export type Change = { kind: "node" | "edge" | "arc" | "entry"; action: "create" | "update" | "unchanged"; label: string; detail?: string };

const same = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

/**
 * A comparison that survives a round trip through the database.
 *
 * Postgres `jsonb` does not preserve key order — it stores keys sorted by
 * length and then bytewise — so `JSON.stringify(stored) === JSON.stringify(spec)`
 * is false on the very first re-run even when nothing changed, and an
 * authoring script that trusts it rewrites every row forever.
 */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export class BoardWriter {
  readonly changes: Change[] = [];
  constructor(private readonly db: Database, private readonly actorUserId: string, private readonly apply: boolean) {}

  private async revise(entityType: "NODE" | "EDGE" | "ARC" | "ENTRY", entityId: string, arcId: string | null, action: RevisionAction, summary: string) {
    if (!this.apply) return;
    await this.db.storyRevision.create({
      data: { id: randomUUID(), entityType, entityId, arcId, action, actorUserId: this.actorUserId, summary },
    });
  }

  async arcId(slug: string) {
    const arc = await this.db.storyArc.findUnique({ where: { slug }, select: { id: true, lockedAt: true, title: true } });
    if (!arc) throw new Error(`No arc "${slug}".`);
    // The padlock is the only freeze in the room, and a script is not exempt.
    if (arc.lockedAt) throw new Error(`Arc "${slug}" is locked; unlock it before authoring into it.`);
    return arc.id;
  }

  async entryId(slug: string) {
    const entry = await this.db.storyEntry.findUnique({ where: { slug }, select: { id: true } });
    return entry?.id ?? null;
  }

  /** Sets arc fields that are currently blank or different. */
  async arcFields(slug: string, fields: { hook?: string; summary?: string; title?: string; status?: Status }) {
    const arc = await this.db.storyArc.findUnique({ where: { slug }, select: { id: true, hook: true, summary: true, title: true, status: true } });
    if (!arc) throw new Error(`No arc "${slug}".`);
    const patch: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && (arc as unknown as Record<string, unknown>)[key] !== value) patch[key] = value;
    }
    if (Object.keys(patch).length === 0) { this.changes.push({ kind: "arc", action: "unchanged", label: slug }); return arc.id; }
    this.changes.push({ kind: "arc", action: "update", label: slug, detail: Object.keys(patch).join(", ") });
    if (this.apply) {
      // StoryArc has no updatedBy/version columns — only the row's own fields.
      await this.db.storyArc.update({ where: { id: arc.id }, data: patch });
      await this.revise("ARC", arc.id, arc.id, "UPDATED", `Authored ${Object.keys(patch).join(" and ")} on "${arc.title}"`);
    }
    return arc.id;
  }

  async node(arcSlug: string, spec: NodeSpec) {
    const arcId = await this.arcId(arcSlug);
    const existing = await this.db.storyNode.findUnique({
      where: { arcId_key: { arcId, key: spec.key } },
      select: { id: true, kind: true, title: true, summary: true, body: true, status: true, endingKind: true, effects: true, rewards: true, completion: true, speakerEntryId: true, continuesInArcId: true, canvasX: true, canvasY: true },
    });
    const speakerEntryId = spec.speakerSlug ? await this.entryId(spec.speakerSlug) : null;
    if (spec.speakerSlug && !speakerEntryId) throw new Error(`Node ${spec.key} names a speaker "${spec.speakerSlug}" that is not in the bible.`);
    const continuesInArcId = spec.continuesInSlug ? await this.arcId(spec.continuesInSlug) : null;

    const data = {
      kind: spec.kind,
      title: spec.title,
      summary: spec.summary ?? null,
      body: spec.body,
      status: spec.status ?? "CANON",
      endingKind: spec.endingKind ?? null,
      effects: spec.effects ?? [],
      rewards: spec.rewards ?? [],
      completion: spec.completion ?? null,
      speakerEntryId,
      continuesInArcId,
      canvasX: spec.x ?? 0,
      canvasY: spec.y ?? 0,
    };

    if (!existing) {
      this.changes.push({ kind: "node", action: "create", label: `${arcSlug}/${spec.key}`, detail: spec.title });
      if (this.apply) {
        const created = await this.db.storyNode.create({ data: { id: randomUUID(), arcId, key: spec.key, createdByUserId: this.actorUserId, ...data } });
        await this.revise("NODE", created.id, arcId, "CREATED", `Wrote the scene "${spec.title}"`);
      }
      return;
    }

    const unchanged =
      existing.kind === data.kind && existing.title === data.title && existing.summary === data.summary &&
      existing.body === data.body && existing.status === data.status && existing.endingKind === data.endingKind &&
      same(existing.effects, data.effects) && same(existing.rewards, data.rewards) && existing.completion === data.completion &&
      existing.speakerEntryId === data.speakerEntryId && existing.continuesInArcId === data.continuesInArcId;
    if (unchanged) { this.changes.push({ kind: "node", action: "unchanged", label: `${arcSlug}/${spec.key}` }); return; }

    this.changes.push({ kind: "node", action: "update", label: `${arcSlug}/${spec.key}`, detail: spec.title });
    if (this.apply) {
      await this.db.storyNode.update({ where: { id: existing.id }, data: { ...data, updatedByUserId: this.actorUserId, version: { increment: 1 } } });
      await this.revise("NODE", existing.id, arcId, "UPDATED", `Rewrote the scene "${spec.title}"`);
    }
  }

  async edge(arcSlug: string, spec: EdgeSpec) {
    const arcId = await this.arcId(arcSlug);
    const [from, to] = await Promise.all([
      this.db.storyNode.findUnique({ where: { arcId_key: { arcId, key: spec.from } }, select: { id: true, title: true } }),
      this.db.storyNode.findUnique({ where: { arcId_key: { arcId, key: spec.to } }, select: { id: true, title: true } }),
    ]);
    // In preview the endpoints may not exist yet; report the intent instead of
    // failing, so one dry run shows the whole board rather than the first gap.
    if (!from || !to) {
      if (this.apply) throw new Error(`Edge ${spec.from} -> ${spec.to} on ${arcSlug} is missing an endpoint.`);
      this.changes.push({ kind: "edge", action: "create", label: `${arcSlug}: ${spec.from} -> ${spec.to}`, detail: spec.label ?? "(no label)" });
      return;
    }

    const siblings = await this.db.storyEdge.findMany({ where: { arcId, fromNodeId: from.id }, select: { id: true, toNodeId: true, label: true, condition: true, effects: true, status: true, position: true } });
    const existing = siblings.find((edge) => edge.toNodeId === to.id && (edge.label ?? null) === (spec.label ?? null));
    const data = { label: spec.label ?? null, condition: spec.condition ?? null, effects: spec.effects ?? [], status: (spec.status ?? "CANON") as Status };

    if (!existing) {
      const position = siblings.reduce((highest, edge) => Math.max(highest, edge.position), -1) + 1;
      this.changes.push({ kind: "edge", action: "create", label: `${arcSlug}: ${spec.from} -> ${spec.to}`, detail: `${spec.label ?? "(no label)"}${spec.condition ? ` [if ${spec.condition}]` : ""}` });
      if (this.apply) {
        const created = await this.db.storyEdge.create({ data: { id: randomUUID(), arcId, fromNodeId: from.id, toNodeId: to.id, position, createdByUserId: this.actorUserId, ...data } });
        await this.revise("EDGE", created.id, arcId, "CREATED", `Wired "${from.title}" to "${to.title}"`);
      }
      return;
    }

    const unchanged = existing.condition === data.condition && same(existing.effects, data.effects) && existing.status === data.status;
    if (unchanged) { this.changes.push({ kind: "edge", action: "unchanged", label: `${arcSlug}: ${spec.from} -> ${spec.to}` }); return; }
    this.changes.push({ kind: "edge", action: "update", label: `${arcSlug}: ${spec.from} -> ${spec.to}`, detail: spec.condition ? `now checks ${spec.condition}` : "rewired" });
    if (this.apply) {
      await this.db.storyEdge.update({ where: { id: existing.id }, data });
      await this.revise("EDGE", existing.id, arcId, "UPDATED", `Rewired "${from.title}" to "${to.title}"`);
    }
  }

  /**
   * Removes a branch that a rewrite has replaced.
   *
   * Used when a new scene is inserted onto an existing route: leaving the old
   * direct edge in place would let the player walk straight past the scene
   * that makes their earlier choice matter, which is the whole point of it.
   * Nothing is deleted silently — the removal is reported and revised like any
   * other change, and a route that no longer exists is not a route that was
   * lost, because the replacement carries it.
   */
  async retireEdge(arcSlug: string, from: string, to: string, label: string | null, because: string) {
    const arcId = await this.arcId(arcSlug);
    const [fromNode, toNode] = await Promise.all([
      this.db.storyNode.findUnique({ where: { arcId_key: { arcId, key: from } }, select: { id: true, title: true } }),
      this.db.storyNode.findUnique({ where: { arcId_key: { arcId, key: to } }, select: { id: true, title: true } }),
    ]);
    if (!fromNode || !toNode) { this.changes.push({ kind: "edge", action: "unchanged", label: `${arcSlug}: ${from} -> ${to} (no such branch)` }); return; }
    const existing = await this.db.storyEdge.findFirst({ where: { arcId, fromNodeId: fromNode.id, toNodeId: toNode.id, label } , select: { id: true } });
    if (!existing) { this.changes.push({ kind: "edge", action: "unchanged", label: `${arcSlug}: ${from} -> ${to} (already retired)` }); return; }
    this.changes.push({ kind: "edge", action: "update", label: `${arcSlug}: ${from} -> ${to}`, detail: `RETIRED — ${because}` });
    if (this.apply) {
      await this.revise("EDGE", existing.id, arcId, "UNLINKED", `Retired the branch from "${fromNode.title}" to "${toNode.title}" — ${because}`);
      await this.db.storyEdge.delete({ where: { id: existing.id } });
    }
  }

  /**
   * Where an ENDING hands the story on, by arc slug.
   *
   * The narrow counterpart to `node()`: a card whose prose is already written
   * and correct, and whose only fault is that the road out of it was never
   * declared structurally. Kept separate precisely so a join can be added
   * without a script restating a body it is not changing — retyping settled
   * prose to set one column is how a rewrite gets in by accident.
   *
   * Only an ENDING may carry a continuation; the database CHECKs it, and so
   * does this, because the failure is far more legible here.
   */
  async handoff(arcSlug: string, nodeKey: string, continuesInSlug: string) {
    const arcId = await this.arcId(arcSlug);
    const target = await this.arcId(continuesInSlug);
    const node = await this.db.storyNode.findUnique({
      where: { arcId_key: { arcId, key: nodeKey } },
      select: { id: true, kind: true, title: true, continuesInArcId: true },
    });
    if (!node) throw new Error(`No card "${nodeKey}" on ${arcSlug}.`);
    if (node.kind !== "ENDING") throw new Error(`"${nodeKey}" on ${arcSlug} is a ${node.kind}; only an ENDING continues into another arc.`);
    if (node.continuesInArcId === target) { this.changes.push({ kind: "node", action: "unchanged", label: `${arcSlug}/${nodeKey}` }); return; }
    this.changes.push({ kind: "node", action: "update", label: `${arcSlug}/${nodeKey}`, detail: `continues in ${continuesInSlug}` });
    if (this.apply) {
      await this.db.storyNode.update({ where: { id: node.id }, data: { continuesInArcId: target, updatedByUserId: this.actorUserId, version: { increment: 1 } } });
      await this.revise("NODE", node.id, arcId, "UPDATED", `"${node.title}" now hands the story on to ${continuesInSlug}`);
    }
  }

  /**
   * Reconciles what a card does — the `effects` lines, in order.
   *
   * The same narrowness as `handoff`, for the same reason: a `set flag:` line
   * is the only thing that makes the promise ledger and the campaign map see a
   * card at all, and adding one should never mean rewriting the scene round it.
   */
  async effects(arcSlug: string, nodeKey: string, lines: readonly string[]) {
    const arcId = await this.arcId(arcSlug);
    const node = await this.db.storyNode.findUnique({ where: { arcId_key: { arcId, key: nodeKey } }, select: { id: true, title: true, effects: true } });
    if (!node) throw new Error(`No card "${nodeKey}" on ${arcSlug}.`);
    if (same(node.effects, lines)) { this.changes.push({ kind: "node", action: "unchanged", label: `${arcSlug}/${nodeKey} effects` }); return; }
    this.changes.push({ kind: "node", action: "update", label: `${arcSlug}/${nodeKey} effects`, detail: lines.join(" · ") });
    if (this.apply) {
      await this.db.storyNode.update({ where: { id: node.id }, data: { effects: [...lines], updatedByUserId: this.actorUserId, version: { increment: 1 } } });
      await this.revise("NODE", node.id, arcId, "UPDATED", `Rewrote what "${node.title}" does`);
    }
  }

  /**
   * A FLAG entry: one name for one thing the story remembers.
   *
   * Flags are ordinary bible entries, which is what lets the promises ledger
   * derive itself by scanning for their slugs instead of anybody maintaining a
   * list. Never plant one without deciding where it is answered.
   */
  async flag(slug: string, title: string, summary: string, body: string) {
    const existing = await this.db.storyEntry.findUnique({ where: { slug }, select: { id: true, kind: true, title: true, summary: true, body: true } });
    if (existing && existing.kind !== "FLAG") throw new Error(`"${slug}" already exists and is a ${existing.kind}, not a flag.`);
    if (!existing) {
      this.changes.push({ kind: "entry", action: "create", label: `FLAG ${slug}`, detail: title });
      if (this.apply) {
        const created = await this.db.storyEntry.create({ data: { id: randomUUID(), kind: "FLAG", slug, title, summary, body, status: "CANON", createdByUserId: this.actorUserId } });
        await this.revise("ENTRY", created.id, null, "CREATED", `Planted the flag "${title}"`);
      }
      return;
    }
    if (existing.title === title && existing.summary === summary && existing.body === body) { this.changes.push({ kind: "entry", action: "unchanged", label: `FLAG ${slug}` }); return; }
    this.changes.push({ kind: "entry", action: "update", label: `FLAG ${slug}`, detail: title });
    if (this.apply) {
      await this.db.storyEntry.update({ where: { id: existing.id }, data: { title, summary, body, updatedByUserId: this.actorUserId, version: { increment: 1 } } });
      await this.revise("ENTRY", existing.id, null, "UPDATED", `Rewrote the flag "${title}"`);
    }
  }

  /**
   * Reconciles which bible entries a scene names — adds what is missing,
   * removes what no longer belongs.
   *
   * The Bloomfall boards were generated by linking every entry the quest
   * touches to every node in it, so one dossier showed five identical
   * appearances of the same quest and none of them said anything. A link is
   * supposed to mean "this entry is IN this scene". Blanket-linking makes the
   * connection web louder and less useful at the same time.
   */
  async links(arcSlug: string, nodeKey: string, slugs: readonly string[]) {
    const arcId = await this.arcId(arcSlug);
    const node = await this.db.storyNode.findUnique({ where: { arcId_key: { arcId, key: nodeKey } }, select: { id: true, title: true } });
    if (!node) {
      if (this.apply) throw new Error(`Cannot link ${arcSlug}/${nodeKey}: no such scene.`);
      this.changes.push({ kind: "edge", action: "create", label: `${arcSlug}/${nodeKey} links`, detail: slugs.join(", ") });
      return;
    }
    const wanted = new Map<string, string>();
    for (const slug of slugs) {
      const id = await this.entryId(slug);
      if (id) { wanted.set(slug, id); continue; }
      // On apply this is fatal — a link to nothing is a broken connection. In
      // preview it is usually an entry the same run is about to create, so it
      // is reported rather than aborting the whole dry run at the first one.
      if (this.apply) throw new Error(`${arcSlug}/${nodeKey} links to "${slug}", which is not in the bible.`);
      this.changes.push({ kind: "edge", action: "create", label: `${arcSlug}/${nodeKey} links`, detail: `${slug} (not written yet)` });
    }
    const current = await this.db.storyEntryLink.findMany({ where: { nodeId: node.id }, select: { id: true, entry: { select: { id: true, slug: true } } } });
    const currentIds = new Set(current.map((link) => link.entry.id));

    const added = [...wanted.entries()].filter(([, id]) => !currentIds.has(id));
    const removed = current.filter((link) => !wanted.has(link.entry.slug));
    if (added.length === 0 && removed.length === 0) { this.changes.push({ kind: "edge", action: "unchanged", label: `${arcSlug}/${nodeKey} links` }); return; }

    this.changes.push({
      kind: "edge", action: "update", label: `${arcSlug}/${nodeKey} links`,
      detail: [added.length ? `+${added.map(([slug]) => slug).join(" +")}` : null, removed.length ? `-${removed.map((link) => link.entry.slug).join(" -")}` : null].filter(Boolean).join("  "),
    });
    if (!this.apply) return;
    for (const [, entryId] of added) {
      const link = await this.db.storyEntryLink.create({ data: { nodeId: node.id, entryId } });
      await this.revise("NODE", link.id, arcId, "CREATED", `Put an entry into "${node.title}"`);
    }
    for (const link of removed) {
      await this.db.storyEntryLink.delete({ where: { id: link.id } });
      await this.revise("NODE", link.id, arcId, "UNLINKED", `Took "${link.entry.slug}" out of "${node.title}" — it is not in that scene`);
    }
  }

  report(title: string) {
    const created = this.changes.filter((change) => change.action === "create").length;
    const updated = this.changes.filter((change) => change.action === "update").length;
    const untouched = this.changes.filter((change) => change.action === "unchanged").length;
    console.log(`\n${title}`);
    for (const change of this.changes) {
      if (change.action === "unchanged") continue;
      console.log(`  ${change.action === "create" ? "+" : "~"} ${change.kind} ${change.label}${change.detail ? ` — ${change.detail}` : ""}`);
    }
    console.log(`\n${created} created, ${updated} rewritten, ${untouched} already correct.`);
    if (!this.apply) console.log("Dry run. Re-run with --apply to write it.");
  }
}
