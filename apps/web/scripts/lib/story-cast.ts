import { randomUUID } from "node:crypto";
import type { Prisma } from "@habitat/db/client";
import { stableJson, type Database } from "./story-authoring";

/**
 * The moment a reserved character gets their first scene, they stop being a
 * reservation. `the-unnamed` says so: "first writer to make one live on the
 * board owns them." This is the narrow writer for that moment — it promotes a
 * PROPOSED sheet to CANON, drops the "(placeholder)" from a name the owner has
 * kept, and files the involvement rows the dossier reads back. It never
 * touches prose it was not handed.
 */
export type Involvement = { ref: string; kind: "ARC" | "EVENT"; how: string };

export type CanoniseSpec = {
  slug: string;
  /** The name as it will be spoken; replaces a placeholder-marked fullName. */
  fullName?: string;
  involvement?: Involvement[];
  /** Open questions this pass has answered, matched by exact text. */
  answered?: string[];
  /** Prose appended to the body under its own heading — used only to record a ruling, never to rewrite. */
  append?: string;
  /** Relationship rows to rewrite, matched on the `who` text they replace. */
  relationships?: Array<{ replaceWho: string; who: string }>;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};

export class CastWriter {
  readonly changes: string[] = [];
  constructor(private readonly db: Database, private readonly actorUserId: string, private readonly apply: boolean) {}

  async canonise(spec: CanoniseSpec) {
    const entry = await this.db.storyEntry.findUnique({ where: { slug: spec.slug }, select: { id: true, kind: true, status: true, title: true, body: true, meta: true } });
    if (!entry) throw new Error(`No character "${spec.slug}" to canonise.`);
    if (entry.kind !== "CHARACTER") throw new Error(`"${spec.slug}" is a ${entry.kind}, not a character.`);

    const meta = asRecord(entry.meta);
    const before = stableJson(meta);
    if (spec.fullName !== undefined) meta.fullName = spec.fullName;
    if (spec.involvement) {
      const current = Array.isArray(meta.involvement) ? (meta.involvement as Involvement[]) : [];
      const wanted = spec.involvement.filter((row) => !current.some((have) => have.ref === row.ref && have.kind === row.kind));
      meta.involvement = [...current, ...wanted];
    }
    if (spec.answered) {
      const current = Array.isArray(meta.openQuestions) ? (meta.openQuestions as string[]) : [];
      meta.openQuestions = current.filter((question) => !spec.answered!.includes(question));
    }
    if (spec.relationships) {
      const current = Array.isArray(meta.relationships) ? (meta.relationships as Array<Record<string, unknown>>) : [];
      meta.relationships = current.map((row) => {
        const patch = spec.relationships!.find((candidate) => row.who === candidate.replaceWho);
        return patch ? { ...row, who: patch.who } : row;
      });
    }
    const metaChanged = stableJson(meta) !== before;

    let body = entry.body ?? "";
    if (spec.append && !body.includes(spec.append.trim())) body = `${body.trimEnd()}\n\n${spec.append.trim()}`;
    const bodyChanged = body !== (entry.body ?? "");
    const statusChanged = entry.status !== "CANON";

    if (!metaChanged && !bodyChanged && !statusChanged) { this.changes.push(`  = ${spec.slug} already canon and current`); return; }
    const what = [statusChanged ? `${entry.status} -> CANON` : null, metaChanged ? "sheet" : null, bodyChanged ? "body" : null].filter(Boolean).join(", ");
    this.changes.push(`  ~ ${spec.slug} — ${what}`);
    if (!this.apply) return;

    await this.db.storyEntry.update({
      where: { id: entry.id },
      data: {
        status: "CANON",
        body,
        ...(metaChanged ? { meta: meta as Prisma.InputJsonValue } : {}),
        updatedByUserId: this.actorUserId,
        version: { increment: 1 },
      },
    });
    if (statusChanged) {
      await this.db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: entry.id, action: "STATUS_CHANGED", actorUserId: this.actorUserId, summary: `"${entry.title}" has a first scene now; the reservation is canon.`, before: { status: entry.status }, after: { status: "CANON" } } });
    }
    if (metaChanged || bodyChanged) {
      await this.db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: this.actorUserId, summary: `Filed "${entry.title}" into the scenes that now carry them.` } });
    }
  }

  report(title: string) {
    console.log(`\n${title}`);
    for (const change of this.changes) console.log(change);
  }
}
