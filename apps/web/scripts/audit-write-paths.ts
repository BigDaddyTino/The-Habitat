import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { randomBytes } from "node:crypto";
import { liveServerReferenceManifest } from "./lib/live-build";

/**
 * Drives every save / edit / delete path the way a browser with JavaScript
 * switched off drives it — a multipart POST carrying React's own
 * `$ACTION_ID_<hex>` field — and reads the database back after each one.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-write-paths.ts
 *
 * It WRITES: it creates probe rows prefixed TMPCRUD, exercises them, and
 * removes them in a finally. It never touches a real record, and the one
 * shared row it edits — an admin season quest — it creates and deletes itself.
 */
const db = getPrismaClient();
const BASE = process.env.AUDIT_BASE ?? "http://127.0.0.1:3000";
// Read from the build the SERVICE is serving, not from `.next` — deploys now
// land in versioned release directories and `.next` can be a stale one.
const manifest = liveServerReferenceManifest();
const idOf = (name: string) => Object.entries(manifest.node).find(([, v]) => v.exportedName === name)?.[0];

const out: Array<{ ok: boolean; what: string }> = [];
const check = (ok: boolean, what: string) => out.push({ ok, what });

async function main() {
  const admin = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  const token = randomBytes(32).toString("hex");
  await db.session.create({ data: { sessionToken: token, userId: admin.id, expires: new Date(Date.now() + 3600_000) } });
  const cookie = `__Secure-authjs.session-token=${token}`;

  const post = async (path: string, action: string, fields: Array<[string, string]>) => {
    const id = idOf(action);
    if (!id) return { status: 0, text: `no action id for ${action}` };
    const form = new FormData();
    form.set(`$ACTION_ID_${id}`, "");
    for (const [k, v] of fields) form.append(k, v);
    const res = await fetch(`${BASE}${path}`, { method: "POST", headers: { cookie }, body: form, redirect: "manual" });
    return { status: res.status, text: await res.text() };
  };

  const madeEntries: string[] = [];
  const madeArcs: string[] = [];
  try {
    // ---- bible entry: create -> edit -> sheet -> comment -> archive ---------
    await post("/codex/library/characters", "createEntry", [["kind", "CHARACTER"], ["title", "TMPCRUD Person"], ["summary", "A probe."], ["body", "Written by the audit."], ["home", ""], ["species", ""]]);
    let entry = await db.storyEntry.findUnique({ where: { slug: "tmpcrud-person" }, select: { id: true, title: true, summary: true, body: true, version: true, meta: true, status: true } });
    check(Boolean(entry), "CREATE  a bible entry is written");
    check(entry?.body === "Written by the audit.", "        with the prose the form carried");
    if (!entry) throw new Error("cannot continue without the probe entry");
    madeEntries.push(entry.id);

    await post(`/codex/bible/${"tmpcrud-person"}`, "updateEntry", [["entryId", entry.id], ["version", String(entry.version)], ["kind", "CHARACTER"], ["title", "TMPCRUD Person Renamed"], ["summary", "Edited."], ["body", "Edited body."]]);
    entry = await db.storyEntry.findUniqueOrThrow({ where: { id: entry.id }, select: { id: true, title: true, summary: true, body: true, version: true, meta: true, status: true } });
    check(entry.title === "TMPCRUD Person Renamed" && entry.body === "Edited body.", "EDIT    an entry's prose is updated");
    check(entry.version === 2, "        and the version guard advanced");

    const stale = await post(`/codex/bible/tmpcrud-person`, "updateEntry", [["entryId", entry.id], ["version", "1"], ["kind", "CHARACTER"], ["title", "TMPCRUD Stale Write"], ["summary", "x"], ["body", "y"]]);
    const afterStale = await db.storyEntry.findUniqueOrThrow({ where: { id: entry.id }, select: { title: true } });
    check(afterStale.title !== "TMPCRUD Stale Write", `EDIT    a stale version is refused rather than clobbering (status ${stale.status})`);

    const sheet = { fullName: "TMPCRUD", aliases: [], pronouns: null, sex: null, species: "human", age: null, appearance: null, voice: null, voiceProfile: null, magic: { origin: null, schools: [], corruptionPhase: null, notes: null }, factions: [], home: null, status: { known: null, actual: null }, relationships: [], background: null, professions: [], skills: [], cybernetics: [], storyRole: null, involvement: [], gameId: null, model: null, companion: { capable: null, availability: null, status: null }, openQuestions: [] };
    await post(`/codex/bible/tmpcrud-person`, "updateEntryMeta", [["entryId", entry.id], ["version", String(entry.version)], ["metaJson", JSON.stringify(sheet)]]);
    entry = await db.storyEntry.findUniqueOrThrow({ where: { id: entry.id }, select: { id: true, title: true, summary: true, body: true, version: true, meta: true, status: true } });
    check((entry.meta as Record<string, unknown>)?.species === "human", "SHEET   a module sheet saves what the form composed");

    const badSheet = await post(`/codex/bible/tmpcrud-person`, "updateEntryMeta", [["entryId", entry.id], ["version", String(entry.version)], ["metaJson", JSON.stringify({ ...sheet, aliases: "not an array" })]]);
    const afterBad = await db.storyEntry.findUniqueOrThrow({ where: { id: entry.id }, select: { meta: true } });
    check(Array.isArray((afterBad.meta as Record<string, unknown>)?.aliases), `SHEET   a malformed sheet is refused whole (status ${badSheet.status})`);

    await post(`/codex/bible/tmpcrud-person`, "addComment", [["entryId", entry.id], ["body", "TMPCRUD note"]]);
    const comment = await db.storyComment.findFirst({ where: { entryId: entry.id }, select: { id: true, resolvedAt: true } });
    check(Boolean(comment), "CREATE  a writer note is attached");
    if (comment) {
      await post(`/codex/bible/tmpcrud-person`, "resolveComment", [["commentId", comment.id]]);
      const resolved = await db.storyComment.findUniqueOrThrow({ where: { id: comment.id }, select: { resolvedAt: true } });
      check(resolved.resolvedAt !== null, "EDIT    and can be resolved");
    }

    // ---- arc + node + edge: the board's whole CRUD --------------------------
    await post("/codex/stories", "createArc", [["title", "TMPCRUD Board"], ["summary", ""], ["hook", ""], ["category", "SIDE_QUEST"], ["regionEntryId", ""], ["companionEntryId", ""], ["factionEntryId", ""]]);
    const arc = await db.storyArc.findUnique({ where: { slug: "tmpcrud-board" }, select: { id: true, slug: true, title: true } });
    check(Boolean(arc), "CREATE  a story board is opened");
    if (!arc) throw new Error("cannot continue without the probe arc");
    madeArcs.push(arc.id);

    await post(`/codex/arc/${arc.slug}`, "createNode", [["arcId", arc.id], ["kind", "SCENE"], ["title", "TMPCRUD First scene"], ["summary", "s"], ["canvasX", "0"], ["canvasY", "0"]]);
    await post(`/codex/arc/${arc.slug}`, "createNode", [["arcId", arc.id], ["kind", "SCENE"], ["title", "TMPCRUD Second scene"], ["summary", "s"], ["canvasX", "0"], ["canvasY", "0"]]);
    const nodes = await db.storyNode.findMany({ where: { arcId: arc.id }, orderBy: { createdAt: "asc" }, select: { id: true, key: true, title: true, version: true, summary: true } });
    check(nodes.length === 2, `CREATE  scenes land on the board (${nodes.length})`);

    if (nodes.length === 2) {
      await post(`/codex/arc/${arc.slug}`, "updateNode", [["nodeId", nodes[0].id], ["version", String(nodes[0].version)], ["kind", "SCENE"], ["title", "TMPCRUD Renamed scene"], ["summary", "edited"], ["body", "b"], ["effects", "set flag: tmpcrud-probe"], ["rewards", ""], ["completion", ""], ["speakerEntryId", ""], ["continuesInArcId", ""], ["endingKind", ""]]);
      const edited = await db.storyNode.findUniqueOrThrow({ where: { id: nodes[0].id }, select: { title: true, effects: true, key: true } });
      check(edited.title === "TMPCRUD Renamed scene", "EDIT    a scene is updated");
      check(edited.effects.includes("set flag: tmpcrud-probe"), "        including its effects");
      check(edited.key === nodes[0].key, "        and its export key never moves on a rename");

      await post(`/codex/arc/${arc.slug}`, "addBranch", [["fromNodeId", nodes[0].id], ["targetNodeId", nodes[1].id], ["label", "TMPCRUD choice"]]);
      const edges = await db.storyEdge.findMany({ where: { arcId: arc.id }, select: { id: true, label: true } });
      check(edges.length === 1, `CREATE  a branch connects two scenes (${edges.length})`);

      if (edges.length === 1) {
        await post(`/codex/arc/${arc.slug}`, "updateEdge", [["edgeId", edges[0].id], ["label", "TMPCRUD relabelled"], ["condition", "tmpcrud-probe"], ["effects", ""]]);
        const relabelled = await db.storyEdge.findUniqueOrThrow({ where: { id: edges[0].id }, select: { label: true, condition: true } });
        check(relabelled.label === "TMPCRUD relabelled" && relabelled.condition === "tmpcrud-probe", "EDIT    a branch is updated");

        await post(`/codex/arc/${arc.slug}`, "deleteEdge", [["edgeId", edges[0].id]]);
        check((await db.storyEdge.count({ where: { id: edges[0].id } })) === 0, "DELETE  a branch is removed");
      }

      await post(`/codex/arc/${arc.slug}`, "linkEntryToNode", [["nodeId", nodes[0].id], ["entryId", entry.id]]);
      check((await db.storyEntryLink.count({ where: { nodeId: nodes[0].id, entryId: entry.id } })) === 1, "LINK    an entry is cast into a scene");
      await post(`/codex/arc/${arc.slug}`, "unlinkEntryFromNode", [["nodeId", nodes[0].id], ["entryId", entry.id]]);
      check((await db.storyEntryLink.count({ where: { nodeId: nodes[0].id, entryId: entry.id } })) === 0, "UNLINK  and can be taken back out");

      await post(`/codex/arc/${arc.slug}`, "deleteNode", [["nodeId", nodes[1].id]]);
      const removed = await db.storyNode.findUnique({ where: { id: nodes[1].id }, select: { status: true } });
      check(removed === null || removed.status === "ARCHIVED", `DELETE  a scene is removed, and a canon one is archived rather than erased (${removed?.status ?? "gone"})`);
      const twice = await post(`/codex/arc/${arc.slug}`, "deleteNode", [["nodeId", nodes[1].id]]);
      const stillThere = await db.storyNode.findUnique({ where: { id: nodes[1].id }, select: { status: true } });
      check(removed === null || stillThere?.status === "ARCHIVED", `DELETE  a second delete from a stale tab cannot erase what the first archived (status ${twice.status})`);
    }

    // ---- the freeze still gates every one of those -------------------------
    await post(`/codex/arc/${arc.slug}`, "lockArc", [["arcId", arc.id]]);
    check((await db.storyArc.findUniqueOrThrow({ where: { id: arc.id }, select: { lockedAt: true } })).lockedAt !== null, "LOCK    a board can be settled");
    const blocked = await post(`/codex/arc/${arc.slug}`, "createNode", [["arcId", arc.id], ["kind", "SCENE"], ["title", "TMPCRUD Should not exist"], ["summary", ""], ["canvasX", "0"], ["canvasY", "0"]]);
    check((await db.storyNode.count({ where: { arcId: arc.id, title: "TMPCRUD Should not exist" } })) === 0, `LOCK    and a settled board refuses a write (status ${blocked.status})`);
    await post(`/codex/arc/${arc.slug}`, "unlockArc", [["arcId", arc.id]]);
    check((await db.storyArc.findUniqueOrThrow({ where: { id: arc.id }, select: { lockedAt: true } })).lockedAt === null, "UNLOCK  an admin lifts it again");

    // ---- archive is the codex's delete -------------------------------------
    await post(`/codex/bible/tmpcrud-person`, "archiveEntry", [["entryId", entry.id]]);
    const archived = await db.storyEntry.findUniqueOrThrow({ where: { id: entry.id }, select: { status: true } });
    check(archived.status === "ARCHIVED", "DELETE  archiving takes an entry out of the working codex");
    check((await db.storyRevision.count({ where: { entityId: entry.id } })) > 0, "        and leaves its history intact");

    // ---- admin: season content create -> update -> remove -------------------
    // Structural edits are only legal on a season that has not started (and
    // whose dates have not effectively started it) — probing a running or
    // chronicled season reports the guard as a failure, which it is not.
    const season = await db.season.findFirst({
      where: { status: { notIn: ["ACTIVE", "COMPLETED"] }, endsAt: { gt: new Date() }, startsAt: { gt: new Date() } },
      select: { id: true, slug: true, status: true },
    });
    if (!season) console.log("skip  CREATE  season quest probe — no structurally-editable season exists to probe against");
    if (season) {
      await post(`/admin/seasons/${season.slug}`, "createSeasonQuest", [["seasonId", season.id], ["name", "TMPCRUD Quest"], ["description", "A probe quest for the audit."], ["scope", "PERSONAL"], ["gameType", ""], ["ruleType", "JOIN_COUNT"], ["threshold", "3"], ["xpReward", "50"], ["sortOrder", "99"]]);
      const quest = await db.seasonQuestDefinition.findFirst({ where: { seasonId: season.id, name: "TMPCRUD Quest" }, select: { id: true, threshold: true } });
      check(Boolean(quest), "CREATE  an admin season quest is written");
      if (quest) {
        await post(`/admin/seasons/${season.slug}`, "updateSeasonQuest", [["seasonId", season.id], ["id", quest.id], ["name", "TMPCRUD Quest"], ["description", "A probe quest for the audit."], ["scope", "PERSONAL"], ["gameType", ""], ["ruleType", "JOIN_COUNT"], ["threshold", "7"], ["xpReward", "50"], ["sortOrder", "99"], ["enabled", "true"]]);
        check((await db.seasonQuestDefinition.findUniqueOrThrow({ where: { id: quest.id }, select: { threshold: true } })).threshold === 7, "EDIT    and its threshold updates");
        await post(`/admin/seasons/${season.slug}`, "removeSeasonQuest", [["seasonId", season.id], ["id", quest.id]]);
        check((await db.seasonQuestDefinition.count({ where: { id: quest.id } })) === 0, "DELETE  and it can be removed");
      }
    }
  } finally {
    for (const id of madeArcs) { await db.storyArc.deleteMany({ where: { id } }); await db.storyRevision.deleteMany({ where: { entityId: id } }); }
    for (const id of madeEntries) {
      await db.storyComment.deleteMany({ where: { entryId: id } });
      await db.storyEntryLink.deleteMany({ where: { entryId: id } });
      await db.storyRevision.deleteMany({ where: { entityId: id } });
      await db.storyEntry.deleteMany({ where: { id } });
    }
    await db.storyRevision.deleteMany({ where: { summary: { contains: "TMPCRUD" } } });
    // The season-content actions write to the admin audit log rather than the
    // codex revision trail, so the probe sweeps its own rows out of there too.
    for (const key of ["slug", "name"] as const) {
      const value = key === "slug" ? "tmpcrud-quest" : "TMPCRUD Quest";
      await db.auditLog.deleteMany({ where: { action: { startsWith: "SEASON_QUEST" }, after: { path: [key], equals: value } } });
      await db.auditLog.deleteMany({ where: { action: { startsWith: "SEASON_QUEST" }, before: { path: [key], equals: value } } });
    }
    await db.session.deleteMany({ where: { sessionToken: token } });
  }

  for (const r of out) console.log(`${r.ok ? "ok  " : "FAIL"}  ${r.what}`);
  const failed = out.filter((r) => !r.ok).length;
  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${out.length - failed}/${out.length}`);
  if (failed) process.exitCode = 1;
}

main().then(() => db.$disconnect(), (e) => { console.error(e); return db.$disconnect().then(() => process.exit(1)); });
