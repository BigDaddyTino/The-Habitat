import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { BoardWriter } from "./lib/story-authoring";

/**
 * The Lamplight Road's flags, as bible entries.
 *
 * Caught by the arc page's own ripples panel saying "Nothing reaches out of
 * this story yet" under a board that plants fourteen flags. The reason is in
 * story-authoring.ts's own warning: **a FLAG slug appearing in a node's
 * effects or an edge's condition is what makes the promise ledger record it.
 * Prose alone reads well and counts for nothing.** `scanStoryFlagSites` starts
 * from FLAG entries and looks for their slugs; with no entry, a flag is a
 * sentence nobody can query.
 *
 * Not every flag earns one. The board's in-arc bookkeeping — which passage was
 * bought at the gate, whether the chamber's evidence was tabled — is that
 * quest's own machinery and canon says so out loud. These five are the ones
 * that are either **read as a branch condition** or **carried out of the arc**,
 * and the law is the same for both: never plant one without deciding where it
 * is answered.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-lamplight-flags.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-lamplight-flags.ts --apply
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");

const flags = [
  {
    slug: "the-veto-held",
    title: "The Veto Held",
    summary: "Arcadia's chamber reached unanimity, called the duelling floor for the first time in fifteen years, and lost. The Southside was not walked out.",
    body: `Set on [[the-lamplight-road]] when the Clearance falls — whether [[abraham-islay-kane]] answered for himself at sixty-one or a foreign contractor answered for him.

**What it means going forward.** [[the-southside]] is still standing and its unbound are still in it. [[the-radiant-path]] leaves [[port-arcadia]] on its own terms rather than at bayonet point, so the procession that reaches [[heartland]] is a pilgrimage and not a deportation — the same road, the same camp, the same graves, and a completely different crowd walking it.

**And the chamber has learned it can reach unanimity.** It took fifteen years to find out. It will take less next time, and Kane says so himself, once, sitting down.

**Answered in:** the Riverlands, by which kind of crowd arrives at Heartland's gate — and by whoever writes what Arcadia does on its second attempt.`,
  },
  {
    slug: "crane-made-it-a-war",
    title: "Crane Made It A War",
    summary: "A second catcher wagon burns in the deep green, out of Arcadian reach, and the Radiant Path stops being a religious question.",
    body: `Set on [[the-lamplight-road]] when [[ivo-crane]] burns an [[aegis-extraction-consortium]] catcher wagon four days up the inland road, where there is no jurisdiction within sixty kilometres and no possibility of calling it anything else.

**What it changes.** Every institution on the peninsula reprices the movement in the same week. [[the-asis-officer]] stops being reasonable and is honest about the moment it happened. Aegis stops treating the road as a freight problem. And inside the movement, Crane wins the argument he has been losing to [[ilse-vetch]] for a year — at exactly the point a sympathetic player most needs him to lose it.

**Answered in:** [[heartland]], which receives the procession under whichever reading of it this flag has already produced.`,
  },
  {
    slug: "floor-answered-by-party",
    title: "The Foreigner Answered",
    summary: "A foreign contractor fought for the Chancellor's veto on the Arcadian duelling floor, in front of the enfranchised, in the one room where the city's bargain is performed rather than described.",
    body: `Set on [[the-lamplight-road]] when the party takes the floor for [[abraham-islay-kane]] against [[ottoline-vasque]].

Arcadian law names only the representative's risk. It has never said who answers for the Chancellor, because it had never been called — so the chamber decided in about four seconds, and what it decided is now on the record.

**What it costs.** The party's standing in [[port-arcadia]] moves sharply in both directions at once. Some of that gallery will never forgive it. Some of them will hire them. Kane thanks them in the coldest sentence he says in the act, and wants them to work out why he did not ask.

**Answered in:** the Riverlands, by who is willing to deal with the party once word travels — and by Arcadia, the next time the floor is called.`,
  },
  {
    slug: "took-the-asis-commission",
    title: "The Commission Taken",
    summary: "The party owes Arcadian intelligence a report on the Radiant Path — accepted honestly, or accepted with no intention of filing it.",
    body: `Set on [[the-lamplight-road]] when the party accepts [[the-asis-officer]]'s commission at [[the-quiet-office]].

She wants eyes at [[lamplight]] and would prefer them to be the party's. She is patient, she is sourced, and she says at the start that she will be reasonable for exactly as long as reasonable works — which is not a threat and lands as one anyway.

**Read at:** the Chancellor's audience, where a party carrying Arcadian paper can ask [[abraham-islay-kane]] a question it could not otherwise ask, and where the Chancellor and his own intelligence service end up running the same errand through the same person without her being told.

**Answered in:** whether the report is ever filed, and what is in it.`,
  },
  {
    slug: "stood-in-the-field",
    title: "Stood In The Field",
    summary: "The party stood among the three hundred and eleven stones with the Marker, and did not leave without understanding what the field is.",
    body: `Set on [[the-lamplight-road]] at [[the-stone-field]], however the party spends the hour: showing the count to [[ilse-vetch]], asking the Marker what she wants for the stones, or saying nothing and helping her cut one.

The field is the third ledger, and the only one of the three that is not paper. [[the-platform-ledger]] says who came back. [[choir-ledger-page]] says who owes for it. **The stones say who never came back at all**, and a ledger can be called a forgery where a field cannot.

**Read at:** the arrival. A party that never stood here cannot follow what is left of the movement up the road, because they never saw what it costs.

**And [[the-unregistered]] hear about it.** They hear about all of them. They do not forget who buried their dead.`,
  },
];

async function main() {
  const identity = (await db.$queryRawUnsafe<{ current_database: string }[]>("select current_database()"))[0]?.current_database;
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  const writer = new BoardWriter(db, actor.id, apply);

  for (const flag of flags) await writer.flag(flag.slug, flag.title, flag.summary, flag.body);

  // Every flag here has to be genuinely present on the board, or it is a
  // promise with no site and the ledger would carry a row nobody can reach.
  const arc = await db.storyArc.findUnique({ where: { slug: "the-lamplight-road" }, select: { id: true } });
  if (!arc) throw new Error("the-lamplight-road is not open.");
  const [nodes, edges] = await Promise.all([
    db.storyNode.findMany({ where: { arcId: arc.id }, select: { key: true, effects: true } }),
    db.storyEdge.findMany({ where: { arcId: arc.id }, select: { condition: true, effects: true } }),
  ]);
  const haystack = [
    ...nodes.flatMap((node) => node.effects),
    ...edges.flatMap((edge) => [...edge.effects, edge.condition ?? ""]),
  ].join("\n");
  const orphans = flags.filter((flag) => !haystack.includes(flag.slug)).map((flag) => flag.slug);
  if (orphans.length) throw new Error(`These flags have no site on the board: ${orphans.join(", ")}`);

  writer.report(apply ? "The Lamplight Road's flags — APPLYING" : "The Lamplight Road's flags — dry run");
  console.log(JSON.stringify({ database: identity, mode: apply ? "APPLY" : "PREVIEW", sitesVerified: flags.length }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
