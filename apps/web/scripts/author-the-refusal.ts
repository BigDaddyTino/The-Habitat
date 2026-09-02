import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";

/**
 * The Refusal — do-not-reconstruct, and why the Forge does not bring the
 * Commander back.
 *
 * Owner ruling, 2026-09-02. The Heartland arc kills Commander Alder Wade with
 * his own statue, and the very next thing anyone in that city would say out
 * loud is "so why hasn't the Forge rebuilt him?" — a question canon could not
 * answer, in a setting whose whole premise is that death is a budget line. The
 * answer is that he refused: he filed a do-not-reconstruct years before the
 * commission, in his own hand, and pulled his own rebuild schematic out of the
 * Core. He had had enough of life.
 *
 * That is a system fact before it is a Heartland fact, so it lands on the three
 * Soul Forge dossiers and on true-death here. The design layer in
 * `design-the-soul-forge.ts` carries the same paragraphs at source, so a future
 * run of that script writes them too — but that script rebuilds its layer by
 * truncation and later passes have appended beneath it, so it is NOT re-run.
 * This inserts the same prose into the live bodies at anchors instead, and
 * skips anything already carrying it. Wade's and Aster's sheets belong to
 * `author-riverlands-people.ts`, and the arc beat to `author-heartland-thread.ts`.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-the-refusal.ts [--apply]
 */

const db = getPrismaClient();

type Insertion = {
  /** Present in the body means this edit is already in. */
  marker: string;
  /** Anchor text in the live body; the replacement carries it through. */
  find: string;
  replace: string;
};

type EntryEdit = {
  slug: string;
  note: string;
  insertions: Insertion[];
  /** Open questions to add, deduplicated against whatever is already there. */
  addQuestions?: string[];
};

const REFUSAL_HELD = `**A Forge also holds refusals.** Beside the register sits a much shorter list: the people who have told the machine not to build them. A **do-not-reconstruct** — a DNR, on every wharf in the world — is filed by the person themselves, at the Forge holding their Echo, and it does two things in the one act. It **withdraws their schematic**, so there is no pattern left to build a vessel to. And it stands as an instruction, so nobody who later controls that reserve can decide the settlement needs them back.

It cannot be filed on anybody else's behalf. Not by a spouse, not by a commander, not by a court, not by a faction that owns the machine outright. A Forge takes a refusal only from the hand and the mouth of the person refusing, witnessed by whoever keeps the machine, and it does not ask why, and it does not argue, and there is no waiting period. Revoking one is the same act reversed: come back, bind again, hand the machine a pattern. **Re-binding revokes a DNR**, and the document says so on its own face, because the one thing this setting will not do is lock somebody inside their worst month.

**A refusal never touches the register.** The Echo stays exactly where it was, lit in the Core, and the machine holds it as long as it holds anything — it simply has nothing to build. What that means for the person is a question canon keeps open and no writer may close casually, and [[brother-aster]] is the reason it is a question at all.`;

const BLUEPRINT_BACK = `**One thing can take the blueprint back.** Nothing removes a Forge from your register but that Forge's destruction; that law stands. What a person can withdraw is the *pattern* — the biological blueprint the middle line of the readout recorded — by filing a do-not-reconstruct in person at the Forge that holds it ([[the-soul-forge]]). The Echo is untouched and the register does not shrink. There is simply nothing left to build to, which is why a refusal is [[reclamation]]'s problem and never this system's, and why binding again revokes it: binding writes a fresh pattern, and a machine with a pattern will build.`;

const FOURTH_OUTCOME = `**And the fourth outcome is a refusal.** A Forge with the reserve, the grade and the Echo will still not build a person who has filed a do-not-reconstruct ([[the-soul-forge]]). This is not a shortfall — nothing is owed and no amount of [[essence]] fixes it. It is not a hold — nobody is waiting. It is the one *no* in this system that money cannot move, and the machine delivers it the way it delivers everything, completely and only about itself: **there is no schematic on file; it was withdrawn.** By whom, when and why are not the Forge's to say. It will repeat that same sentence to a widow, a general and a king.

Write a refusal as [[true-death]] chosen. People opt out of the promise — the very old, the very tired, the ones who have come back so many times they can feel what it cost, the ones who decided a life ought to have an end in it — and it is filed a great deal more often than any wharf admits and discussed a great deal less than it is filed. It is never written as a failure of nerve, a symptom, or a thing a good friend talks somebody out of. A person's own hand on their own end is the single authority this setting does not question, and a character who sneers at a DNR has just told the audience what they are.`;

const CHOSEN = `**And some of it is chosen.** True death is not only what happens to the unlucky. A person can file a **do-not-reconstruct** at the Forge holding their Echo — in person, in their own hand, witnessed by whoever keeps the machine — and withdraw the schematic it would have built them from ([[the-soul-forge]], [[reclamation]]). After that the law above runs exactly as written: nothing is built to receive them, they are gone for good, and the story treats it that way. The only difference is that they wrote it down first, and that the people who loved them get to read it.

A refusal is not the trap this entry describes; it is that trap's mirror. Nobody stumbles into it, nobody can be argued out of it afterwards, and no reserve on earth reverses it. Heartland's Commander filed one — see [[alder-wade]] — and a whole arc turns on a city finding out too late that its most permanent man had quietly stopped being permanent ([[the-fuse-at-heartland]]).`;

const IMPORTER_OLD = "**What an importer has to persist.** Per Forge: the place, the state, the owner, the access policy, the reserve, its grade, and the register.";
const IMPORTER_NEW = "**What an importer has to persist.** Per Forge: the place, the state, the owner, the access policy, the reserve, its grade, the register, and the refusals filed against it.";

const edits: EntryEdit[] = [
  {
    slug: "the-soul-forge",
    note: "the refusal list, who may file one, and what it never touches",
    insertions: [
      { marker: "**A Forge also holds refusals.**", find: IMPORTER_OLD, replace: `${REFUSAL_HELD}\n\n${IMPORTER_NEW}` },
      {
        marker: "never take a refusal from anybody but the person refusing",
        find: "It must never auto-bind anyone anywhere.",
        replace: "It must never auto-bind anyone anywhere. It must never take a refusal from anybody but the person refusing, and it must never be talked, bought or ordered out of one.",
      },
    ],
    addQuestions: [
      "An Echo with no schematic is held forever and can never be built. Is a refused soul still in there — and is that what the Resident is?",
    ],
  },
  {
    slug: "soul-binding",
    note: "a refusal withdraws the pattern, never the Echo; re-binding revokes it",
    insertions: [
      { marker: "**One thing can take the blueprint back.**", find: "**Numbers the build needs:**", replace: `${BLUEPRINT_BACK}\n\n**Numbers the build needs:**` },
      {
        marker: "silently revoke somebody's refusal",
        find: "Never write an automatic re-binding on arrival anywhere.",
        replace: "Never write an automatic re-binding on arrival anywhere — that would silently revoke somebody's refusal, which is the worst thing this system could ever do by accident.",
      },
    ],
  },
  {
    slug: "reclamation",
    note: "the fourth outcome: the one no that money cannot move",
    insertions: [
      { marker: "**And the fourth outcome is a refusal.**", find: "**What comes back, and what does not.**", replace: `${FOURTH_OUTCOME}\n\n**What comes back, and what does not.**` },
      {
        marker: "overturn a do-not-reconstruct",
        find: "And never reclaim anyone whose register holds no living Forge, however sympathetic the moment.",
        replace: "Never reclaim anyone whose register holds no living Forge, however sympathetic the moment. And never let anyone — court, faction, player, or the whole reserve of a kingdom — overturn a do-not-reconstruct. There is no scene in which that works.",
      },
    ],
  },
  {
    slug: "true-death",
    note: "the second road, and it is the only one anybody walks on purpose",
    insertions: [{ marker: "**And some of it is chosen.**", find: "__APPEND__", replace: CHOSEN }],
  },
];

/** Nothing an author wrote may vanish into an edit unnoticed. */
const STOP = new Set("the a an and or but of to in on at is are was were be been being it its this that these those for with as by from not no nor so than then there their they them he she his her you your we our if all any each both few more most other some such only own same too very can will just should now do does did done have has had having into over under again further once here when where why how what which who whom".split(" "));
const contentWords = (value: string) =>
  new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !STOP.has(word)));

async function main() {
  const apply = process.argv.includes("--apply");
  const [identity] = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  const plan: string[] = [];
  let dropped = 0;

  for (const edit of edits) {
    const entry = await db.storyEntry.findUnique({ where: { slug: edit.slug }, select: { id: true, body: true, meta: true } });
    if (!entry) throw new Error(`No entry "${edit.slug}".`);
    let body = entry.body ?? "";
    const applied: string[] = [];

    for (const insertion of edit.insertions) {
      if (body.includes(insertion.marker)) continue;
      if (insertion.find === "__APPEND__") {
        body = `${body.trimEnd()}\n\n${insertion.replace}`;
      } else {
        if (!body.includes(insertion.find)) throw new Error(`${edit.slug}: anchor not found — ${JSON.stringify(insertion.find.slice(0, 60))}`);
        body = body.replace(insertion.find, insertion.replace);
      }
      applied.push(insertion.marker);
    }

    const meta = (entry.meta ?? {}) as Record<string, unknown>;
    const questions = Array.isArray(meta.openQuestions) ? [...(meta.openQuestions as string[])] : [];
    const added = (edit.addQuestions ?? []).filter((question) => !questions.includes(question));
    const nextMeta = added.length ? { ...meta, openQuestions: [...questions, ...added] } : null;

    if (!applied.length && !added.length) {
      plan.push(`unchanged ${edit.slug}`);
      continue;
    }
    plan.push(`update ${edit.slug} — ${edit.note}${added.length ? ` (+${added.length} open question)` : ""} [${(entry.body ?? "").length} -> ${body.length}]`);

    // Insertions only ever add; a missing word means an anchor swallowed prose.
    const lost = [...contentWords(entry.body ?? "")].filter((word) => !contentWords(body).has(word));
    if (lost.length) { dropped += lost.length; plan.push(`  NOT CARRIED: ${lost.join(", ")}`); }

    if (apply) {
      await db.storyEntry.update({
        where: { id: entry.id },
        data: {
          body,
          ...(nextMeta ? { meta: nextMeta as Prisma.InputJsonValue } : {}),
          version: { increment: 1 },
          updatedByUserId: actor.id,
        },
      });
      await db.storyRevision.create({
        data: {
          id: randomUUID(),
          entityType: "ENTRY",
          entityId: entry.id,
          action: "UPDATED",
          actorUserId: actor.id,
          summary: `The Refusal: ${edit.note}. Inserted at anchors; no prior words removed.`,
        },
      });
    }
  }

  console.log(JSON.stringify({ database: identity?.database, mode: apply ? "APPLY" : "PREVIEW", dropped, plan }, null, 2));
  if (!apply) console.log("Dry run. Re-run with --apply to write it.");
}

main().finally(() => db.$disconnect());
