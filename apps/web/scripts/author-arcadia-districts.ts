import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { stableJson } from "./lib/story-authoring";

/**
 * The eleven Port Arcadia districts, written out.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-arcadia-districts.ts [--apply]
 *
 * Every one of them was a one-line summary and a sentence or two of body —
 * enough to know the place existed, not enough to set a scene in it. The
 * one-liners were good, and everything below grows out of them rather than
 * replacing them; where a summary already said the thing well it is kept.
 *
 * Two pieces of canon organise the whole set, and both came out of the notes
 * buried in the Port Arcadia dossier:
 *
 *   THE LADDER. Seven districts, arranged to echo [[the-seven-phases-of-corruption]]
 *   — subtly. Nothing is labelled and no district is "the Appetite district".
 *   What carries it is the gradient the city already has: elevation, light and
 *   wealth rising together as you climb away from the water, and something in
 *   each district's character that rhymes with a rung. A scene that spells the
 *   correspondence out has broken it.
 *
 *   THE VERTICAL. Northside says it outright — "as the elevation rises so does
 *   the city state's wealth" — and Southside is the floor of that sentence:
 *   low, wet, and favela-built. Arcadia is a stacked city, and altitude is the
 *   plainest reading of a person's standing in it.
 *
 * The four upper-westside destinations and the census office are where the
 * plutocracy material actually lands, so they carry the most weight.
 */
const db = getPrismaClient();

type District = {
  slug: string;
  title?: string;
  summary: string;
  body: string;
  meta?: Record<string, unknown>;
};

const districts: District[] = [
  // --- the seven zones -------------------------------------------------
  {
    slug: "upper-westside",
    summary: "Where the enfranchised live. The highest ground inside the walls, the cleanest air, and every institution that can overrule you.",
    body: `The top of the city in every sense the city measures.

Upper Westside is where the elite of Arcadia congregate, and where wealth, power and influence all intersect inside the same square mile — the franchise with them — and in a plutocracy ([[port-arcadia]]) where only the wealthy vote, that means the electorate of the Nation-State of Arcadia is, functionally, a neighbourhood. Everyone who lives here can vote. Almost nobody who does not live here can.

It reads as restraint rather than opulence, which is the Arcadian style: imported stone, deep colonnades, shutters engineered to seal a house against the jungle in under a minute and never once used in anger. Wealth here is expressed as *readiness* — the enfranchised are expected to have served, and a household that cannot demonstrate its service is a household with a problem it does not discuss.

Four institutions stand inside the district and are covered on their own pages: the [[chancellory-of-arcadia]], the [[arcadian-soverign-guard]]'s headquarters, the [[arcadian-special-intelligence-service]], and [[embassy-row]]. Their proximity is not planning convenience. It is the shape of the state, laid out where the people who run it can walk between them.

**For a party.** Access, not violence. Nothing about Upper Westside is subtle about how unwelcome an armed foreigner is, and everything about it is polite. The district is where permissions are granted, and the party will need several.`,
  },
  {
    slug: "lower-westside",
    summary: "The middle city — offices, government work, tech firms, and the entertainment district that keeps the whole arrangement bearable.",
    body: `The working engine of Arcadian civil life, and the only district where the city visibly enjoys itself.

Below the enfranchised and above the water, Lower Westside is where the city's middle class reside: offices and government buildings, ministries and their contractors, surveyors, engineers, clerks of every grade. Tech-centred businesses thrive here too — the firms that keep the elevated systems and the barrier network running, and a good many that have nothing to do with either. These are the people who make the city function without ever getting a vote for doing it, and they are not bitter about that in any way an outsider would recognise. They are, in the Arcadian phrase, *aspiring* — and the whole district has the slightly strained brightness of somewhere that believes advancement is genuinely available.

It is also the city's entertainment centre and a commercial powerhouse in its own right. Theatres, supper rooms, gambling that is technically licensed, the bars where officers drink out of uniform. Arcadian public composure is prized so highly that the city has quietly zoned a place for it to come off — and everyone understands that what happens in Lower Westside after dark is not held against a person, provided they are composed again by morning.

**For a party.** The most usable district in the city for a foreigner. Contracts get signed here, information circulates, and a stranger buying drinks is not automatically a security matter.`,
  },
  {
    slug: "the-northside",
    summary: "The commercial and agricultural high ground. A third of its buildings are vertical farms, and the light is the best in Arcadia.",
    body: `The commercial and economic hub of the city, and the plainest statement of the rule Arcadia is built on: **as the elevation rises, so does the city-state's wealth and quality of life.**

Northside is a dramatic shift upward from the lower-tiered [[the-southside]] below it. It sits high enough to catch naturally occurring light — an ordinary thing anywhere else and a genuine luxury in a walled city under a jungle canopy line. Roughly a third of its buildings are vertical farms and plantations, stacked growing floors under managed light, and they are the reason Arcadia can refuse to depend on anyone. A city-state that grows its own food inside its own walls is a city-state that can be besieged and shrug.

The rest is commercial: exchanges, brokerages, the offices of concerns that trade the city's surplus outward. Northside money is newer than [[upper-westside]] money and considerably louder about being clean.

The comparison the district cannot escape is downward. Southside is the same city at the bottom of the same slope, and Northside residents have a habit of describing themselves as "not as destitute as the district below" — measuring up by pointing at what they are standing above.

**For a party.** Supply, provisioning, and the expedition economy. Anyone going out into the jungle buys their food here, and the people selling it know exactly what the jungle costs.`,
  },
  {
    slug: "the-southside",
    summary: "The floor of the city. Low, wet, favela-built, bordering the water — and the district where things get done that Arcadia does not admit to.",
    body: `Impoverished, dense, and built upward out of whatever came to hand — the favelas of Southside climb their own walls in a city that measures worth by elevation, which is a joke nobody living there finds funny.

It immediately surrounds the [[waterfront-district]], very urban and pressed hard against the water, and it takes everything the water brings: damp that never leaves the lower floors, the smell of the harbour on a bad tide, and the run-off of every district above it. The light is poor. The buildings lean on each other. It is, by a distance, the most alive part of Arcadia — because it is the only part not performing composure.

This is where the shady dealing happens, in the shadows the favelas cast. Not organised crime in the [[stormglass-cartel]] sense; Arcadia is too small and too watched for that. What Southside runs is the informal economy a rigid society requires in order to stay rigid: unlicensed work, goods that skipped the [[census-office]], papers of uncertain provenance, and passage for people who would rather not be counted.

And it is the district that produces soldiers. For a poor Arcadian, a mercenary career is the most reliable route to changing their lot, and the recruiters know exactly which streets to walk. Southside sends more of its children out to other people's wars than the rest of the city combined, and gets them back, or does not, with the same restraint everyone else manages more easily.

**For a party.** The only district that will not ask what you are. Everything the rest of the city forbids is available here at a price that is never only money.`,
  },
  {
    slug: "east-side",
    summary: "The peninsula's pinnacle ecotourism: beautiful sun, lovely beaches, protected waters — and something sinister nobody has named.",
    body: `The pinnacle of Arcadian ecotourism, and the district that most rewards a suspicious guest.

Beautiful sun, lovely beaches, and protected waters inside the reef line — the one stretch of the peninsula where the jungle has been comprehensively beaten back and kept back, landscaped into something a visitor can walk through safely. Arcadia sells the experience hard: a lethal continent, viewed from a lounger. Visiting dignitaries are brought here. So are prospective investors, and anyone the city wishes to impress with the idea that it has the environment under control.

And something sinister, which the dossier deliberately does not resolve.

The candidates are all mundane on their own: the water is protected in a way that goes well past ecological care and looks a great deal like *containment*; the beaches are patrolled at hours no tourist is awake for; the protected zone's boundary has moved twice and both times outward; and no fishing is licensed anywhere along it, in a city that fishes everywhere else. Each of those has an official answer. Together they have never been given one.

**For a party.** The pleasantest place in Arcadia to become extremely uneasy. Whatever is out past the reef here is a hook that has not been written yet, and the district's charm is the delivery mechanism.`,
    meta: { openQuestions: ["What the East Side protected water is actually protecting — from the sea, or from the city."] },
  },
  {
    slug: "waterfront-district",
    summary: "Where the city touches the sea: piers, cranes, customs, drydocks, and every gram of cargo that enters or leaves Arcadia.",
    body: `The commercial and logistical mouth of the city, and the district the campaign arrives through.

The stretch of city specifically dedicated to the coast and the water, and where much of the city's commercial exchange and logistics occur. Everything Arcadia trades passes across these piers. Stacked wharves and cranes, customs houses, bonded warehouses, drydocks, the naval yards, and the military port where the evacuation fleet puts in. It runs on paperwork and pressure in roughly equal measure, and it is the one place in Arcadia where the composure slips audibly — dockmasters do not have time to be genteel.

It is also the city's control surface. Nothing lands here without being counted, and the [[census-office]] sits inside the district precisely so that the counting of goods and the counting of people happen in the same square mile. The reef makes the sea lanes narrow; the narrow lanes make the harbour controllable; the controllable harbour is a large part of why Arcadia can be as particular as it is about who becomes Arcadian.

Beneath the working surface, the oldest quarters stand on Extraction Age refinery vaults — some sealed, some still owned, and a few of both. Five hundred years of magic has moved across this water, and the black market here is not a corruption of the district's character but the continuation of it.

**For a party.** Landfall, first contact with Arcadian officialdom, and the shortest route to anyone who moves cargo without asking about it.`,
  },
  {
    slug: "exclusion-area",
    summary: "The northern border, opening to the larger jungle — and the only official land exit from Arcadia. Everything beyond it is the green.",
    body: `The one door in the wall, and the district that exists to make using it difficult.

The northern border, opening to the larger jungle. Every land expedition out of Arcadia leaves through the Exclusion Area, and everything that walks back in is stopped here first. It is not a neighbourhood in any ordinary sense — it is a controlled depth of city given over to the transition between order and the jungle: staging yards, quarantine sheds, decontamination, weapon inspection, and the standing garrison that mans all of it.

The name is exact. The area excludes in both directions. It keeps the jungle out, which is what a visitor assumes, and it keeps Arcadians *in* — nobody leaves the walls unrecorded, and the register of who went out and whether they returned is one of the more closely held documents in the city.

Coming back is harder than leaving. An expedition returning from the green is presumed contaminated until it demonstrates otherwise, and the demonstration takes as long as the officer on duty decides it takes. Nobody argues. Ninety-five percent of what lives out there wants people dead, and everyone standing in the inspection line has known someone who came back wrong.

**For a party.** The gate to every jungle quest the peninsula holds, a chokepoint that can be closed against them, and the last piece of Arcadian order they will see before the country stops being governed.`,
  },

  // --- the four institutions of Upper Westside, and the census office ----
  {
    slug: "chancellory-of-arcadia",
    summary: "The seat of government: the representatives, the Chancellor's veto, and the duelling floor that is the only check on it.",
    body: `The primary seat of government of the Nation-State of Arcadia, and the building where the city's one genuine constitutional oddity lives.

The representatives sit here — elected by the enfranchised of [[upper-westside]] and almost nowhere else — and [[abraham-islay-kane]] presides over them with an ultimate veto on everything they decide. Fifteen years of it. The daily business is unremarkable and extremely competent: budgets, barrier maintenance schedules, the standing register of who is outside the walls.

What is not unremarkable is the floor.

The sole formal check on the Chancellor's veto requires the representatives to reach absolute unanimity and then authorise a formal duel in which one of their own number risks death. The floor it happens on is part of the building, maintained, and unused for long stretches — a plain space that the architecture treats with more ceremony than the debating chamber does. Arcadians who have never seen it used can describe it precisely.

The point of the ritual is not to resolve disputes. It is a demonstration aimed at the enfranchised: your representatives will, at the last extremity, stake their lives on a principle. A class that governs because it is willing to die is a class that can ask others to.

**For a party.** Petitions, permissions, and the single room in the peninsula where a foreigner can watch the Arcadian bargain being performed rather than described.`,
  },
  {
    slug: "arcadian-soverign-guard",
    title: "Arcadian Sovereign Guard Headquarters",
    summary: "The military headquarters of the Nation-State of Arcadia — imported marble outside, and the command that rents the peninsula's best soldiers to other nations.",
    body: `The headquarters of the **Arcadian Sovereign Guard**, the military arm of the Nation-State of Arcadia.

The exterior is beautiful and deliberately so: imported marble, immaculately maintained, a building that says the city can afford to spend on appearances because it has already spent enough on defence. Arcadians read it as pride. Visitors are meant to read it as surplus.

The Guard is the institution the whole society is arranged around. Military service is a point of genuine pride rather than an obligation borne; it is one of the three measures of electability alongside wealth and demonstrated ability to survive; and the political class serves as a matter of course, which is the thing that keeps the plutocracy from reading as pure privilege even to the people it excludes.

Its elite squads are commissioned by other nations as premier operators and special-operations units — and that export is one of Arcadia's primary instruments of influence abroad. A city-state too small to project force projects *competence* instead, and gets paid for it in the currency it actually wants, which is leverage.

The same pipeline runs the other way at the bottom. For a poor citizen of [[the-southside]], a mercenary career is the most reliable route to changing their lot, and the Guard's reputation is what makes an Arcadian name worth hiring anywhere on the peninsula.

**For a party.** Foreign mercenaries in a city that sells mercenaries. The Guard's professional interest in them is not hostile, and it is not comfortable either.

*Note: the slug \`arcadian-soverign-guard\` carries an old misspelling and is a frozen export identity, so it stays. The title and prose use the correct spelling.*`,
    meta: { openQuestions: ["The Arcadian Sovereign Guard has a headquarters region but no faction entry, so the peninsula's most-exported military has nowhere to hold standing, relations, or leadership."] },
  },
  {
    slug: "arcadian-special-intelligence-service",
    summary: "ASIS — the intelligence arm of the Nation-State of Arcadia, positioned directly opposite Embassy Row and making no secret of why.",
    body: `The intelligence arm of the Nation-State of Arcadia, known universally as **ASIS**, and sited directly across from [[embassy-row]].

That siting is the institution's entire public posture. Arcadia permits accredited faction presences in its capital and watches them from a building they can see out of their own windows. Nothing is implied and nothing is denied. The city considers open surveillance of guests to be more honest than the alternative, and expects its guests to find that reasonable — which, being professionals, they mostly do.

ASIS is small, and it is the department that most benefits from Arcadia's deep and unembarrassed mistrust of non-Arcadians. A service whose population reports foreigners as a civic habit does not need many officers. What it needs is filing.

The city's intelligence net is the thing the campaign will want. Arcadia counts what lands on its piers, registers what leaves through the [[exclusion-area]], and knows a great deal about movement on the peninsula that no one else has bothered to collate. If anything in the Nation-State knows what hunts like the thing that took [[tino]], it is in this building.

**For a party.** The most valuable and least accessible archive on the mainland, held by the one institution in the city whose job is to be suspicious of exactly what the party is.`,
  },
  {
    slug: "embassy-row",
    summary: "Every faction with a presence in Arcadia keeps its mission here — accredited, ideologically aligned on paper, and directly overlooked by ASIS.",
    body: `Where the diplomats of every ideologically aligned faction reside, in a single overlooked street.

Arcadia permits no faction **bases**. It permits accredited **presences** — and the distinction is the whole of the city's foreign policy. A faction may keep a mission, staff it, and conduct business through it. It may not hold ground, station force, or operate as an authority within the walls. Every presence on the Row is expected to interact with the Nation-State and to align itself ideologically with it, at least in the terms of its accreditation, and everyone signs that language knowing what it is worth.

The [[arcadian-special-intelligence-service]] stands directly opposite. Nobody on the Row pretends this is coincidence.

The Row is consequently the most concentrated diplomatic ground on the peninsula and the least private, and both facts are why it works. Business that would be dangerous anywhere else is conducted here in plain sight, because plain sight is the price of being allowed in at all — and because a faction that abuses the arrangement loses its accreditation, which is a loss no one in this city will help them recover from.

**Not yet decided, and it matters.** Which factions actually hold a presence, and on what terms, is an open question. The answer sets Arcadia's foreign policy, decides which powers the party can reach in Act I without leaving the walls, and determines who is standing across the street from ASIS when something goes wrong.

**For a party.** The fastest route to almost every faction in the game, in the one place where all of them are behaving.`,
    meta: { openQuestions: ["Which factions hold an accredited presence on Embassy Row, and on what terms — this sets Arcadia's foreign policy and every faction's early-game access to the city."] },
  },
  {
    slug: "census-office",
    summary: "Every person entering Arcadia is processed here. It is also where the player settles what they are — the class and trade they will be cleared as.",
    body: `Where Arcadia counts people, and where the game asks the player who they are.

All migration passes through this office, sited inside the [[waterfront-district]] so that the counting of cargo and the counting of people happen within sight of each other. Everyone who lands is processed: registered, assessed, assigned a status, and cleared — or not — into the city.

**Gameplay.** This is where the player fleshes out their class and trade while they wait to be cleared. The waiting is the mechanism: Arcadian processing is unhurried by design, the queue is long, and the questions are exhaustive, so the interrogation *is* the character sheet. What the player tells a clerk about what they can do becomes what Arcadia has on file about them — and the city acts on its files.

Clearance is not citizenship and the office is careful to say so. Citizenship is earned by service under the terms set out in [[port-arcadia]], takes years, and does not carry the franchise even then. What the Census Office grants is permission to be present, which can be revoked, and a status that follows a person through every checkpoint they meet afterwards.

The clerks are courteous, extremely thorough, and entirely unmoved by hurry. They are also, in the Arcadian way, not hostile: a foreigner who answers plainly is treated plainly. The mistrust is structural rather than personal, which somehow makes it harder to argue with.

**For a party.** The first Arcadian institution they meet, the origin of their legal status in the city, and a file that exists on them from that moment on.`,
  },
];

/**
 * Every content word the author already wrote, checked for survival.
 *
 * Rewriting somebody's prose is the easiest way in this codebase to lose
 * something quietly — a rewrite of the Port Arcadia dossier silently dropped
 * two real claims, including the paragraph the whole document was building
 * toward, and it took a word-level diff to find them. The one-line summaries
 * below are the owner's, they are load-bearing, and a rewrite that does not
 * carry them is a rewrite that deleted canon.
 *
 * Reported on every dry run so the loss is visible before it is written.
 */
const STOP = new Set("the a an and or but of to in on at is are was were be been being it its this that these those for with as by from not no nor so than then there their they them he she his her you your we our if all any each both few more most other some such only own same too very can will just should now do does did done have has had having into over under again further once here when where why how what which who whom".split(" "));
const contentWords = (value: string) =>
  new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !STOP.has(word)));

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");

  let written = 0;
  let dropped = 0;
  for (const district of districts) {
    const entry = await db.storyEntry.findUnique({ where: { slug: district.slug }, select: { id: true, title: true, summary: true, body: true, meta: true } });
    if (!entry) throw new Error(`No entry "${district.slug}".`);
    const title = district.title ?? entry.title;
    // Districts keep their sheet; only the open questions are contributed.
    const meta = district.meta ? { ...(entry.meta as Record<string, unknown>), ...district.meta } : entry.meta;
    const unchanged = entry.title === title && entry.summary === district.summary && entry.body === district.body && stableJson(entry.meta) === stableJson(meta);
    if (unchanged) continue;
    written += 1;
    console.log(`  ${district.slug.padEnd(38)} body ${String(entry.body?.length ?? 0).padStart(4)} -> ${district.body.length}${entry.title !== title ? `  title: "${entry.title}" -> "${title}"` : ""}`);

    // Nothing the author wrote may vanish into a rewrite unnoticed.
    const before = contentWords(`${entry.summary ?? ""} ${entry.body ?? ""}`);
    const after = contentWords(`${district.summary} ${district.body}`);
    const lost = [...before].filter((word) => !after.has(word));
    if (lost.length) { dropped += lost.length; console.log(`      NOT CARRIED: ${lost.join(", ")}`); }
    if (apply) {
      await db.storyEntry.update({ where: { id: entry.id }, data: { title, summary: district.summary, body: district.body, meta: meta as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: entry.id, action: "UPDATED", actorUserId: actor.id, summary: `Wrote the district dossier for "${title}"` } });
    }
  }

  console.log(`
${written} district${written === 1 ? "" : "s"} written, ${dropped} author word${dropped === 1 ? "" : "s"} not carried over.`);
  if (!apply) console.log("Dry run. Re-run with --apply to write it.");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
