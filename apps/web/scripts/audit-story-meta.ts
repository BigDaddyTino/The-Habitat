import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { canonPacketSchema, metaSchemasByKind } from "../lib/story-meta-schemas";

/**
 * Audits every stored entry's `meta` against the schema its sheet enforces,
 * and every slug reference against what actually exists.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/audit-story-meta.ts
 *
 * Three failure modes it exists to catch:
 *
 *  1. REJECTED — the row would fail validation, so the first person to open
 *     that sheet and save gets "nothing was saved" with no way to fix it.
 *  2. DROPPED — the row carries a key the schema does not know, which zod
 *     strips silently on the next save. Data loss with no error.
 *  3. DANGLING — a slug reference pointing at an entry or arc that does not
 *     exist. Some of these are the fill-later law working as intended; the
 *     audit reports them and a human decides.
 *
 * Read-only: it never writes.
 */
const db = getPrismaClient();

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((row): row is string => typeof row === "string" && row.trim().length > 0) : [];

/** Every key the schema keeps, so anything else in the row is a silent drop. */
function knownKeys(schema: unknown): Set<string> {
  const shape = (schema as { shape?: Record<string, unknown> })?.shape;
  return new Set(shape ? Object.keys(shape) : []);
}

async function main() {
  const entries = await db.storyEntry.findMany({
    where: { status: { in: ["DRAFT", "PROPOSED", "CANON"] } },
    select: { slug: true, kind: true, title: true, meta: true, body: true },
    orderBy: [{ kind: "asc" }, { slug: "asc" }],
  });
  const arcs = await db.storyArc.findMany({ where: { status: { in: ["DRAFT", "PROPOSED", "CANON"] } }, select: { slug: true } });
  const known = new Set(entries.map((entry) => entry.slug));
  const knownArcs = new Set(arcs.map((arc) => arc.slug));

  const rejected: string[] = [];
  /** Packets that would fail their own schema — settled material at risk. */
  const badPackets: string[] = [];
  const dropped: string[] = [];
  const dangling: string[] = [];
  let validated = 0;
  let references = 0;

  for (const entry of entries) {
    const meta = asRecord(entry.meta);
    const schema = metaSchemasByKind[entry.kind];

    if (meta && schema) {
      validated += 1;
      const result = schema.safeParse(meta);
      if (!result.success) {
        const issues = result.error.issues.slice(0, 3).map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ");
        rejected.push(`${entry.kind}:${entry.slug} — ${issues}`);
      }
      const keeps = knownKeys(schema);
      for (const key of Object.keys(meta)) {
        if (!keeps.has(key)) dropped.push(`${entry.kind}:${entry.slug} .${key}`);
      }
    } else if (meta && !schema) {
      // A kind with meta but no sheet cannot be edited without losing it.
      dropped.push(`${entry.kind}:${entry.slug} — whole meta object (no sheet for this kind)`);
    }

    if (!meta) continue;

    if (entry.kind === "THREAD") {
      const rows = Array.isArray(meta.canonPackets) ? meta.canonPackets : null;
      if (rows === null) badPackets.push(`THREAD:${entry.slug} — no canonPackets key at all (the sheet will refuse the next save)`);
      else for (const [index, row] of rows.entries()) {
        const parsed = canonPacketSchema.safeParse(row);
        if (!parsed.success) badPackets.push(`THREAD:${entry.slug} .canonPackets[${index}] — ${parsed.error.issues.slice(0, 2).map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ")}`);
      }
    }

    const check = (field: string, values: string[], pool: Set<string>, poolName: string) => {
      for (const value of values) {
        references += 1;
        if (!pool.has(value)) dangling.push(`${entry.kind}:${entry.slug} .${field} -> ${value} (no such ${poolName})`);
      }
    };
    const one = (value: unknown): string[] => (typeof value === "string" && value.trim() ? [value.trim()] : []);
    const rowField = (rows: unknown, key: string): string[] =>
      (Array.isArray(rows) ? rows : []).flatMap((row) => one(asRecord(row)?.[key]));

    // Slug-or-prose fields (home, seat, origin, leaders) legally hold either a
    // linkable slug or plain description — "a fishing village on the coast" is
    // a fine origin. Only values that are shaped like multi-word slugs get
    // checked, mirroring how the creature biomes field was already handled.
    const slugShaped = (value: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) && value.includes("-");
    const maybeSlugs = (values: string[]) => values.filter(slugShaped);
    check("parent", one(meta.parent), known, "entry");
    check("home", maybeSlugs(one(meta.home)), known, "entry");
    check("seat", maybeSlugs(one(meta.seat)), known, "entry");
    check("origin", maybeSlugs(one(meta.origin)), known, "entry");
    check("where", strings(meta.where), known, "entry");
    check("involved", strings(meta.involved), known, "entry");
    check("leaders", maybeSlugs(strings(meta.leaders)), known, "entry");
    check("dependsOn", strings(meta.dependsOn), known, "entry");
    check("factions[].faction", rowField(meta.factions, "faction"), known, "entry");
    check("relationships[].character", rowField(meta.relationships, "character"), known, "entry");
    check("relations[].faction", rowField(meta.relations, "faction"), known, "entry");
    check("control[].faction", rowField(meta.control, "faction"), known, "entry");
    check("connections[].to", rowField(meta.connections, "to"), known, "entry");
    check("regionNotes[].region", rowField(meta.regionNotes, "region"), known, "entry");
    check("unlockArc", one(meta.unlockArc), knownArcs, "arc");
    check("involvement[].arc", rowField(meta.involvement, "arc"), knownArcs, "arc");
    // The development room's newest references. A mission points at the board
    // it became; a canon packet points at where it is headed and everyone it
    // names. Checked here so the database-level audit and the zod schemas
    // cannot drift apart on the fields nothing else scans.
    check("arc", one(meta.arc), knownArcs, "arc");
    for (const row of Array.isArray(meta.canonPackets) ? meta.canonPackets : []) {
      const packet = asRecord(row);
      if (!packet) continue;
      check("canonPackets[].targetRegion", one(packet.targetRegion), known, "entry");
      check("canonPackets[].targetCompanion", one(packet.targetCompanion), known, "entry");
      check("canonPackets[].entries", strings(packet.entries), known, "entry");
      check("canonPackets[].wovenInto", strings(packet.wovenInto), knownArcs, "arc");
    }
  }

  // Body [[links]] — the prose half of the same question.
  let links = 0;
  const brokenLinks: string[] = [];
  for (const entry of entries) {
    for (const match of (entry.body ?? "").matchAll(/\[\[([a-z0-9-]+)\]\]/g)) {
      links += 1;
      if (!known.has(match[1]) && !knownArcs.has(match[1])) brokenLinks.push(`${entry.kind}:${entry.slug} -> [[${match[1]}]]`);
    }
  }

  const report = (label: string, rows: string[]) => {
    console.log(`\n${label}: ${rows.length}`);
    for (const row of rows) console.log(`  ${row}`);
  };

  console.log(`entries: ${entries.length} (${validated} carrying meta a sheet validates)`);
  console.log(`references checked: ${references} typed, ${links} body links`);
  report("REJECTED — would fail on the next sheet save", rejected);
  report("PACKETS — settled material the canon inbox cannot read", badPackets);
  report("DROPPED — keys the next save would silently discard", dropped);
  report("DANGLING — references with no target", dangling);
  report("UNWRITTEN — body links to entries nobody has written", brokenLinks);

  const fatal = rejected.length + dropped.length + badPackets.length;
  console.log(`\n${fatal === 0 ? "PASS" : "FAIL"} — ${fatal} stability problem${fatal === 1 ? "" : "s"}; ${dangling.length + brokenLinks.length} unresolved reference${dangling.length + brokenLinks.length === 1 ? "" : "s"} (fill-later is legitimate, review them).`);
  if (fatal > 0) process.exitCode = 1;
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
