import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient } from "@habitat/db/client";

/**
 * Contributor originals — the gold cards at the foot of a dossier.
 *
 * The house law, set by the owner on 2026-09-03: when a member writes
 * something the codex then builds on, **their original stays on the page,
 * under their name, whole — and the codex the game reads never carries it.**
 * Same treatment, every time, for every contributor.
 *
 * The never-exported half is structural rather than a filter. This lands in
 * `StoryEntryContribution`, and the outbound bundle's entry mapper
 * (apps/codex-sync/src/snapshot.ts) is an explicit allowlist of StoryEntry
 * columns, so a table it does not name cannot reach a game build.
 * scripts/audit-contributions.ts proves that against a real snapshot.
 *
 * RUN THIS BEFORE author-radiant-path.ts --apply. The rewrite replaces
 * `the-radiant-path`'s body, and this is what keeps the original.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-contributions.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-contributions.ts --apply
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");

/**
 * Schlotzsky's Radiant Path as he wrote it on 2026-09-02.
 *
 * This copy is the *checksum*, not the payload. What actually gets filed is
 * captured out of the live dossier byte for byte — including the CRLF line
 * endings he pasted it in with — because retyping somebody's submission into
 * a source file is how a contributor's own punctuation quietly becomes ours.
 * The two are compared with line endings normalised, and a mismatch refuses
 * the write outright.
 */
const radiantPathOriginal = `**The Radiant Path** — Summary

The Radiant Path is a militant ideological faction that fuses theocratic absolutism with aggressive revolutionary communism. It presents itself as the sole pure and illuminated way, demanding both total internal loyalty to its doctrine and external inclusion inside Arcadia with special protections for its members and beliefs.

### Core posture
The Path wants to exist *inside* the city. It seeks security, resources, recognition, and political space from Arcadia while insisting that its distinctive doctrine, communal loyalties, and standards of purity must be accommodated rather than subordinated to Arcadian norms. Full assimilation into Arcadian identity, emotional restraint, national primacy, and earned belonging is not required and is often resisted. This incomplete integration is framed by the Path as simple fidelity to its origins and revealed truth, not as rejection of the city itself.

### Ideology
- **Theocratic strand**: Absolute submission to a higher, purifying will; elevation of doctrinal purity; rejection of any order that dilutes or challenges it; strong emphasis on grievance and moral superiority.
- **Revolutionary-communist strand**: Aggressive denunciation of the wealthy political class as the face of a false and oppressive hierarchy; call for sweeping away the existing order in favor of a purified collective; use of class rhetoric as an instrument rather than a reflection of broad lived resentment inside Arcadia.
- The two strands reinforce each other: the wealthy stewards and the Arcadian system as a whole are cast as both spiritually illegitimate and class-antagonistic.

### Methods of persuasion and defense
The Path relies heavily on emotional appeal—resentment, the promise of elevated belonging, and the sense of being uniquely wronged or pure. In open discourse it follows a consistent pattern: admit nothing, deny every substantive criticism, and immediately counter-accuse. Criticism of its demands, its retained separate loyalties, or its ideology is labeled the local equivalent of Pathophobia (anti-Path bigotry / hatred of the pure). This charge is used to shut down debate, claim victim status, and demand further accommodation.

### Relationship to Arcadia
The faction stands in direct tension with Arcadia’s foundational values: earned citizenship through service, restrained and noble emotional norms, the primacy of Arcadian identity, and the acceptance of hierarchical stewardship by the wealthy. It treats firm boundaries and expectations of primary loyalty to the city as evidence of exclusion and bigotry, while treating any concession as a platform for the next demand. The lethal jungle remains available as symbol and terrain, but the deeper engine is the demand for inclusion on the Path’s own terms.

In short, The Radiant Path is an absolutist hybrid movement that seeks protected space inside Arcadia while preserving a parallel loyalty and a doctrine that ultimately judges the city’s order as incomplete or illegitimate.`;

type ContributionSpec = {
  entrySlug: string;
  contributor: string;
  label: string;
  submittedAt: string;
  position?: number;
  /**
   * The submission is captured from the live dossier rather than retyped:
   * everything above `upToMarker`, exactly as stored. `expected` is the
   * checksum — the capture must equal it once line endings are normalised, or
   * the write is refused, because a first write that cannot prove what it is
   * copying might preserve a mangled version of somebody's work forever.
   */
  capture: { upToMarker: string | null; expected: string };
};

const contributions: ContributionSpec[] = [
  {
    entrySlug: "the-radiant-path",
    contributor: "schlotzsky",
    label: "Original faction dossier",
    submittedAt: "2026-09-02T11:07:00.000Z",
    // Everything above Tino's faith weave, which he added at 18:21 the same
    // day and which is not Ryan's.
    capture: { upToMarker: "## Faith", expected: radiantPathOriginal },
  },
];

const normalise = (text: string) => text.replace(/\r\n/g, "\n").trim();

async function main() {
  const identity = (await db.$queryRawUnsafe<{ current_database: string }[]>("select current_database()"))[0]?.current_database;
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Filing a contribution requires an active administrator.");

  const changes: string[] = [];

  for (const spec of contributions) {
    const entry = await db.storyEntry.findUnique({ where: { slug: spec.entrySlug }, select: { id: true, body: true, title: true } });
    if (!entry) throw new Error(`No entry "${spec.entrySlug}".`);
    const contributor = await db.user.findFirst({ where: { username: spec.contributor }, select: { id: true } });
    if (!contributor) throw new Error(`No member "${spec.contributor}".`);

    const stored = await db.storyEntryContribution.findFirst({
      where: { entryId: entry.id, contributorUserId: contributor.id, label: spec.label },
      select: { id: true, body: true, position: true, submittedAt: true },
    });

    // The fidelity gate. Once the rewrite lands the live body no longer holds
    // the original at all, which is fine — but only if the row was already
    // filed. Nothing is ever written from an unverified capture.
    const live = entry.body ?? "";
    const marker = spec.capture.upToMarker;
    const cut = marker ? live.indexOf(marker) : -1;
    const captured = (marker && cut >= 0 ? live.slice(0, cut) : live).replace(/\s+$/, "");
    const matches = normalise(captured) === normalise(spec.capture.expected);

    if (!stored && !matches) {
      throw new Error(
        `Refusing to file ${spec.contributor}'s original for "${entry.title}": what is on the live dossier does not match the checksum in this script, ` +
        `so there is no proof of what they actually wrote. Recover it from StoryRevision or from the member before filing.`,
      );
    }

    const position = spec.position ?? 0;
    const body = stored && !matches ? stored.body : captured;
    if (!stored) {
      changes.push(`file ${spec.contributor}'s "${spec.label}" on ${spec.entrySlug} (${body.length} chars captured verbatim, checksum matched)`);
      if (!apply) continue;
      await db.storyEntryContribution.create({ data: {
        id: randomUUID(), entryId: entry.id, contributorUserId: contributor.id,
        label: spec.label, body, position, submittedAt: new Date(spec.submittedAt),
        createdByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        id: randomUUID(), entityType: "ENTRY", entityId: entry.id, action: "CREATED", actorUserId: actor.id,
        summary: `Preserved ${spec.contributor}'s original submission on the dossier, website-only and never exported`,
      } });
      continue;
    }

    // Already filed. The stored words are the record now, so a re-run only
    // ever reconciles the metadata around them — a contributor's prose is
    // never silently rewritten by a script that ran a second time.
    const same = stored.position === position && stored.submittedAt.toISOString() === new Date(spec.submittedAt).toISOString();
    if (same) continue;
    changes.push(`reconcile the filing of ${spec.contributor}'s "${spec.label}" on ${spec.entrySlug} (position or date only; the words are untouched)`);
    if (!apply) continue;
    await db.storyEntryContribution.update({ where: { id: stored.id }, data: { position, submittedAt: new Date(spec.submittedAt) } });
  }

  console.log(JSON.stringify({ database: identity, mode: apply ? "APPLY" : "PREVIEW", changes: changes.length ? changes : ["unchanged"] }, null, 2));
  if (!apply) console.log("\nDry run. Re-run with --apply to write it.");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
