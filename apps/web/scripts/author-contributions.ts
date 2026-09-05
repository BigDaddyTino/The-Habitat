import "../lib/environment";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
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
  /**
   * Who wrote it. A `username` credits a member by their codex name; a `name`
   * credits somebody who is not a member, verbatim, and never by inventing a
   * User row for them. Exactly one, and the database CHECK agrees.
   */
  contributor: { username: string } | { name: string };
  label: string;
  submittedAt: string;
  position?: number;
  /**
   * How we know these are their words, and the two cases are genuinely
   * different.
   *
   * `capture` — the submission is lifted out of the live dossier rather than
   * retyped: everything above `upToMarker`, exactly as stored. `expected` is
   * the checksum, and a mismatch refuses the write, because a first write that
   * cannot prove what it is copying might preserve a mangled version of
   * somebody's work forever.
   *
   * `relayed` — the contributor never typed into the codex. They said it, and
   * the owner wrote it down. There is nothing to check it against and pretending
   * otherwise would be a fake gate, so the record says plainly that this is a
   * relay and who relayed it. The words are still never edited.
   *
   * `document` — their submission was preserved verbatim in a design document
   * rather than on the live dossier, which is where a reconciled creature brief
   * keeps its appendix. Read out of the file between two markers and checked
   * against a SHA, because retyping somebody's submission into a source file is
   * how their punctuation quietly becomes ours.
   *
   * `credit` — **the codex does not hold a copy of what they wrote.** The
   * member designed the thing from their own imagination and wrote it down; the
   * codex built on it and kept only its own build. This files a row with no
   * body, and the card says the copy is missing from *our* records — a fact
   * about the codex, never about the contributor. It never substitutes the
   * codex's prose for theirs, and a paraphrase under their name is not an
   * option here by design rather than by discipline: there is no field to put
   * one in. When the original turns up, swap this for `document` or `relayed`
   * and the words land in the card that is already standing.
   */
  source:
    | { kind: "capture"; upToMarker: string | null; expected: string }
    | { kind: "relayed"; body: string; relayedBy: string }
    | { kind: "document"; path: string; fromMarker: string; toMarker: string; sha256: string }
    | { kind: "credit"; because: string };
};

const creditOf = (spec: ContributionSpec) => ("username" in spec.contributor ? spec.contributor.username : spec.contributor.name);

/**
 * Mackenzie Martino's Pale Mother, as she said it on 2026-09-04.
 *
 * She is not a member and does not need to be. Every word here is load-bearing
 * in the dossier the codex built on top of it: "a spider" is why the creature
 * is arachnid-first and faceless rather than a skeleton standing up; "the blue
 * green place" is why Death Canyon's fissure light is a cold teal, which is
 * also the thing that stops the canyon being mistaken for two other regions;
 * "lots of little ones when it dies" is four hundred and eleven of them and the
 * phase-two HUD. Her spelling and her capitals are hers.
 */
const paleMotherOriginal = `Daddy I want a spider in the blue green place and i want it to have lots of little ones when it dies`;

const contributions: ContributionSpec[] = [
  {
    entrySlug: "the-pale-mother",
    contributor: { name: "Mackenzie Martino" },
    label: "The original creature, in her words",
    submittedAt: "2026-09-04T00:00:00.000Z",
    source: { kind: "relayed", body: paleMotherOriginal, relayedBy: "tino" },
  },
  {
    entrySlug: "the-radiant-path",
    contributor: { username: "schlotzsky" },
    label: "Original faction dossier",
    submittedAt: "2026-09-02T11:07:00.000Z",
    // Everything above Tino's faith weave, which he added at 18:21 the same
    // day and which is not Ryan's.
    source: { kind: "capture", upToMarker: "## Faith", expected: radiantPathOriginal },
  },

  // ---------------------------------------------------------------------
  // Hunter Martino. Two creatures, and the codex has been building on both of
  // them without his name on either. The two are filed differently because
  // what survives of them is different, and pretending otherwise would be the
  // dishonest half of doing this at all.

  {
    // His words DID survive. The reconciliation kept them whole in Appendix A
    // of the design document, which is the whole reason that appendix exists,
    // and this reads them back out of the file rather than retyping them.
    entrySlug: "the-blackweir-anaconda",
    contributor: { username: "hunterthekid26" },
    label: "Original creature design",
    submittedAt: "2026-09-02T00:00:00.000Z",
    source: {
      kind: "document",
      path: "Docs/bloomfall/BLOOMFALL_BLACKWEIR_ANACONDA.md",
      fromMarker: "Absolutely. I think making the Anaconda",
      toMarker: "### Appendix A notes",
      sha256: "876c4ef6b16469f1445c7734eab50d9c5c3be399403a0f4e21e997391832017b",
    },
  },
  {
    // The Hollow Wing is his, from his own imagination — he wrote it down. What
    // the codex holds is its own build on that design (`author-hollow-wing.ts`),
    // not his text: the summary it went in as was already a paraphrase, and the
    // repository has no copy of what he actually wrote.
    //
    // The owner ruled on 2026-09-04 that he is credited regardless, which is
    // right: the authorship is not in question, only whether we kept the page.
    // So this is a credit row with no body, and the card says the codex does
    // not hold a copy — a fact about our records, not about him — instead of
    // quoting the codex at itself under his name.
    //
    // If the original ever turns up, replace this source with a `document` or
    // `relayed` one. The row is keyed on entry + label, so the words will land
    // in the card that is already standing.
    entrySlug: "the-hollow-wing-creature",
    contributor: { username: "hunterthekid26" },
    label: "Original creature design",
    submittedAt: "2026-08-31T00:00:00.000Z",
    source: { kind: "credit", because: "the codex does not hold a copy of what he wrote" },
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
    const credit = creditOf(spec);

    // Exactly one credit column is set, and the database CHECK says the same
    // thing — a member is credited by their account, a non-member by name, and
    // nobody is ever given a fake User row so that a card can render.
    let contributorUserId: string | null = null;
    let contributorName: string | null = null;
    if ("username" in spec.contributor) {
      const contributor = await db.user.findFirst({ where: { username: spec.contributor.username }, select: { id: true } });
      if (!contributor) throw new Error(`No member "${spec.contributor.username}".`);
      contributorUserId = contributor.id;
    } else {
      contributorName = spec.contributor.name;
    }

    const stored = await db.storyEntryContribution.findFirst({
      where: { entryId: entry.id, label: spec.label, ...(contributorUserId ? { contributorUserId } : { contributorName }) },
      select: { id: true, body: true, position: true, submittedAt: true },
    });

    // The fidelity gate, and it only applies where there is something to check
    // against. A relayed quote has nothing on the dossier; a credit has no
    // words at all. Inventing a check for either would be theatre — what they
    // get instead is a record that says plainly how the row came to exist.
    let body: string | null;
    if (spec.source.kind === "credit") {
      body = null;
    } else if (spec.source.kind === "relayed") {
      body = stored?.body ?? spec.source.body;
    } else if (spec.source.kind === "document") {
      // Read out of the design document between its two markers and checked
      // against the SHA. A mismatch means the appendix moved or was edited, and
      // filing from an appendix nobody has re-read is how a contributor's work
      // quietly becomes a slightly wrong copy of itself.
      const source = spec.source;
      const lines = readFileSync(path.join(process.cwd(), "..", "..", source.path), "utf8").replace(/\r\n/g, "\n").split("\n");
      const from = lines.findIndex((line) => line.startsWith(source.fromMarker));
      const to = lines.findIndex((line) => line.startsWith(source.toMarker));
      if (from < 0 || to < 0 || to <= from) {
        throw new Error(`Refusing to file ${credit}'s original for "${entry.title}": the markers in ${source.path} no longer bracket anything.`);
      }
      const extracted = lines.slice(from, to).join("\n").replace(/\n+---\n*$/, "").trim();
      const digest = createHash("sha256").update(extracted).digest("hex");
      if (digest !== source.sha256) {
        throw new Error(
          `Refusing to file ${credit}'s original for "${entry.title}": ${source.path} now hashes to ${digest}, not ${source.sha256}. ` +
          `Somebody edited the appendix. Re-read it, confirm the words are still his, and update the checksum deliberately.`,
        );
      }
      body = stored?.body ?? extracted;
    } else {
      const live = entry.body ?? "";
      const marker = spec.source.upToMarker;
      const cut = marker ? live.indexOf(marker) : -1;
      const captured = (marker && cut >= 0 ? live.slice(0, cut) : live).replace(/\s+$/, "");
      const matches = normalise(captured) === normalise(spec.source.expected);
      if (!stored && !matches) {
        throw new Error(
          `Refusing to file ${credit}'s original for "${entry.title}": what is on the live dossier does not match the checksum in this script, ` +
          `so there is no proof of what they actually wrote. Recover it from StoryRevision or from the member before filing.`,
        );
      }
      body = stored && !matches ? stored.body : captured;
    }

    const position = spec.position ?? 0;
    const provenance =
      spec.source.kind === "credit" ? `credit only — ${spec.source.because}`
      : spec.source.kind === "relayed" ? `${body?.length ?? 0} chars, relayed verbatim by ${spec.source.relayedBy}`
      : spec.source.kind === "document" ? `${body?.length ?? 0} chars read from ${spec.source.path}, checksum matched`
      : `${body?.length ?? 0} chars captured verbatim, checksum matched`;

    if (!stored) {
      changes.push(`file ${credit}'s "${spec.label}" on ${spec.entrySlug} (${provenance})`);
      if (!apply) continue;
      await db.storyEntryContribution.create({ data: {
        id: randomUUID(), entryId: entry.id, contributorUserId, contributorName,
        label: spec.label, body, position, submittedAt: new Date(spec.submittedAt),
        createdByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        id: randomUUID(), entityType: "ENTRY", entityId: entry.id, action: "CREATED", actorUserId: actor.id,
        // The summary does NOT name the contributor, and the first version of
        // this line did. StoryRevision rows ARE carried in the outbound bundle
        // (`snapshot.revisions`), so "Preserved <name>'s original submission …
        // website-only and never exported" shipped a contributor's real name
        // to the game build inside a sentence promising it had not — and the
        // first one it did that to was a nine-year-old's full name.
        //
        // The credit lives on the contribution row, which is structurally
        // unreachable from the bundle. The audit trail only needs to say that
        // a submission was filed and how it was verified; `actorUserId`
        // already records who filed it.
        summary: `Preserved a contributor's original submission on the dossier (${provenance}), website-only and never exported`,
      } });
      continue;
    }

    // Already filed. The stored words are the record now, so a re-run only
    // ever reconciles the metadata around them — a contributor's prose is
    // never silently rewritten by a script that ran a second time.
    const same = stored.position === position && stored.submittedAt.toISOString() === new Date(spec.submittedAt).toISOString();
    if (same) continue;
    changes.push(`reconcile the filing of ${credit}'s "${spec.label}" on ${spec.entrySlug} (position or date only; the words are untouched)`);
    if (!apply) continue;
    await db.storyEntryContribution.update({ where: { id: stored.id }, data: { position, submittedAt: new Date(spec.submittedAt) } });
  }

  console.log(JSON.stringify({ database: identity, mode: apply ? "APPLY" : "PREVIEW", changes: changes.length ? changes : ["unchanged"] }, null, 2));
  if (!apply) console.log("\nDry run. Re-run with --apply to write it.");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
