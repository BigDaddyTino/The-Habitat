import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { BoardWriter } from "./lib/story-authoring";

/**
 * Three joins the campaign already has in prose and had never declared.
 *
 * Found by crawling the boards rather than by reading the map: every arc,
 * every card, every effect and condition and wiki-link, diffed against the
 * joins `getCampaignAtlas` can actually derive. The map was not lying — it can
 * only see two things, a `continuesIn` and a FLAG slug, and all three of these
 * connections were written as a sentence instead.
 *
 *   1. **The Cell Opens → The Lamplight Road.** The map's one "chapters
 *      nothing connects" gap. The Lamplight Road's own opening card cites the
 *      previous chapter by slug in its first paragraph — *"[[the-captivity-arc]]
 *      opened with the only fact that matters: nobody is looking for Tino"* —
 *      and the Captivity Arc's ending hands over "a direction", which is the
 *      trail Lamplight opens on. Authored, undeclared.
 *
 *   2. **Bound to Arcadia → The Captivity Arc.** An ENDING in the middle of
 *      the campaign with nothing leading out of it, which the map reports as
 *      an ending that stops. Binding already reaches the Captivity Arc by
 *      `has-the-tino-file`, and the arc's own last line says Act I begins
 *      here — so the chapter road exists and only the column was empty.
 *
 *   3. **The Danger of True Death ← Binding in Arcadia.** Filed under "boards
 *      nothing reaches" while its first card says outright that it is the same
 *      walk the mainline makes in Binding in Arcadia, told from the rule's
 *      side, ending at the same machine. It hangs off the landfall, and it
 *      needed a flag to say so: the party is on the mainland bound to a Forge
 *      at the bottom of the sea, and that is what starts the quest.
 *
 * What this script deliberately does **not** do is invent the fourth. The
 * seven Bloomfall Reach boards are genuinely unjoined to the campaign — they
 * chain to each other and nothing reaches them from the mainline — and the map
 * is right to say so. A map that stitches its own holes shut is worse than no
 * map, and that goes double for a script.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-campaign-joins.ts
 *   pnpm --filter @habitat/web exec tsx scripts/author-campaign-joins.ts --apply
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");

/**
 * The one flag this run plants. Set where both roads land and read where the
 * quest that exists to explain the rule begins — which is the whole of its
 * life, and the reason it is a flag rather than a sentence.
 */
const unbound = {
  slug: "unbound-on-the-mainland",
  title: "Unbound On The Mainland",
  summary: "The party reached Port Arcadia still bound to a Soul Forge at the bottom of the sea. Until they bind again, one death ends everything.",
  body: `Set on [[binding-in-arcadia]] at landfall, by either road — the storm beach or the military docks. It is true of every party that reaches the mainland, because [[forward-camp-kestrel]]'s Forge went down with the island and nothing has replaced it yet.

**What it is for.** [[the-danger-of-true-death]] is the same walk told from the rule's side, and this is the state that starts it. An Echo with nowhere to answer is a feeling before it is a fact; the fact arrives when somebody in [[port-arcadia]] says it plainly. The mainline's search for the city's Forge is where the party actually does something about it, and both quests end at the same machine ([[the-soul-forge]]).

**Answered in:** the binding itself. This is a window rather than a standing state — it is planted in order to be cancelled, and Binding in Arcadia ends by cancelling it. While it holds, a single death ends the run for whoever it happens to ([[true-death]]).

**Writers:** do not let the game bind the party automatically to spare them the walk. The window is the point.`,
};

async function main() {
  const identity = (await db.$queryRawUnsafe<{ current_database: string }[]>("select current_database()"))[0]?.current_database;
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");
  const writer = new BoardWriter(db, actor.id, apply);

  // 1 + 2 — the two chapter roads, declared where the game export reads them.
  await writer.handoff("the-captivity-arc", "the-cell-opens", "the-lamplight-road");
  await writer.handoff("binding-in-arcadia", "bind-to-arcadia", "the-captivity-arc");

  // 3 — the flag, its site, and the branch that reads it. All three, or none:
  // a flag with no site is a promise nobody can reach, and a site with no
  // entry is a sentence nobody can query.
  await writer.flag(unbound.slug, unbound.title, unbound.summary, unbound.body);
  await writer.effects("binding-in-arcadia", "arcadia-landfall", [`set flag: ${unbound.slug}`]);
  await writer.edge("the-danger-of-true-death", {
    from: "nothing-answers",
    to: "find-a-forge",
    condition: `${unbound.slug} — the party landed still bound to a Forge at the bottom of the sea`,
  });

  // The same check `author-lamplight-flags` makes, for the same reason — a flag
  // with no site is a promise nobody can reach — but asked the way
  // `scanStoryFlagSites` asks it, because a guard that reads the board
  // differently from the scanner is a guard that passes the wrong runs.
  //
  // The scanner's definition, exactly: a flag is **set** where its slug is in a
  // node's effects or an edge's effects, and **checked** where its slug is in an
  // edge's *condition*. Nothing else counts, prose least of all. Keeping the two
  // lists apart is the point — merging them into one haystack and sorting by
  // line prefix, which is what this did first, lets one badly-worded effect
  // line answer its own promise.
  //
  // Only after a write, because this run is what creates both sites: a first
  // dry run has nothing to verify yet, and says so rather than passing quietly.
  if (apply) {
    const boards = ["binding-in-arcadia", "the-danger-of-true-death"];
    const [nodes, edges] = await Promise.all([
      db.storyNode.findMany({ where: { arc: { slug: { in: boards } } }, select: { effects: true } }),
      db.storyEdge.findMany({ where: { arc: { slug: { in: boards } } }, select: { condition: true, effects: true } }),
    ]);
    const touches = (text: string | null) => text !== null && new RegExp(`(^|[^a-z0-9-])${unbound.slug}([^a-z0-9-]|$)`).test(text);
    const planted = [...nodes.flatMap((node) => node.effects), ...edges.flatMap((edge) => edge.effects)].some(touches);
    const answered = edges.some((edge) => touches(edge.condition));
    if (!planted || !answered) {
      const fault = planted ? "planted but never read" : answered ? "read but never planted" : "neither planted nor read";
      throw new Error(`${unbound.slug} is ${fault}.`);
    }
  } else {
    console.log(`\nThe site check runs on --apply: this run is what writes both halves of ${unbound.slug}.`);
  }

  writer.report(apply ? "The campaign's undeclared joins — APPLYING" : "The campaign's undeclared joins — dry run");
  console.log(JSON.stringify({ database: identity, mode: apply ? "APPLY" : "PREVIEW" }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
