import "../lib/environment";
import { randomUUID } from "node:crypto";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import { stableJson } from "./lib/story-authoring";

/**
 * Port Arcadia, its Chancellor, and one archived leftover.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-arcadia-city.ts [--apply]
 *
 * Port Arcadia's dossier was two documents in one file. The first six
 * paragraphs are finished prose. Everything after them was raw pasted notes —
 * dash bullets, an undefined acronym, "TBD", six misspellings, and a block
 * headed `-Updates_` — and buried in that mess was some of the best
 * worldbuilding in the codex, never once integrated:
 *
 *   - Arcadia is a plutocracy, and the only formal check on the Chancellor's
 *     veto is a ceremonial duel in which a representative risks death.
 *   - Citizenship is earned by service, on a Foreign-Legion model, and it
 *     does not carry the franchise.
 *   - Being poor or a bad soldier does not make you less human, only less
 *     Arcadian.
 *   - Arcadia was the first nation to publicly condemn the use of humans as a
 *     source of Essence.
 *   - The seven districts are arranged to echo the seven phases of corruption.
 *
 * None of that is new canon. It was all already in the body, at CANON status,
 * unreadable. This integrates it into the dossier's own voice and fixes the
 * spelling. Nothing is invented and nothing is dropped.
 *
 * NSoA is expanded to the **Nation-State of Arcadia**, which is not a guess:
 * two district summaries already use that exact name — ASIS is "the
 * intelligence arm of The Nation-State of Arcadia" and the Sovereign Guard is
 * "The Nation-State of Arcadia's Military body headquarters."
 *
 * Also here: [[abraham-islay-kane]], whose dossier was 677 characters of pure
 * physical description with every meta field null — an image-generation brief
 * where a character should be. The notes name him Head of State and give him a
 * second name nothing else in the codex knows. And "The Docks", archived: a
 * blank, parentless, unplaced leftover that `waterfront-district` superseded.
 */
const db = getPrismaClient();

const portArcadiaBody = `Port Arcadia is not just an arrival marker — it is the peninsula's great dock city, and the seat of the **Nation-State of Arcadia**, the only human settlement the peninsula has. A deep-water harbour of stacked piers, cranes, customs houses, warded lighthouses, fish markets, drydocks, and naval yards — the place where the islands' trade, the military's logistics, and every smuggler's ambition meet salt water. The evacuation fleet puts in at its military port; the island's defenders wash up on a storm beach within sight of its walls. Distinct arrivals, same city, and the city can tell which one you were.

Behind the harbour the jungle begins almost immediately — see [[the-peninsula]] for the environment canon. Port Arcadia lives with its back to green walls: cleared roads that the canopy keeps trying to reclaim, jungle produce and jungle dangers in the same markets, expedition outfitters next to shipping offices.

The city is the campaign's first mainland stage: its intelligence net may know what hunts like the thing that took [[tino]], its docks receive every faction's cargo, and its streets hold recruiters, fixers, refugees from the island, and buyers for anything the war shook loose. Stories set here are port stories — arrival, debt, smuggling, press-gangs, information for sale — played against jungle-adventure country a single gate away.

The long hunt, on this ground: Arcadia was an alchemists' port before it was anyone's capital of anything — Extraction Age money laid its foundations, and the oldest quarters stand on refinery vaults, some of them still sealed and still owned. The city's black markets are not a corruption of its character but a continuation of it: magic has been bought, stored, and moved through this harbour for five hundred years, and [[the-drain]] has only raised the prices.

Arcadia is where the party binds again. However they arrived — off the evacuation boats or up a storm beach — they land bound to Kestrel's dead Forge, and something feels wrong before anyone can name what: there is nowhere to come back to. Finding a working Soul Forge and binding to it is the first real task of the mainland, and whoever controls access to it in this city is a question worth a quest ([[soul-binding]]).

And it is the most dangerous ground in the campaign for a reason that has nothing to do with who holds it: the party lands bound to a Forge at the bottom of the sea, and until they bind, a single death ends the run for good ([[true-death]]). The city tells them so itself — [[the-danger-of-true-death]] starts the moment they walk in unbound.

## A city that is also a country

Arcadia is compact, fortified, and set inside a jungle where something in the order of ninety-five percent of the flora and fauna will actively try to kill or disable a person. It is a hard-won island of order: high barriers, elevated systems, constant patrols, and architecture built for defence and for sealing itself quickly. Outside the walls the jungle is a permanent adversary rather than scenery. Survival and collective defence are daily arithmetic here, not abstractions, and that single fact explains most of what looks strange about Arcadian politics from outside.

It is also genuinely difficult to attack, and knows it. Miles of reef make the only navigable sea lanes narrow and closely guarded. The jungle makes a ground assault close to impossible. Above that sits an anti-aircraft network and a small number of closely held military secrets — installations that dampen magic or electronics in their own footprint, of which the city says nothing useful in public and rather a lot in private.

## The plutocracy, and the duel

Arcadia is a plutocracy. Only the wealthy hold the franchise, and they elect a body of representatives. A **Chancellor** oversees the representatives and holds an ultimate veto over every decision they reach.

There is exactly one formal check on that veto, and it is extreme. The representatives must reach absolute unanimity, and then authorise a formal duel in which one of their own number risks death. It is a solemn public gesture aimed at the enfranchised class rather than a mechanism of government — a demonstration that their representatives remain willing, at the last extremity, to stake their lives on a principle. In ordinary times it is almost never used. Everyone knows the number of times it has been.

Electability rests on three things: military service, wealth, and demonstrated ability to survive. The head of state is [[abraham-islay-kane]], Chancellor these fifteen years, whom the city calls the Red Devil of Arcadia and has never once called it to his face.

## What the underclass actually thinks

This is the part outsiders get wrong, and the codex is firm about it: the non-voting population does not resent the arrangement.

They regard the enfranchised as competent stewards carrying heavier responsibility under stricter personal standards — and the enfranchised, for their part, treat political power as a duty rather than a privilege, and are culturally expected to hold the city's security, its essential systems, and its character above private advantage. Both halves of that bargain are believed in. Both are, most of the time, kept.

The sentence an Arcadian would use, without cruelty and without apology, is that being poor or a bad soldier does not make a person less human. It makes them less Arcadian. And underneath it sits the belief that actually organises the society: every Arcadian has potential, and a life that does not meet its potential is a life wasted. Personal excellence and social responsibility are not two things here. They are the same thing said twice, and that is why duty and service are load-bearing rather than decorative.

## Becoming Arcadian

Citizenship is earned. It is not conferred by birth and it cannot be bought.

Outsiders may present themselves for service under a system modelled on a foreign legion (the source note names the French Foreign Legion; the in-world text keeps it generic) — rigorous selection, a multi-year contract, and service given primarily to the defence of the city against the jungle. There is no route that runs through spilled blood alone. Two paths lead out of it: **honourable service**, meaning clean and competent completion of a term of three to five years with good conduct, demonstrated assimilation, and a command recommendation; and **distinguished service**, which accelerates the term on exceptional performance and reliability under lethal conditions and still requires formal review.

New citizens receive full legal belonging and the right to live as Arcadians. They do not receive the franchise. Voting stays with the wealthy, and the separation is accepted because the social contract above already functions without universal suffrage.

Citizenship is the beginning of obligation rather than the end of it. Citizens are expected to keep themselves practically ready for the environment they live in, to uphold Arcadian standards of restraint and conduct, to contribute to the city's defence and maintenance according to ability, to accept limited reserve or emergency call-up if they came through the service path — and to go on trying to be better Arcadians, rather than treating belonging as a finished transaction.

## Character

Exacting gentility. Military service is a point of pride to an Arcadian citizen — not a burden borne, and not confined to the class that governs, though for the political class it is mandatory. Public composure valued highly enough that visible excess of feeling is low-status — though feeling is not absent, only channelled: quiet loyalty, measured pride, dignified grief, understated affection, a protective attachment to the city that Arcadians will not name out loud and will absolutely die for.

National identity is strong and exclusive. Being Arcadian means something concrete and is the highest status a person can hold here. Multiculturalism is minimal; external identities are expected to be absorbed rather than accommodated. There is a deep, unembarrassed mistrust of non-Arcadians, and shared service against the jungle is what cuts across the formal class lines instead.

The city trades on that character through the **Arcadian Sovereign Guard**, the military arm of the Nation-State ([[arcadian-soverign-guard]] for its headquarters). Its elite squads are commissioned by other nations as a premier fighting force and as special operators, and that export of competence is one of Arcadia's primary instruments of influence abroad. It runs the other way too: for a poor citizen, a mercenary career is the most reliable way to change their lot — which is how a great many Arcadians end up on other people's payrolls, including the [[stormglass-cartel]]'s.

## Where Arcadia stands on the Drain

Arcadia was the first nation to publicly condemn the use of humans as a source of [[essence]].

That position is genuinely held and it is also extremely convenient, and the codex does not resolve which weighs more. A city that exports soldiers and imports almost nothing it cannot defend has less need of the human trade than most, and a reputation for principle is worth money in a world where everyone else is compromised. Both things are true. Arcadians do not experience them as being in tension, which is itself the most Arcadian thing about it.

## The seven districts

Arcadia is divided into seven districts, and their arrangement deliberately echoes [[the-seven-phases-of-corruption]] — the ladder written into the shape of a city. **Subtly.** Nothing is labelled, no district is "the Appetite district", and a scene that spells the correspondence out has broken it. What a player should feel is a gradient: elevation, light, and wealth rising together as you climb away from the water, and something in the character of each district that rhymes with a rung.

Two things sit at the top. [[embassy-row]] holds the diplomatic missions of every faction with a presence in the city — and Arcadia keeps no faction *bases*, only accredited presences, each of which is expected to interact with and align itself ideologically with the Nation-State. Directly opposite stands the [[arcadian-special-intelligence-service]] — ASIS, to everyone including itself — which is not an accident of planning and is not presented as one.

**Which factions maintain a presence, and on what terms, is not yet decided.** It is a real open question rather than a gap: the answer sets Arcadia's foreign policy and every faction's early-game access to the city.

## What Arcadia is, in one paragraph

The society is austere, ordered, hierarchical, and self-regarding. It is held together by competence under permanent external pressure, a culture of disciplined duty, a strong but restrained national identity, and a political structure that concentrates authority while demanding visible stewardship from the people who hold it.

Arcadia presents itself as a hard, elegant outpost of civilisation that has turned extreme danger and strict hierarchy into a coherent, working social order.

And the second half of that sentence is the one to write from. It is not a claim the codex adjudicates. It is what the city believes about itself, held with complete sincerity, by people who have earned rather more of it than an outsider expects — and it is still the thing an outsider will find hardest to accept about them.`;

const kaneBody = `Chancellor of the Nation-State of Arcadia — [[port-arcadia]] — for fifteen years, and the only formal power in the city that a unanimous body of representatives can overrule — and then only by authorising a duel in which one of them risks dying to do it.

Arcadia elects on three measures: military service, wealth, and demonstrated ability to survive. Kane cleared all three a long time ago and has been re-clearing the third one ever since.

**The Red Devil.** The name predates the office. He was a heavily decorated combat officer before he was anything else, and what he carries out of that career is written on his face: extensive scarring, worst on the left, and a blinded left eye gone milky. Arcadians call him the Red Devil, or the Red Devil of Arcadia, and they do it with enormous affection and no informality whatsoever. He has never publicly acknowledged the name. He has never asked anyone to stop.

**What he is like.** Stern and completely unhurried. A man of exacting gentility in a culture that prizes it, who has arrived at something close to peace and does not appear to find it restful. He embodies the Arcadian bargain rather than merely presiding over it: power as stewardship, composure as respect, the city's continuity placed above any private advantage, including his own.

**Why he matters to the campaign.** He is the head of the first mainland power the party meets, in the city where they must bind or die for good. Access to Arcadia — to its Forge, its intelligence net, its accredited factions, its road out through the [[exclusion-area]] — runs through an administration he has the last word over. He is not an obstacle and he is not an ally. He is the person whose judgement of what the party *is* determines what the city allows them to do.

**Open, and deliberately so.** What he actually thinks of the war, of the harvest, of the peninsula beyond his walls, and of an unbound party of foreign mercenaries walking into his city carrying a story about something that took a man alive — none of that is written yet.`;

async function main() {
  const apply = process.argv.includes("--apply");
  const actor = await db.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) throw new Error("Authoring requires an active administrator for revision authorship.");

  const changes: string[] = [];

  // --- Port Arcadia -----------------------------------------------------

  const pa = await db.storyEntry.findUnique({ where: { slug: "port-arcadia" }, select: { id: true, body: true, meta: true } });
  if (!pa) throw new Error("port-arcadia is missing.");
  const paMeta = { ...(pa.meta as Record<string, unknown>), openQuestions: [
    "Which factions hold an accredited presence on Embassy Row, and on what terms — this sets Arcadia's foreign policy and every faction's early-game access.",
    "How far the seven districts should be allowed to echo the corruption ladder before the correspondence stops being subtle.",
  ] };
  if (pa.body !== portArcadiaBody || stableJson(pa.meta) !== stableJson(paMeta)) {
    changes.push(`port-arcadia: body ${pa.body?.length ?? 0} -> ${portArcadiaBody.length} chars, notes integrated, spelling fixed`);
    if (apply) {
      await db.storyEntry.update({ where: { id: pa.id }, data: { body: portArcadiaBody, meta: paMeta as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: pa.id, action: "UPDATED", actorUserId: actor.id, summary: "Integrated the pasted worldbuilding notes into the Port Arcadia dossier and corrected the spelling" } });
    }
  }

  // --- Abraham Islay Kane -----------------------------------------------

  const kane = await db.storyEntry.findUnique({ where: { slug: "abraham-islay-kane" }, select: { id: true, summary: true, body: true, meta: true } });
  if (!kane) throw new Error("abraham-islay-kane is missing.");
  const kaneSummary = "Chancellor of the Nation-State of Arcadia for fifteen years, and the Red Devil before that — a scarred, unhurried war veteran whose judgement decides what the city lets the party do.";
  const kaneMeta = {
    fullName: "Abraham Islay Kane",
    aliases: ["the Red Devil", "the Red Devil of Arcadia"],
    pronouns: "he/him",
    sex: null,
    species: "human",
    age: "early sixties",
    // The old body, kept where a physical description belongs. The comparisons
    // are an art-direction reference and are marked as one.
    appearance: "A distinguished senior man in his early sixties with a stern but tranquil expression. Extensive scarring and deformity, most severe on the left side, with a blinded, milky left eye. Strong jaw, deep-set eyes, weathered skin, a neatly trimmed grey-and-white beard. Formal chancellor's attire with subtle military decorations. ART REFERENCE ONLY, not in-world text: the imposing battle-hardened build of Conquest from Invincible crossed with the stoic visage of Marcus Aurelius.",
    voice: "Measured, unhurried, and exact. A man of the Arcadian gentility who treats composure as a form of respect and does not raise his voice to be obeyed.",
    magic: { origin: null, schools: [], corruptionPhase: null, notes: null },
    // Deliberately empty. The Arcadian Sovereign Guard exists as a
    // headquarters REGION and not as a FACTION entry, and a factions[] row
    // pointing at a region is precisely the wrong-namespace error the release
    // audit exists to catch. Recorded as an open question below instead.
    factions: [],
    home: "chancellory-of-arcadia",
    status: {
      known: "Head of state, fifteen years in office, in visibly good health for a man who should not be.",
      actual: null,
    },
    relationships: [],
    storyRole: "The head of the first mainland power the party meets, in the city where they must bind or die for good. Not an obstacle and not an ally — the man whose reading of what the party IS decides what Arcadia allows them.",
    involvement: [],
    gameId: null,
    model: null,
    companion: { capable: false, availability: "Head of state; not recruitable.", status: "In office." },
    openQuestions: [
      "What Kane actually thinks of the harvest, given Arcadia was the first nation to condemn using humans as Essence.",
      "How he reads an unbound party of foreign mercenaries arriving with a story about a man taken alive.",
      "Whether the ceremonial duel has ever been called during his fifteen years, and against what.",
      "The Arcadian Sovereign Guard exists as a headquarters region but not as a faction entry, so Kane's service and the city's whole military arm have nowhere to attach. Arcadia is a nation-state with no faction dossier.",
    ],
  };
  if (kane.body !== kaneBody || kane.summary !== kaneSummary || stableJson(kane.meta) !== stableJson(kaneMeta)) {
    changes.push(`abraham-islay-kane: image brief -> dossier (${kane.body?.length ?? 0} -> ${kaneBody.length} chars, ${Object.values(kaneMeta).filter(Boolean).length} meta fields filled)`);
    if (apply) {
      await db.storyEntry.update({ where: { id: kane.id }, data: { summary: kaneSummary, body: kaneBody, meta: kaneMeta as unknown as Prisma.InputJsonValue, updatedByUserId: actor.id, version: { increment: 1 } } });
      await db.storyRevision.create({ data: { id: randomUUID(), entityType: "ENTRY", entityId: kane.id, action: "UPDATED", actorUserId: actor.id, summary: "Wrote a real dossier for the Chancellor and moved the physical description into the appearance field" } });
    }
  }

  // --- The Docks --------------------------------------------------------

  const docks = await db.storyEntry.findUnique({ where: { slug: "the-docks" }, select: { id: true, status: true } });
  if (docks && docks.status !== "ARCHIVED") {
    changes.push("the-docks: ARCHIVED — a blank, parentless, unplaced leftover superseded by waterfront-district");
    if (apply) {
      await db.storyEntry.update({ where: { id: docks.id }, data: { status: "ARCHIVED", updatedByUserId: actor.id, version: { increment: 1 }, lockedByUserId: null, lockExpiresAt: null } });
      await db.storyRevision.create({
        data: { id: randomUUID(), entityType: "ENTRY", entityId: docks.id, action: "STATUS_CHANGED", actorUserId: actor.id,
          summary: "Archived \"The Docks\" — blank body, no parent, no connections, the Atlas's only unplaced place, superseded by waterfront-district",
          before: { status: docks.status }, after: { status: "ARCHIVED" } },
      });
    }
  }

  for (const change of changes) console.log(`  ${change}`);
  console.log(`\n${changes.length} change${changes.length === 1 ? "" : "s"}.`);
  if (!apply) console.log("Dry run. Re-run with --apply to write it.");
}

main().then(() => db.$disconnect(), (error) => { console.error(error); return db.$disconnect().then(() => process.exit(1)); });
