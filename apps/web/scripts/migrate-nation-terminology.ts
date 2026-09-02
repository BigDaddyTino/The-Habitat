import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { NATION_MANAGEMENT_PERSISTED_SLUG, NATION_MANAGEMENT_ROUTE_SLUG, persistedStoryEntrySlug, storyEntrySlugAliases } from "@habitat/shared";
import { nationTerminologyStorageText, nationTerminologyStorageValue, nationTerminologyText } from "../lib/nation-terminology";

const confirmation = "--confirm=NATION_TERMINOLOGY";
const db = getPrismaClient();

type EntryRow = Awaited<ReturnType<typeof loadEntries>>[number];
type EntryChange = {
  before: EntryRow;
  after: Pick<EntryRow, "slug" | "title" | "summary" | "body" | "meta">;
  fields: Array<"slug" | "title" | "summary" | "body" | "meta">;
};

function inputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function sameJson(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function loadEntries(client: Prisma.TransactionClient | typeof db = db) {
  return client.storyEntry.findMany({
    orderBy: { slug: "asc" },
    select: { id: true, slug: true, title: true, summary: true, body: true, meta: true, version: true },
  });
}

function assess(entry: EntryRow): EntryChange | null {
  const after = {
    slug: persistedStoryEntrySlug(entry.slug),
    title: nationTerminologyStorageText(entry.title),
    summary: entry.summary ? nationTerminologyStorageText(entry.summary) : null,
    body: entry.body ? nationTerminologyStorageText(entry.body) : null,
    meta: entry.meta === null ? null : nationTerminologyStorageValue(entry.meta) as Prisma.JsonValue,
  };
  const fields: EntryChange["fields"] = [];
  if (after.slug !== entry.slug) fields.push("slug");
  if (after.title !== entry.title) fields.push("title");
  if (after.summary !== entry.summary) fields.push("summary");
  if (after.body !== entry.body) fields.push("body");
  if (!sameJson(after.meta, entry.meta)) fields.push("meta");
  return fields.length ? { before: entry, after, fields } : null;
}

function containsLegacyTerminology(value: unknown): boolean {
  if (typeof value === "string") return nationTerminologyText(value) !== value;
  if (Array.isArray(value)) return value.some(containsLegacyTerminology);
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some(containsLegacyTerminology);
}

function matchingFields(row: Record<string, unknown>, fields: string[]) {
  return fields.filter((field) => containsLegacyTerminology(row[field]));
}

/**
 * Read-only coverage for every other story surface that can render authored
 * text. Immutable revisions and releases are reported separately and never
 * rewritten; a new release must be cut deliberately after live canon moves.
 */
async function auditOtherStoryContent() {
  const [arcs, nodes, edges, lines, comments, revisions, releases] = await Promise.all([
    db.storyArc.findMany({ select: { id: true, slug: true, title: true, summary: true, hook: true } }),
    db.storyNode.findMany({ select: { id: true, key: true, title: true, summary: true, body: true, completion: true, effects: true, rewards: true } }),
    db.storyEdge.findMany({ select: { id: true, key: true, label: true, condition: true, effects: true } }),
    db.storyLine.findMany({ select: { id: true, text: true, performance: true } }),
    db.storyComment.findMany({ select: { id: true, body: true } }),
    db.storyRevision.findMany({ select: { id: true, summary: true, before: true, after: true } }),
    db.storyRelease.findMany({ select: { id: true, name: true, notes: true, payload: true, atlas: true, counts: true, audit: true } }),
  ]);
  const collect = <Row extends object>(rows: Row[], identity: keyof Row & string, fields: Array<keyof Row & string>) => rows.flatMap((row) => {
    const record = row as Record<string, unknown>;
    const matches = matchingFields(record, fields);
    return matches.length ? [{ id: String(record[identity]), fields: matches }] : [];
  });
  const live = {
    StoryArc: collect(arcs, "slug", ["title", "summary", "hook"]),
    StoryNode: collect(nodes, "id", ["title", "summary", "body", "completion", "effects", "rewards"]),
    StoryEdge: collect(edges, "id", ["label", "condition", "effects"]),
    StoryLine: collect(lines, "id", ["text", "performance"]),
    StoryComment: collect(comments, "id", ["body"]),
  };
  const history = collect(revisions, "id", ["summary", "before", "after"]);
  const frozenReleases = collect(releases, "name", ["notes", "payload", "atlas", "counts", "audit"]);
  return {
    live,
    liveMatches: Object.values(live).reduce((sum, rows) => sum + rows.length, 0),
    immutableStoryRevisionMatches: history.length,
    immutableStoryRevisions: history,
    immutableStoryReleaseMatches: frozenReleases.length,
    immutableStoryReleases: frozenReleases,
  };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const database = identity[0]?.database;
  if (!database) throw new Error("Nation terminology migration could not verify its database identity.");

  const reservedAliases = await db.storyEntry.findMany({
    where: { slug: { in: storyEntrySlugAliases(NATION_MANAGEMENT_ROUTE_SLUG) } },
    select: { id: true, slug: true, title: true },
    orderBy: { slug: "asc" },
  });
  if (reservedAliases.length > 1) {
    throw new Error(`Nation Management route collision: both reserved aliases exist (${reservedAliases.map((entry) => `${entry.slug}:${entry.id}`).join(", ")}). Resolve the duplicate explicitly before applying.`);
  }
  const otherStoryContentAudit = await auditOtherStoryContent();

  const initial = (await loadEntries()).flatMap((entry) => {
    const change = assess(entry);
    return change ? [change] : [];
  });
  const plan = initial.map((change) => ({ slug: change.before.slug, version: change.before.version, fields: change.fields }));

  if (!apply) {
    console.log(JSON.stringify({
      migration: "nation-terminology-v1",
      mode: "PREVIEW",
      database,
      stablePersistedSlug: NATION_MANAGEMENT_PERSISTED_SLUG,
      mutations: plan.length,
      plan,
      otherStoryContentAudit,
      apply: `NATION_TERMINOLOGY_ACTOR_ID=<active-admin-id> pnpm --filter @habitat/web exec tsx scripts/migrate-nation-terminology.ts --apply ${confirmation}`,
    }, null, 2));
    return;
  }

  if (!process.argv.includes(confirmation)) throw new Error(`Applying Nation terminology requires ${confirmation}.`);
  if (otherStoryContentAudit.liveMatches > 0) {
    throw new Error(`Preview found ${otherStoryContentAudit.liveMatches} legacy match(es) on non-entry live story surfaces. This entry migration will not partially rewrite them; review the preview and migrate those entities with their own revision records first.`);
  }
  const actorId = process.env.NATION_TERMINOLOGY_ACTOR_ID?.trim();
  if (!actorId) throw new Error("Applying Nation terminology requires NATION_TERMINOLOGY_ACTOR_ID for explicit audit authorship.");

  const result = await db.$transaction(async (tx) => {
    const actor = await tx.user.findFirst({ where: { id: actorId, role: "ADMIN", isActive: true }, select: { id: true, username: true } });
    if (!actor) throw new Error("NATION_TERMINOLOGY_ACTOR_ID must identify an active administrator.");

    const currentRows = await loadEntries(tx);
    const currentById = new Map(currentRows.map((entry) => [entry.id, entry]));
    const changed: Array<{ slug: string; fields: EntryChange["fields"]; versionBefore: number; versionAfter: number; revisionId: string }> = [];

    for (const expected of initial) {
      const current = currentById.get(expected.before.id);
      if (!current || current.version !== expected.before.version) throw new Error(`${expected.before.slug}: record/version changed after preview assessment.`);
      const change = assess(current);
      if (!change || change.fields.join("|") !== expected.fields.join("|")) throw new Error(`${expected.before.slug}: terminology source drifted before the transaction acquired it.`);

      const data: Prisma.StoryEntryUncheckedUpdateManyInput = { version: { increment: 1 }, updatedByUserId: actor.id };
      if (change.fields.includes("slug")) data.slug = change.after.slug;
      if (change.fields.includes("title")) data.title = change.after.title;
      if (change.fields.includes("summary")) data.summary = change.after.summary;
      if (change.fields.includes("body")) data.body = change.after.body;
      // A changed meta value cannot be null: null -> null is not a change.
      if (change.fields.includes("meta") && change.after.meta !== null) data.meta = inputJson(change.after.meta);

      const claimed = await tx.storyEntry.updateMany({ where: { id: current.id, version: current.version }, data });
      if (claimed.count !== 1) throw new Error(`${current.slug}: optimistic terminology update failed.`);
      const revision = await tx.storyRevision.create({ data: {
        entityType: "ENTRY",
        entityId: current.id,
        action: "UPDATED",
        actorUserId: actor.id,
        summary: `Normalized ${change.fields.join(", ")} to Nation Management terminology`,
        before: inputJson(Object.fromEntries(change.fields.map((field) => [field, current[field]]))),
        after: inputJson(Object.fromEntries(change.fields.map((field) => [field, change.after[field]]))),
      } });
      changed.push({ slug: current.slug, fields: change.fields, versionBefore: current.version, versionAfter: current.version + 1, revisionId: revision.id });
    }

    const residual = (await loadEntries(tx)).flatMap((entry) => assess(entry) ? [entry.slug] : []);
    if (residual.length) throw new Error(`Terminology remained after migration: ${residual.join(", ")}`);
    return { actor, changed };
  }, { isolationLevel: "Serializable", timeout: 30_000 });

  console.log(JSON.stringify({
    migration: "nation-terminology-v1",
    mode: "APPLIED",
    database,
    actor: result.actor,
    stablePersistedSlug: NATION_MANAGEMENT_PERSISTED_SLUG,
    mutations: result.changed.length,
    revisions: result.changed.length,
    changed: result.changed,
    immutableStoryRevisionMatchesRetained: otherStoryContentAudit.immutableStoryRevisionMatches,
    immutableStoryReleaseMatchesRetained: otherStoryContentAudit.immutableStoryReleaseMatches,
  }, null, 2));
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
