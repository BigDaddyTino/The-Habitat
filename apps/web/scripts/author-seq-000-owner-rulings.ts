import "../lib/environment";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getPrismaClient, type Prisma } from "@habitat/db/client";
import {
  carryServerOwnedMeta,
  characterMetaSchema,
  factionMetaSchema,
  regionMetaSchema,
  systemMetaSchema,
} from "../lib/story-meta-schemas";
import { stableJson } from "./lib/story-authoring";

/**
 * Applies Tino's 2026-08-31 SEQ-000 owner rulings to the live Codex.
 *
 * Preview:
 *   pnpm --filter @habitat/web exec tsx scripts/author-seq-000-owner-rulings.ts
 *
 * Apply:
 *   pnpm --filter @habitat/web exec tsx scripts/author-seq-000-owner-rulings.ts \
 *     --apply \
 *     --confirm=SEQ-000-OWNER-RULINGS-LIVE \
 *     --source=post-seq-000-v1
 *
 * This is deliberately a closed authoring path. It reads only the named
 * entries and the two named nodes in the named arc, verifies exact source
 * fingerprints, writes a target-only preimage, and commits the complete
 * entry/node/edge/link package in one serializable transaction.
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");
const confirmation = process.argv.find((value) => value.startsWith("--confirm="))?.slice("--confirm=".length) ?? "";
const suppliedSource = process.argv.find((value) => value.startsWith("--source="))?.slice("--source=".length) ?? "";

const CONFIRMATION = "SEQ-000-OWNER-RULINGS-LIVE";
const SOURCE_MARKER = "post-seq-000-v1";
const ARC_SLUG = "the-island-is-already-lost";
const NODE_KEY = "seq-000";
const NEXT_NODE_KEY = "live-from-the-island";
const ROOFTOP_NODE_KEY = "the-roof-and-the-rider";
const EDGE_KEY = "seq-000-to-live-from-the-island";
const SITE_SLUG = "stormglass-recruitment-camp";
const FORBIDDEN_ISLAND_TYPO = ["Ig", "it"].join("");

const SOURCE_SLUGS = [
  "attributes",
  "character-classes",
  "enlistment",
  "steve",
  "stormglass-cartel",
  "the-captured-rider",
  "the-kestrel-scout",
  "the-look-of-the-world",
  "transportation",
  "tropic-pearl-trade-house",
  "wendy",
] as const;

const TARGET_SLUGS = [...SOURCE_SLUGS, SITE_SLUG] as const;

const NODE_LINK_SLUGS = [
  "attributes",
  "character-classes",
  "enlistment",
  "steve",
  "stormglass-cartel",
  "stormglass-recruitment-camp",
  "the-red-forest",
  "the-starting-island",
  "the-three-origins-of-magic",
  "tino",
  "transportation",
  "wendy",
] as const;

const EXPECTED_SOURCE = {
  attributes: {
    kind: "SYSTEM",
    status: "CANON",
    version: 2,
    fingerprint: "1c3e80280489f70256cda5667e98aa503a5c83ddbc9b436b4583a581debfdb53",
  },
  "character-classes": {
    kind: "SYSTEM",
    status: "CANON",
    version: 4,
    fingerprint: "d814a999d96d6b96ea813f682347a7b3e050f3ba8dedae410f3da572d5997423",
  },
  enlistment: {
    kind: "SYSTEM",
    status: "PROPOSED",
    version: 2,
    fingerprint: "042297e9b9b7595655eacdab515ec42a83ab535e44553aa6c638c14a92110fb8",
  },
  steve: {
    kind: "CHARACTER",
    status: "CANON",
    version: 10,
    fingerprint: "0e96dc8fc6a2ff5fcd2fbc63e7ec2edb1190ff14fe9b1d5e8fb6a9b0e277d539",
  },
  "stormglass-cartel": {
    kind: "FACTION",
    status: "CANON",
    version: 8,
    fingerprint: "2c11d154ed78d58f376cf313232b728543b3dd39fd0c1d06f7c4362a458b6d96",
  },
  "the-captured-rider": {
    kind: "CHARACTER",
    status: "PROPOSED",
    version: 3,
    fingerprint: "1db648760569972473f26102d728b37520686f44879b224a5435cc0dcc6d4f7c",
  },
  "the-kestrel-scout": {
    kind: "CHARACTER",
    status: "PROPOSED",
    version: 3,
    fingerprint: "7170cd64ad076a5dde2f2c8ce7f9e9ef6a7e5ab643b4913b6613e6d1d1b761c8",
  },
  "the-look-of-the-world": {
    kind: "RULE",
    status: "CANON",
    version: 3,
    fingerprint: "7f69b862cbcc22a5a0e8c4531647a7b2802a14bd476948661c2549d9cf50ee47",
  },
  transportation: {
    kind: "SYSTEM",
    status: "CANON",
    version: 2,
    fingerprint: "167a1a3b8ecebd7c28cf5b74d76779e48776d37e7f45a8042c2d7a3fefd4c666",
  },
  "tropic-pearl-trade-house": {
    kind: "FACTION",
    status: "CANON",
    version: 10,
    fingerprint: "ada9e73c96cb87ac839392f5d6a4354a24792fde363e007834976937b17aa58c",
  },
  wendy: {
    kind: "CHARACTER",
    status: "PROPOSED",
    version: 1,
    fingerprint: "594d11d790fc5160e3d598ef7dd1be5a78ba4a0aeae2208635caccd97950a782",
  },
} as const;

const REVISION_SUMMARIES = {
  attributes: "SEQ-000 owner ruling: exposed numeric creation attributes and bounded class allocation",
  classes: "SEQ-000 owner ruling: separated backgrounds from the Eight Trees classes",
  enlistment: "SEQ-000 owner ruling: made the Red Forest camp creation flow canon",
  enlistmentStatus: "SEQ-000 owner ruling: promoted the resolved enlistment sequence to canon",
  look: "SEQ-000 owner ruling: normalized the visible creature name to Hypogriff",
  capturedRider: "SEQ-000 owner ruling: normalized the captured rider's visible Hypogriff references",
  kestrelScout: "SEQ-000 owner ruling: normalized the scout's visible Hypogriff references",
  pearl: "SEQ-000 owner ruling: normalized Pearl's visible Hypogriff references",
  site: "SEQ-000 owner ruling: created the Stormglass Recruitment Camp in the Red Forest",
  steve: "SEQ-000 owner ruling: made Steve the healed Blue Spiral deployment escort",
  stormglass: "SEQ-000 owner ruling: established Blue Spiral as Steve's internal Cartel crew",
  transportation: "SEQ-000 owner ruling: established separate Stormglass deployment pods",
  wendy: "SEQ-000 owner ruling: fixed Wendy at the Red Forest recruitment camp and later survival",
  wendyStatus: "SEQ-000 owner ruling: promoted Wendy's resolved dossier to canon",
  node: "SEQ-000 owner ruling: authored the opening character-creation scene",
  edge: "SEQ-000 owner ruling: connected character creation to the opening cinematic",
  rooftop: "SEQ-000 owner ruling: normalized the rooftop scene's visible Hypogriff references",
} as const;

const EXPECTED_ROOFTOP = {
  status: "CANON",
  version: 1,
  fingerprint: "fd4b1693cc20e80518c54df6ddc3b3e821f47949f8143cc3aa80e1c9e4b81f26",
} as const;

const STEVE_OLD_MARKER = "\n\n## SEQ-000 — the same desk";
const STEVE_NEW_MARKER = "\n\n## SEQ-000 — Blue Spiral escort";
const ENLISTMENT_CANON_MARKER = "## Canon v3 — SEQ-000 owner ruling";
const ENLISTMENT_HISTORY_MARKER = "\n\n---\n\n## Superseded v1/v2 design history\n\n";
const TRANSPORT_MARKER = "\n\n## Stormglass deployment pods";
const STORMGLASS_MARKER = "\n\n## Blue Spiral and the recruitment line";

const WENDY_BODY = `Wendy runs the intake table at [[stormglass-recruitment-camp]], a [[stormglass-cartel]] site under the canopy of [[the-red-forest]]. She processes the player before deployment to [[the-starting-island]]. She is not at Kestrel, is not on Ignit Island when the Strike lands, and remains alive to appear later in the Red Forest.

The queue is part of her scene. She has worked through hundreds of recruits this month, the Cartel is losing an island, and every extra breath at the desk belongs to somebody waiting behind you. Her contempt is throughput rather than cruelty.

She sends the recruit first to the wardrobe pod on her right, with [[steve]] as escort. When they return groomed and in uniform, she opens the visible service file on the tablet. The player records name, home, history, class, magical origin where applicable, and numeric [[attributes]], reviews the complete file, and signs. Wendy calls the attribute screen the “Brains Test.” It is an insult, not a separate test and not a hidden mechanic. The sequence itself is documented in [[enlistment]].

Her background is Materiel. She runs a desk and a ledger, handles deployment doses, and does not take them. When the completed file gives her the assignment she wants, she sends the recruit and Steve toward [[tino]] in a two-person deployment pod.

## Appearance

CASTING / GENERATION REFERENCE ONLY — an attractive adult Native American woman with a curvy, athletic build in Stormglass fatigues. This is a production reference, not an in-world ethnicity. Exact age, face, hair, and production model are TBD — ask Tino.

## Voice

Economy first. Short declaratives. She does not ask what she can already read and never explains the world to an audience. Profanity is situational and sparing. She is constantly aware of the queue.

WENDY: “Look at this sad sack of shit. First things first: go get cleaned up and in uniform before dragging your ass in front of me again. Go with Steve. He’ll get you straightened out.”

After the wardrobe pod, she looks up once.

WENDY: “Ahh. That’s better.”

If the recruit completes the file without making her repeat herself, she gives them the one beat they earned.

WENDY: “Good. You listen.”

Then she finds the deployment to Tino and laughs. The queue moves again.`;

const WENDY_SUMMARY = "The hard-edged Stormglass clerk who runs SEQ-000 at the Red Forest recruitment camp, sends the player toward Tino, and survives to return later in the region.";

const SITE_BODY = `[[stormglass-recruitment-camp]] is the Cartel’s intake choke point beneath the crimson canopy of [[the-red-forest]]. It is a temporary military worksite, not a town: canvas, mud, generator hum, cargo marks, armed staff, and a queue that reforms faster than [[wendy]] can clear it. Red pollen stains everything the same color except the fresh Stormglass uniforms.

The recruitment tent is the camp’s center of gravity. Wendy’s table faces the queue. The automated wardrobe pod stands immediately to her right, close enough for [[steve]] to walk a recruit over and return to his guard post without losing sight of the desk. It grooms, tailors a uniform, and exposes the player’s appearance controls in-world.

The deployment pods are a separate machine line to the left. They are two-person, rocket-like capsules in blast-scarred revetments: disposable, uncommon, fast, and unreliable. The Cartel uses them when moving troops to a front matters more than recovering the hardware. Their place in the wider travel network belongs to [[transportation]].

The camp’s rhythm is pure [[stormglass-cartel]]: recruits enter as people and leave as signed files, issued uniforms, and counted cargo. Steve wears his Blue Spiral crew mark while guarding the recruitment line and handling the player’s deployment during SEQ-000; that does not establish the whole crew as the camp’s assigned unit. The player and Steve depart from here for [[the-starting-island]].

The camp has no authored Atlas point yet. Its exact clearing, approach road, and later fate are TBD — ask Tino.`;

const SITE_META = regionMetaSchema.parse({
  type: "site",
  settlementTier: null,
  parent: "the-red-forest",
  biome: "A muddy recruitment clearing beneath the dense crimson canopy.",
  control: [{ faction: "stormglass-cartel", kind: "holds" }],
  population: "Rotating Stormglass clerks, guards, recruits, pod crews, and the queue.",
  connections: [{
    to: "the-starting-island",
    by: "disposable two-person deployment pod",
    notes: "Fast and unreliable troop delivery used for the SEQ-000 deployment toward Ignit Island.",
  }],
  status: "Operational during SEQ-000; exact later fate is not yet decided.",
  veilAnchorTier: null,
  soulForge: null,
  gameTag: null,
  openQuestions: [
    "Exact Atlas placement within the Red Forest: TBD — ask Tino.",
    "What becomes of the camp after SEQ-000: TBD — ask Tino.",
  ],
});

const ATTRIBUTES_BODY = `Six attributes, each a rung from 0 to 9. The player sees their starting numeric values on the enlistment tablet while building and confirming the service file. After that file is signed, ordinary field presentation returns to the body: an attribute is not a permanent HUD bar, and the world usually reports it by behaving differently around you.

## Starting allocation at enlistment

The selected Eight Trees class sets the recruit’s base attribute-point total and default allotment. The player then receives exactly two additional points to place wherever species ceilings allow. They may also subtract no more than one point from one class-allotted attribute and move that one point to another attribute. This is a single one-point reassignment, not a free respec. Species ceilings remain hard throughout creation.

The exact base total and default allotment for each class are TBD — ask Tino. Do not invent that table from later growth bonuses.

**Your level is the sum of your six rungs.** That is not a metaphor — it is [[the-soul-forge]]’s measure of how much body there is to rebuild, and [[reclamation]]’s arithmetic runs straight off it: 35 Essence to build a body at all, plus 11.7 for every level. A raw recruit is level 7 to 14. Canon’s developed character at level 30 averages rung 5 and quotes at 386. Every ceiling at once would be 54, would cost 667, and has never happened to anybody.

**Conditioning** — load, output, endurance. Low reads as winded on a stair he used to take at a run. High reads as still working when the shift that relieved him has gone to bed. Driven by distance under load, real food, and a medic who makes you rest; falls with bad air, and with phase 2.

**Coordination** — precision and reaction. Low reads as a signature that has changed shape. High reads as reloading without looking down. Driven by precise action under stress — a reload while being shot at counts, a reload on the range does not. Phase 1 takes it first.

**Resilience** — trauma and toxin tolerance. Low reads as infections that should have cleared. High reads as wounds that should have put him down and did not. Driven by surviving things, by medicine, and by good prosthetics. Phase 6 raises it, which is the worst possible way to get it.

**Acuity** — senses and processing. Low reads as learning things when he is told them. High reads as answering a question nobody asked out loud. Driven by reads that turned out right, and by optics worth more than the rest of your kit. Phase 4 raises it, which is why a corrupted spotter is worth an argument.

**Composure** — nerve, and the capacity to refuse. Low reads as snapping at nothing and asking when the next issue is due. High reads as a room going quieter because you are. Driven by holding under fire, by rest, and by a real meal. Phase 3 takes it hardest — the debt eating the only thing that could refuse it.

**Conductivity** — how much Essence a body can carry and channel before it starts costing. Low reads as a dose making him sick, and a rig that leaks pale light down his ribs because he cannot hold the fifth charge. High reads as a rig running cool, a channel held that others drop, and an assay slip that lets a catcher price him before he has spoken. It is the one attribute read by an instrument rather than off behaviour, which is exactly why [[the-harvest-economy]] wants an assay on everybody.

**What Conductivity governs.** A born or gifted caster’s pool is 8 + level + twice Conductivity. An infused rig holds Conductivity + 2 charges and vents the excess as light. The overcharge envelope sits where Conductivity puts it — Channelling’s *Envelope* technique tells you where the line is; Conductivity is where the line *is*. The ceilings are the harvest economy’s real map: humans 8, [[carriers]] and [[chartered]] 9, [[returnees]] 7, [[the-unregistered]] unreadable, and [[the-latent]] whatever their Surfacing turns out to be. Born casters start a rung higher; class and origin rules place the remaining starting rungs.

---

## How a body levels

- **Rungs rise by driver.** Each attribute has exactly one, and pressure counts while safety does not. There is no field progress bar — the world tells you in a line of dialogue, a medic’s note that reads differently, or a thing you can suddenly do.
- **Species sets the ceiling,** out of nine. Humans are eight across. A Chartered can reach Conditioning 9 and never Acuity 8, so a Returnee sniper and a Chartered sniper end up genuinely different people.
- **Class places the starting rungs.** Background records history; the Eight Trees class owns the numeric base allotment shown during [[enlistment]].
- **Teachers drill.** A ceiling relationship can drill one attribute — its driver counts double for a week — and it costs a favour, like everything a teacher does.
- **Food, rest and medicine are progression.** [[professions]]’s Culinary rung restores Composure with a real meal; medicine and grafts move Resilience. Canon asks that rewards be growth the fiction can see, and a cook is exactly that.
- **Augments add effective rungs above the pattern, never in it.** A sensory augment is Acuity +1 while it is in you, and the Forge does not know it exists — see [[cybernetics]].
- **Corruption trades current rungs, never ceilings.** Phase 1 takes Coordination, phase 2 takes Conditioning and pays Conductivity, phase 3 takes Composure hardest, phase 4 pays Acuity, phase 6 pays Resilience. See [[the-corruption-system]].
- **A shortfall costs a rung.** Every 11.7 Essence the Forge is short is one rung off the attribute it built worst. The first one is gone for good; the rest regrow at about one a day, faster with a cook and a medic.

## Two files, as the world would write them

**Merritt, Contract Security, level 12.** The creation tablet carries Merritt’s starting numbers. The later medic’s note reads: *carries well, hands are good, do not send him in alone after dark.* The quartermaster’s Forge quote — one hundred and seventy-five — is a price, not an attribute readout.

**Oyelaran, Infusion Technician, level 19, phase 2.** Her signed service file retains the starting allocation. The medic’s note reads: *veining at the wrist, hides it well; rig runs cool on her, which is not luck.* The assay slip states Conductivity outright, in a way no ordinary field note does, and that slip is worth money to four separate organisations.

For writers: numeric attributes belong on the player’s enlistment tablet and in system arithmetic. Outside that creation surface, write the tell. No character speaks an attribute number about themselves. High Acuity receives information the world does not offer anyone else; slipped Coordination changes a signature.`;

const CLASSES_BODY = `The legacy slug [[character-classes]] now holds two distinct creation layers. A **background** is the history the recruit gives [[wendy]]: what they did before the story, their kit, their read on a room, a contact, and something buried. An **Eight Trees class** is the combat-growth path selected on the tablet. The two are chosen separately.

Background supplies backstory and social context. Class supplies the numeric base [[attributes]] allotment, starting [[skills]], and class-dependent [[cybernetics]] entitlement. [[professions]] remain craft learned and practiced in the world. No background or class creates an exclusive story wall; knowledge checks should still ask what this person could plausibly know.

## The six authored backgrounds

### Contract Security — the Stormglass merc

- **Kit** — worn plate refitted twice for two bodies, a rifle with somebody else’s filing on the serial, sixty rounds when issue is thirty.
- **Experience** — Marksmanship fits this history, but the starting mechanical rank comes from class.
- **Read** — *Price the Room*: on entry you see who is armed, who is paid, and who is about to stop being either.
- **Contact** — a former squadmate drawing [[iron-saints-pmc]] pay.
- **Buried** — a checkpoint where the paperwork was in order and the people were not.

### Infusion Technician — Tino’s trade, and playable as his peer

- **Kit** — a rig nobody else touches, a torque driver worn smooth in one spot, three doses on no manifest.
- **Experience** — Rig Maintenance fits this history, but the starting mechanical rank comes from class.
- **Read** — *Bad Valve*: you hear a rig running past service across a room, including the one on the enemy.
- **Contact** — a supplier who has never asked what it is for.
- **Buried** — whose crate those three doses came out of.
- **Only this door** — sees Tino close the leaking valve and hide the tremor, and knows what both mean.

### Field Medicine — the medic

- **Kit** — a trauma bag rebuilt for weight rather than completeness, and a phase-reader that was supposed to be handed back.
- **Experience** — Trauma and a provisional Regenerative licence fit this history; starting mechanical skill ranks come from class.
- **Read** — *Triage Eye*: a body’s history at a glance, and corruption tells two phases before anybody else in the room, including the person carrying them.
- **Contact** — a clinic that still forwards your mail.
- **Buried** — the first reading you falsified: not that you did it, but who asked.

### Reconnaissance — the scout

- **Kit** — optics worth more than everything else you own, and a map wrong in two places you know about.
- **Experience** — Navigation fits this history, but the starting mechanical rank comes from class.
- **Read** — *Ground Truth*: wildlife, weather and ground tell you what is coming.
- **Contact** — somebody in a village who feeds you and is not supposed to.
- **Buried** — a position you reported clear.

### Materiel — the quartermaster

- **Kit** — keys to four things you should not have keys to, and a ledger in your own shorthand.
- **Experience** — Negotiation fits this history, but the starting mechanical rank comes from class.
- **Read** — *Count the Crates*: stock, prices and shortfalls on sight, and at Reliable, who took it.
- **Contact** — a [[black-tithe-syndicate]] buyer holding the other half of a ledger you would like back.
- **Buried** — a shortfall that killed somebody, and the entry that covered it.

### Salvage Engineering — the mechanic

- **Kit** — the only background that may point toward starting chrome: one limb augment, unfinanced, built for somebody else. Whether the selected class actually starts with it follows the class cybernetics table.
- **Experience** — Fabrication fits this history, but the starting mechanical rank comes from class.
- **Read** — *Load Path*: structures show you what they are holding up.
- **Contact** — a [[foundry-workers-union]] steward who considers you a member whether you agreed or not.
- **Buried** — who the prosthetic was for.

The eleven reserved background doors remain: holdfast militia ([[mountain-holdfasts]]), caravan guide ([[desert-nomad-compact]]), line worker ([[foundry-workers-union]]), cordon veteran ([[abomination-containment-authority]]), transit inspector ([[skybridge-transit-authority]]), Meridian graduate ([[meridian-arcane-institute]]), lodge apprentice ([[wardens-monster-hunter-guild]]), Coast Guard rating ([[peninsula-coast-guard-authority]]), skiff militia ([[free-islander-league]]), missionary ([[church-of-the-first-gift]]), and Choir debtor ([[crimson-choir]]). Each waits for the region and faction writing that will earn it.

## The Eight Trees classes

These are the tablet’s class choices and their established growth directions. Growth direction is not the missing starting-allotment table.

- **Bastion** — Conditioning +2, Resilience +1.
- **Spector** — Coordination +2, Acuity +1.
- **Conduit** — Conductivity +2, Composure +1.
- **Surger** — Conditioning +2, Conductivity +1.
- **Archon** — Acuity +2, Composure +1.
- **Procurator** — Composure +2, Acuity +1.
- **Cypherist** — Acuity +2, Coordination +1.
- **Maverick** — Coordination +2, Composure +1.

Each class determines the base attribute-point total and default placement presented during [[enlistment]], plus its starting skills and cybernetics. The player then receives the two flexible points and single one-point reassignment documented in [[attributes]]. Exact starting totals, per-class placements, skills, and cybernetics are TBD — ask Tino.

For writers: background controls what the recruit remembers and notices about the past. Class controls the combat-growth package. Never use one word as shorthand for both.`;

const ENLISTMENT_CANON = `${ENLISTMENT_CANON_MARKER}

Character creation is the opening scene at [[stormglass-recruitment-camp]] in [[the-red-forest]], before the player reaches [[the-starting-island]]. [[wendy]] owns the desk. [[steve]] guards its right side and escorts the recruit through the two machines. The later Kestrel question remains a separate later beat.

## 1 — Wardrobe pod, to the right

Wendy refuses to process the player as they arrived. Steve walks them to the automated wardrobe pod immediately to the right of her table. It grooms the recruit, tailors the Stormglass uniform, and presents the appearance controls. The player chooses age, appearance, male or female sex, body model, and species. Appearance sliders are allowed here. All six peoples retain the shared human body plan; the wardrobe does not invent scaled, clawed, or tailed playable bodies.

The wardrobe pod is not transportation. Steve brings the player back to the same table when it opens.

## 2 — Visible service file and the “Brains Test”

The tablet is a physical object on Wendy’s table, and the player sees the service file on its screen. They enter and confirm:

- name and home;
- personal history, which selects background and backstory;
- the Eight Trees class they signed up for;
- magical origin and licence where applicable, constrained to [[the-three-origins-of-magic]];
- numeric starting [[attributes]];
- the complete starting record and signature.

Background and class are separate choices. Class determines the base attribute-point total, its default allotment, starting skills, and cybernetics. The player receives two additional attribute points to place, subject to species ceilings. They may subtract only one point from one class-allotted attribute and move that single point elsewhere. Exact class base totals and default allotments are TBD — ask Tino.

“Brains Test” is Wendy’s insulting name for this tablet screen. It is not a separate minigame and has no independent mechanical result.

Relationship, companion, and actual-status fields are later progression records. Wendy does not fabricate them during intake.

## 3 — Sign, assign, deploy

The player reviews the visible file, confirms the starting character, and signs. Wendy scrolls, laughs, and assigns the recruit to Tino on Ignit Island. Steve’s earlier deployment with Tino really did put him in an infirmary for a month with a hole in his leg and half his face burned. Future grafting healed both completely; he carries no scar or open wound.

The deployment pods stand to the left of Wendy’s table, separate from the wardrobe pod. They are uncommon, disposable, unreliable two-person Stormglass quick-travel capsules. Steve boards with the player, secures the straps and headset, gives the tranquilizing injection, and makes his last joke as the player falls asleep. The sequence hands directly to the opening cinematic “It Just Kept Going,” which ends in first person before gameplay takes control mid-gauntlet. The pod system is documented in [[transportation]].

## Current interface law

The creation tablet may display numeric attributes, and the wardrobe pod may use appearance sliders. Those are explicit exceptions to the superseded v1 ban. Outside creation, no character speaks an attribute number about themselves, and the field presentation remains diegetic. The tablet is one of the world’s physical surfaces, not an unexplained overlay.`;

const STORY_NODE_BODY = `## Setting

The Start button opens in first person at [[stormglass-recruitment-camp]], under the canopy of [[the-red-forest]]. [[wendy]] stands behind the [[stormglass-cartel]] recruitment table. The queue presses in behind the player. [[steve]], wearing the Blue Spiral crew mark, guards the right side. The wardrobe pod is to the right; the separate deployment pods are to the left.

## Beat 1 — Get cleaned up

WENDY: “Look at this sad sack of shit. First things first: go get cleaned up and in uniform before dragging your ass in front of me again. Go with Steve. He’ll get you straightened out.”

Steve walks the player to the right-hand wardrobe pod.

STEVE: “Don’t be shy. Get in there.”

Inside, the player chooses age, appearance, male or female sex, body model, and species. All six peoples share the human body plan. The machine grooms them and tailors their uniform.

Steve is waiting when it opens. His response branches on the chosen sex and species. For a male recruit, the owner-supplied zipper joke is: “Make sure your balls are still attached. Sometimes the robot gets carried away with the zipper.” For a female recruit, he gives a smirk and a brief flirtatious line. Exact female and species variants are TBD — ask Tino. He escorts the player back and resumes his post.

## Beat 2 — Sign your life away

WENDY: “Ahh. That’s better.”

She acknowledges the selected sex and people with one short smart remark; exact variants are TBD — ask Tino. Then she takes the player through the visible [[enlistment]] tablet:

1. name and home;
2. history and background;
3. the Eight Trees class they signed up for;
4. magical origin, if any, within [[the-three-origins-of-magic]];
5. the “Brains Test,” her insulting name for the numeric [[attributes]] screen;
6. full-file review and signature.

The class determines the base attribute pool and default allocation. The player receives two extra points and may move one — and only one — class-allotted point to another attribute, always under species ceilings. Exact class base values are TBD — ask Tino. Starting skills and cybernetics also follow class.

If the player completes the file without making Wendy repeat herself:

WENDY: “Good. You listen.”

That is her only non-contempt beat.

## Beat 3 — The best gig available

Wendy takes back the tablet, scrolls, thinks, and laughs.

WENDY: “I got you the best gig we’ve got on Ignit Island. You’ll be with one of the best — or biggest assholes — I know. Depends how you look at it. Hey, Steve. Get this one loaded up and head with them to meet [[tino]].”

Steve’s mood drops.

STEVE: “God Almighty, you trying to get us killed? Last time you made me drop one of these new recruits with him, I spent a month in the infirmary with a hole in my leg and half my face burned off.”

The injuries were real and are now fully grafted and healed. Wendy answers with a short sarcastic line; exact dialogue is TBD — ask Tino.

## Beat 4 — Deployment and cinematic handoff

Steve takes the player left to one of the two-person capsules described in [[transportation]]. It is not the wardrobe pod. He climbs in with them for the unreliable trip toward [[the-starting-island]].

STEVE: “Strap in. Headset on. It’s rough, but it’s short.”

He injects the tranquilizer. As the player loses focus:

STEVE: “See you on the other side.”

He laughs. Cut to the opening cinematic “It Just Kept Going.” Its final movement is the existing live-from-the-island beat; the camera remains first person and gameplay takes control mid-gauntlet.`;

const STORY_NODE_EFFECTS = [
  "Finalize wardrobe-pod appearance choices: age, appearance, male/female sex, body model, and species.",
  "Finalize the visible service file: name, home, background, Eight Trees class, origin/licence where applicable, numeric attributes, and signature.",
  "Apply the class base allotment, two flexible attribute points, and at most one one-point reassignment under species ceilings.",
  "Board Steve and the player in a two-person deployment pod and hand off under sedation to the opening cinematic.",
] as const;

type Client = ReturnType<typeof getPrismaClient> | Prisma.TransactionClient;

const entrySelect = {
  id: true,
  kind: true,
  slug: true,
  title: true,
  summary: true,
  body: true,
  meta: true,
  status: true,
  version: true,
  createdByUserId: true,
  updatedByUserId: true,
  lockedByUserId: true,
  lockExpiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const nodeSelect = {
  id: true,
  arcId: true,
  kind: true,
  key: true,
  title: true,
  summary: true,
  body: true,
  status: true,
  speakerEntryId: true,
  endingKind: true,
  completion: true,
  effects: true,
  rewards: true,
  continuesInArcId: true,
  canvasX: true,
  canvasY: true,
  version: true,
  createdByUserId: true,
  updatedByUserId: true,
  lockedByUserId: true,
  lockExpiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const edgeSelect = {
  id: true,
  arcId: true,
  key: true,
  fromNodeId: true,
  toNodeId: true,
  label: true,
  condition: true,
  effects: true,
  position: true,
  status: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
} as const;

type EntryRow = Awaited<ReturnType<typeof loadEntries>>[number];
type NodeRow = NonNullable<Awaited<ReturnType<typeof loadNode>>>;
type EdgeRow = NonNullable<Awaited<ReturnType<typeof loadEdge>>>;

type DesiredEntry = {
  kind: "CHARACTER" | "FACTION" | "REGION" | "RULE" | "SYSTEM";
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  meta: unknown;
  status: "CANON" | "PROPOSED";
};

type EntryPlan = {
  action: "create" | "update" | "unchanged";
  slug: string;
  current: EntryRow | null;
  desired: DesiredEntry;
  expectedVersion: number;
};

type TopologyPlan = {
  nodeAction: "create" | "unchanged";
  edgeAction: "create" | "unchanged";
  rooftopAction: "update" | "unchanged";
  linksToCreate: string[];
  linksUnchanged: string[];
};

async function loadEntries(client: Client) {
  return client.storyEntry.findMany({
    where: { slug: { in: [...TARGET_SLUGS] } },
    select: entrySelect,
    orderBy: { slug: "asc" },
  });
}

async function loadArc(client: Client) {
  return client.storyArc.findUnique({
    where: { slug: ARC_SLUG },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      lockedAt: true,
      lockedByUserId: true,
      updatedAt: true,
    },
  });
}

async function loadNode(client: Client, arcId: string, key: string) {
  return client.storyNode.findUnique({ where: { arcId_key: { arcId, key } }, select: nodeSelect });
}

async function loadEdge(client: Client, arcId: string) {
  return client.storyEdge.findUnique({ where: { arcId_key: { arcId, key: EDGE_KEY } }, select: edgeSelect });
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function semanticFingerprint(row: Pick<EntryRow, "kind" | "slug" | "title" | "summary" | "body" | "meta" | "status">) {
  return hash(stableJson({
    kind: row.kind,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    meta: row.meta,
    status: row.status,
  }));
}

function entrySnapshot(row: Pick<EntryRow, "kind" | "slug" | "title" | "summary" | "body" | "meta" | "status" | "version">) {
  return {
    kind: row.kind,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    meta: row.meta,
    status: row.status,
    version: row.version,
  };
}

function nodeSnapshot(row: NodeRow) {
  return {
    arcId: row.arcId,
    kind: row.kind,
    key: row.key,
    title: row.title,
    summary: row.summary,
    body: row.body,
    status: row.status,
    speakerEntryId: row.speakerEntryId,
    endingKind: row.endingKind,
    completion: row.completion,
    effects: row.effects,
    rewards: row.rewards,
    continuesInArcId: row.continuesInArcId,
    canvasX: row.canvasX,
    canvasY: row.canvasY,
    version: row.version,
  };
}

function nodeSemanticFingerprint(row: NodeRow) {
  return hash(stableJson({
    kind: row.kind,
    key: row.key,
    title: row.title,
    summary: row.summary,
    body: row.body,
    status: row.status,
    speakerEntryId: row.speakerEntryId,
    endingKind: row.endingKind,
    completion: row.completion,
    effects: row.effects,
    rewards: row.rewards,
    continuesInArcId: row.continuesInArcId,
    canvasX: row.canvasX,
    canvasY: row.canvasY,
  }));
}

function edgeSnapshot(row: EdgeRow) {
  return {
    arcId: row.arcId,
    key: row.key,
    fromNodeId: row.fromNodeId,
    toNodeId: row.toNodeId,
    label: row.label,
    condition: row.condition,
    effects: row.effects,
    position: row.position,
    status: row.status,
  };
}

function sameEntry(current: EntryRow, desired: DesiredEntry) {
  return current.kind === desired.kind &&
    current.slug === desired.slug &&
    current.title === desired.title &&
    current.summary === desired.summary &&
    current.body === desired.body &&
    stableJson(current.meta) === stableJson(desired.meta) &&
    current.status === desired.status;
}

function stripAt(body: string | null, markers: readonly string[]) {
  const text = body ?? "";
  const positions = markers.map((marker) => text.indexOf(marker)).filter((position) => position >= 0);
  return positions.length ? text.slice(0, Math.min(...positions)) : text;
}

function stripEnlistmentHistory(body: string | null) {
  const text = body ?? "";
  if (!text.startsWith(ENLISTMENT_CANON_MARKER)) return text;
  const markerAt = text.indexOf(ENLISTMENT_HISTORY_MARKER);
  if (markerAt < 0) throw new Error("enlistment: canon v3 marker exists without its preserved design-history boundary.");
  return text.slice(markerAt + ENLISTMENT_HISTORY_MARKER.length);
}

function desiredWendy(current: EntryRow): DesiredEntry {
  const meta = characterMetaSchema.parse(current.meta);
  return {
    kind: "CHARACTER",
    slug: current.slug,
    title: current.title,
    summary: WENDY_SUMMARY,
    body: WENDY_BODY,
    meta: carryServerOwnedMeta(current.meta, characterMetaSchema.parse({
      ...meta,
      age: null,
      sex: "female",
      home: null,
      magic: {
        notes: "She handles Cartel deployment doses during enlistment; she does not take them.",
        origin: "none",
        schools: [],
        corruptionPhase: 0,
      },
      model: null,
      voice: "Economical short declaratives. Contempt is throughput rather than cruelty. She never explains the world to the audience, watches the queue constantly, uses profanity sparingly, and allows exactly one earned soft beat: ‘Good. You listen.’",
      voiceProfile: null,
      gameId: null,
      skills: [],
      status: {
        known: "Alive at the Red Forest recruitment camp during SEQ-000.",
        actual: "Alive; not present on Ignit Island during the Strike and returns later in the Red Forest.",
      },
      aliases: [],
      species: "human",
      factions: [{ role: "Enlistment clerk", faction: "stormglass-cartel", standing: "enlisted staff" }],
      fullName: "Wendy",
      pronouns: "she/her",
      companion: { status: null, capable: false, availability: null },
      storyRole: "Runs the SEQ-000 character-creation desk, assigns the recruit to Tino, and later reappears alive in the Red Forest.",
      appearance: "CASTING / GENERATION REFERENCE ONLY — an attractive adult Native American woman with a curvy, athletic build in Stormglass fatigues. This is a production reference, not an in-world ethnicity. Exact age, face, hair, and production model are TBD — ask Tino.",
      background: "Materiel",
      cybernetics: [],
      involvement: [{
        how: "Runs the exact SEQ-000 intake scene at the Red Forest recruitment camp before the opening cinematic.",
        ref: ARC_SLUG,
        kind: "ARC",
      }],
      professions: ["Enlistment clerk"],
      openQuestions: [
        "Wendy’s exact age, home, personal history, game ID, production model, and any formal skills or cybernetics: TBD — ask Tino.",
        "Where and how Wendy re-enters the story later in the Red Forest: TBD — ask Tino.",
      ],
      relationships: [
        { who: "Blue Spiral guard and deployment escort on her recruitment line", type: "coworker", character: "steve" },
        { who: "Cartel operator who receives the recruit she assigns", type: "professional contact", character: "tino" },
      ],
    })),
    status: "CANON",
  };
}

function desiredSteve(current: EntryRow): DesiredEntry {
  const meta = characterMetaSchema.parse(current.meta);
  const base = stripAt(current.body, [STEVE_OLD_MARKER, STEVE_NEW_MARKER])
    .replaceAll("hypogriff", "Hypogriff");
  const addition = `${STEVE_NEW_MARKER}

Before the rooftops, Steve is the Blue Spiral guard at [[stormglass-recruitment-camp]]. Blue Spiral is his tribe or crew inside [[stormglass-cartel]], not the Cartel’s universal sigil. He stands to the right of [[wendy]]’s table, walks the player to the separate wardrobe pod on that side, then returns to his post.

Steve has deployed recruits to [[tino]] before. That trip left a hole in his leg, half his face burned, and put him in an infirmary for a month. All of it was grafted and healed with future medicine. He has no burn scar, no open wound, and no current disability from the incident.

After [[enlistment]], Wendy sends Steve and the player to the two-person deployment pods on the left. He boards with the recruit for the unreliable trip to [[the-starting-island]], secures the straps and headset, and gives the tranquilizing injection. His last line as the player falls asleep is: “See you on the other side.” He laughs, and the opening cinematic begins.

His later death remains the same fast, serious lesson. The Blue Spiral material does not turn it into comic relief.`;
  return {
    kind: "CHARACTER",
    slug: current.slug,
    title: current.title,
    summary: "A Blue Spiral Stormglass guard and deployment escort whose fully healed history with Tino precedes his fatal rooftop lesson.",
    body: `${base}${addition}`,
    meta: carryServerOwnedMeta(current.meta, characterMetaSchema.parse({
      ...meta,
      voice: "Gallows humor under pressure: blunt, flirtatious when the moment permits, and briefly crude around the wardrobe pod. The humor never softens the danger or his later death.",
      voiceProfile: null,
      status: {
        known: "dead — killed by the Hypogriff rider on the Shattermarket rooftops",
        actual: meta.status.actual,
      },
      factions: [{ role: "Blue Spiral soldier and deployment escort", faction: "stormglass-cartel", standing: "posthumously beloved" }],
      appearance: "No burn scar or lasting leg wound. Both prior deployment injuries were fully grafted and healed before SEQ-000.",
      background: null,
      openQuestions: [
        "Exact female-recruit flirt and species-specific wardrobe-pod reaction lines: TBD — ask Tino.",
        "Steve’s exact background before joining Blue Spiral: TBD — ask Tino.",
      ],
      relationships: [{ who: "Survived an earlier recruit deployment with him; later eulogized by him", type: "deployment comrade; eulogist", character: "tino" }],
    })),
    status: "CANON",
  };
}

function desiredEnlistment(current: EntryRow): DesiredEntry {
  const meta = systemMetaSchema.parse(current.meta);
  const history = stripEnlistmentHistory(current.body);
  return {
    kind: "SYSTEM",
    slug: current.slug,
    title: current.title,
    summary: "Character creation as a Red Forest scene: wardrobe pod, visible service file, class-bounded numeric attributes, signature, and unreliable deployment toward Ignit Island.",
    body: `${ENLISTMENT_CANON}${ENLISTMENT_HISTORY_MARKER}${history}`,
    meta: carryServerOwnedMeta(current.meta, systemMetaSchema.parse({
      ...meta,
      pillars: [
        "A person runs the intake and a visible service file remembers it",
        "Wardrobe right, tablet at the desk, deployment pods left",
        "Class sets the base numeric allotment; the player gets two flexible points and one one-point move",
      ],
      dependsOn: ["character-progression", "character-classes", "magic", "attributes", "transportation"],
      unlockArc: ARC_SLUG,
      unlockStage: "Start Game — Stormglass Recruitment Camp in the Red Forest, before deployment to Ignit Island",
      regionNotes: [
        { region: "the-red-forest", note: "All wardrobe, tablet, signature, and pod-loading beats occur at the Stormglass Recruitment Camp." },
        { region: "the-starting-island", note: "The recruit arrives only after the deployment-pod handoff and opening cinematic." },
      ],
      openQuestions: [
        "Exact per-class base attribute totals and default allotments for the Eight Trees: TBD — ask Tino.",
        "Exact per-class starting skills and cybernetics: TBD — ask Tino.",
        "Exact Wendy and Steve sex/species reaction variants at the wardrobe return: TBD — ask Tino.",
      ],
    })),
    status: "CANON",
  };
}

function desiredAttributes(current: EntryRow): DesiredEntry {
  const meta = systemMetaSchema.parse(current.meta);
  return {
    kind: "SYSTEM",
    slug: current.slug,
    title: current.title,
    summary: "Six numeric rungs shown on the enlistment tablet, then expressed through bodily tells, field records, and the systems that price or rebuild a body.",
    body: ATTRIBUTES_BODY,
    meta: carryServerOwnedMeta(current.meta, systemMetaSchema.parse({
      ...meta,
      pillars: [
        "Starting numeric values are visible on the enlistment tablet",
        "Class sets the base allotment; species still sets hard ceilings",
        "Outside creation, the world reports attributes through behavior and records",
      ],
      dependsOn: ["character-progression", "reclamation", "the-corruption-system", "character-classes", "enlistment"],
      openQuestions: [
        "Exact per-class base attribute total and default allotment for each Eight Trees class: TBD — ask Tino.",
        "What raises Conductivity outside the Reach, for a character who never doses?",
        "Does an attribute ever fall from disuse, or only from injury and the ladder?",
      ],
    })),
    status: "CANON",
  };
}

function desiredClasses(current: EntryRow): DesiredEntry {
  const meta = systemMetaSchema.parse(current.meta);
  return {
    kind: "SYSTEM",
    slug: current.slug,
    title: "Backgrounds and the Eight Trees",
    summary: "Two separate creation choices: background records who the recruit was; an Eight Trees class sets their base attributes, starting skills, cybernetics, and growth direction.",
    body: CLASSES_BODY,
    meta: carryServerOwnedMeta(current.meta, systemMetaSchema.parse({
      ...meta,
      pillars: [
        "Background is history; class is combat growth",
        "Eight class choices own the base attributes, starting skills, and cybernetics",
        "Neither choice builds an exclusive story wall",
      ],
      dependsOn: ["enlistment", "skills", "kit", "attributes", "cybernetics"],
      unlockStage: "SEQ-000 visible service-file tablet",
      openQuestions: [
        "Exact base attribute-point total and default allotment for each Eight Trees class: TBD — ask Tino.",
        "Exact starting skills and cybernetics for each Eight Trees class: TBD — ask Tino.",
        "Can a class ever change outright, or only blur?",
      ],
    })),
    status: "CANON",
  };
}

function desiredTransportation(current: EntryRow): DesiredEntry {
  const meta = systemMetaSchema.parse(current.meta);
  const base = stripAt(current.body, [TRANSPORT_MARKER]);
  const addition = `${TRANSPORT_MARKER}

The [[stormglass-cartel]] also uses rare two-person deployment pods for rapid movement to active fronts. They look like compact rockets, are treated as disposable, and are unreliable enough that most troops never see one. This is not a public network and not routine travel: it is the Cartel spending hardware to make time.

At [[stormglass-recruitment-camp]], the pod line stands to the left of [[wendy]]’s table. It is a separate machine from the automated wardrobe pod on the right. In [[enlistment]], [[steve]] boards with the player for the run from [[the-red-forest]] toward [[the-starting-island]]. The tranquilizing injection is part of this specific cinematic handoff; it is not yet established as a requirement of every pod trip.

Exact propulsion, failure modes, recoverability, and route control are TBD — ask Tino.`;
  return {
    kind: "SYSTEM",
    slug: current.slug,
    title: current.title,
    summary: "Boats, roads, convoys, and rare Stormglass deployment pods: distance remains a priced risk even when the Cartel spends hardware to make a trip fast.",
    body: `${base}${addition}`,
    meta: carryServerOwnedMeta(current.meta, systemMetaSchema.parse({
      ...meta,
      pillars: ["Distance is priced", "Routes have owners", "Fast travel is a service or a disposable asset somebody operates"],
      regionNotes: [
        { region: "the-red-forest", note: "A rare Stormglass deployment-pod line serves the SEQ-000 recruitment camp." },
        { region: "the-starting-island", note: "Steve and the recruit deploy toward Ignit Island in a two-person pod." },
      ],
      openQuestions: [
        "Who manufactures the deployment pods, what propulsion do they use, and what fails most often: TBD — ask Tino.",
        "Who controls or attacks their routes, and what else remains airborne?",
      ],
    })),
    status: "CANON",
  };
}

function desiredStormglass(current: EntryRow): DesiredEntry {
  const meta = factionMetaSchema.parse(current.meta);
  const base = stripAt(current.body, [STORMGLASS_MARKER]);
  const primarySigilQuestion = "What is the Cartel’s primary sigil beyond internal crew marks such as Blue Spiral: TBD — ask Tino.";
  const blueSpiralQuestion = "Who commands Blue Spiral, who belongs to it besides Steve, and how was it formed: TBD — ask Tino.";
  const blueSpiralDutyQuestion = "Does Blue Spiral have a wider recruitment or deployment duty, or is Steve’s SEQ-000 assignment individual: TBD — ask Tino.";
  const addition = `${STORMGLASS_MARKER}

Blue Spiral is a tribe or crew inside the [[stormglass-cartel]], not the primary emblem of the whole organization. Its members use a blue spiral as their own crew mark. [[steve]] belongs to it and serves as the guard and deployment escort on [[wendy]]’s recruitment line.

During SEQ-000, the Cartel operates [[stormglass-recruitment-camp]] beneath [[the-red-forest]]. The camp turns recruits into signed service files and sends selected two-person teams toward the front in the disposable pods described by [[transportation]]. Steve wears Blue Spiral’s mark while he handles the player’s escort; this does not establish the whole crew as the camp’s assigned unit.

Blue Spiral’s command, history, exact membership, and relationship to the Cartel’s wider symbols are TBD — ask Tino.`;
  return {
    kind: "FACTION",
    slug: current.slug,
    title: current.title,
    summary: "The player’s employer: a smuggling cartel wealthy enough to field an army, run Red Forest recruitment, and spend unreliable deployment pods while losing Ignit Island.",
    body: `${base}${addition}`,
    meta: carryServerOwnedMeta(current.meta, factionMetaSchema.parse({
      ...meta,
      openQuestions: [
        ...meta.openQuestions.filter((question) => question !== primarySigilQuestion && question !== blueSpiralQuestion && question !== blueSpiralDutyQuestion),
        primarySigilQuestion,
        blueSpiralQuestion,
        blueSpiralDutyQuestion,
      ],
    })),
    status: "CANON",
  };
}

function normalizeHypogriffValue(value: unknown): unknown {
  if (typeof value === "string") return value.replaceAll("hypogriff", "Hypogriff");
  if (Array.isArray(value)) return value.map(normalizeHypogriffValue);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeHypogriffValue(item)]));
  }
  return value;
}

function desiredHypogriffCharacter(current: EntryRow): DesiredEntry {
  const meta = characterMetaSchema.parse(normalizeHypogriffValue(current.meta));
  return {
    kind: "CHARACTER",
    slug: current.slug,
    title: current.title,
    summary: current.summary?.replaceAll("hypogriff", "Hypogriff") ?? null,
    body: (current.body ?? "").replaceAll("hypogriff", "Hypogriff"),
    meta: carryServerOwnedMeta(current.meta, meta),
    status: "PROPOSED",
  };
}

function desiredPearl(current: EntryRow): DesiredEntry {
  const meta = factionMetaSchema.parse(normalizeHypogriffValue(current.meta));
  return {
    kind: "FACTION",
    slug: current.slug,
    title: current.title,
    summary: current.summary?.replaceAll("hypogriff", "Hypogriff") ?? null,
    body: (current.body ?? "").replaceAll("hypogriff", "Hypogriff"),
    meta: carryServerOwnedMeta(current.meta, meta),
    status: "CANON",
  };
}

function desiredLook(current: EntryRow): DesiredEntry {
  const body = (current.body ?? "").replaceAll("hypogriff", "Hypogriff");
  return {
    kind: "RULE",
    slug: current.slug,
    title: current.title,
    summary: current.summary,
    body,
    meta: current.meta,
    status: "CANON",
  };
}

function desiredSite(): DesiredEntry {
  return {
    kind: "REGION",
    slug: SITE_SLUG,
    title: "Stormglass Recruitment Camp",
    summary: "A temporary Cartel intake site under the Red Forest canopy: Wendy’s table at center, wardrobe pod to the right, and unreliable two-person deployment pods to the left.",
    body: SITE_BODY,
    meta: SITE_META,
    status: "CANON",
  };
}

const desiredBuilders: Record<(typeof SOURCE_SLUGS)[number], (current: EntryRow) => DesiredEntry> = {
  attributes: desiredAttributes,
  "character-classes": desiredClasses,
  enlistment: desiredEnlistment,
  steve: desiredSteve,
  "stormglass-cartel": desiredStormglass,
  "the-captured-rider": desiredHypogriffCharacter,
  "the-kestrel-scout": desiredHypogriffCharacter,
  "the-look-of-the-world": desiredLook,
  transportation: desiredTransportation,
  "tropic-pearl-trade-house": desiredPearl,
  wendy: desiredWendy,
};

function validateEntry(spec: DesiredEntry) {
  if (!spec.title.trim() || spec.title.length > 120) throw new Error(`${spec.slug}: title violates the Codex limit.`);
  if (spec.summary && spec.summary.length > 500) throw new Error(`${spec.slug}: summary violates the Codex limit.`);
  if (!spec.body || spec.body.length > 20_000) throw new Error(`${spec.slug}: body violates the Codex limit.`);
  for (const value of [spec.title, spec.summary ?? "", spec.body, stableJson(spec.meta)]) {
    if (value.includes(FORBIDDEN_ISLAND_TYPO)) throw new Error(`${spec.slug}: rejected the closed pre-rename island typo.`);
  }
  if (spec.kind === "CHARACTER") characterMetaSchema.parse(spec.meta);
  if (spec.kind === "FACTION") factionMetaSchema.parse(spec.meta);
  if (spec.kind === "REGION") regionMetaSchema.parse(spec.meta);
  if (spec.kind === "SYSTEM") systemMetaSchema.parse(spec.meta);
}

function activeCourtesyLock(row: { lockedByUserId: string | null; lockExpiresAt: Date | null }, actorId: string) {
  return Boolean(row.lockedByUserId && row.lockExpiresAt && row.lockExpiresAt > new Date() && row.lockedByUserId !== actorId);
}

function buildEntryPlan(rows: EntryRow[], actorId: string): EntryPlan[] {
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  const plans: EntryPlan[] = [];

  for (const slug of SOURCE_SLUGS) {
    const current = bySlug.get(slug);
    const expected = EXPECTED_SOURCE[slug];
    if (!current) throw new Error(`${slug}: required source entry is missing.`);
    if (current.kind !== expected.kind) throw new Error(`${slug}: expected ${expected.kind}, found ${current.kind}.`);
    if (activeCourtesyLock(current, actorId)) throw new Error(`${slug}: an active courtesy lock belongs to another writer.`);
    const desired = desiredBuilders[slug](current);
    validateEntry(desired);

    if (sameEntry(current, desired)) {
      if (current.version !== expected.version + 1) throw new Error(`${slug}: exact desired content has unexpected version ${current.version}.`);
      plans.push({ action: "unchanged", slug, current, desired, expectedVersion: current.version });
      continue;
    }

    if (current.version !== expected.version || current.status !== expected.status) {
      throw new Error(`${slug}: stale or unexpected source version/status.`);
    }
    if (semanticFingerprint(current) !== expected.fingerprint) {
      throw new Error(`${slug}: live source no longer matches the guarded fingerprint.`);
    }
    plans.push({ action: "update", slug, current, desired, expectedVersion: expected.version + 1 });
  }

  const currentSite = bySlug.get(SITE_SLUG) ?? null;
  const site = desiredSite();
  validateEntry(site);
  if (!currentSite) {
    plans.push({ action: "create", slug: SITE_SLUG, current: null, desired: site, expectedVersion: 1 });
  } else {
    if (activeCourtesyLock(currentSite, actorId)) throw new Error(`${SITE_SLUG}: an active courtesy lock belongs to another writer.`);
    if (!sameEntry(currentSite, site) || currentSite.version !== 1) {
      throw new Error(`${SITE_SLUG}: slug exists outside this owner-ruling package; refusing to overwrite it.`);
    }
    plans.push({ action: "unchanged", slug: SITE_SLUG, current: currentSite, desired: site, expectedVersion: 1 });
  }

  return plans;
}

function wikiLinks(value: string) {
  const tokens = [...value.matchAll(/\[\[(.*?)\]\]/g)];
  const openings = value.match(/\[\[/g)?.length ?? 0;
  const closings = value.match(/\]\]/g)?.length ?? 0;
  if (tokens.length !== openings || tokens.length !== closings) throw new Error("Malformed [[link]] syntax in SEQ-000 authored text.");
  return tokens.map((match) => {
    const slug = match[1];
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Malformed Codex link target: ${slug}`);
    return slug;
  });
}

async function assertDesiredLinks(client: Client, plan: EntryPlan[]) {
  const desiredBodies = plan.map((item) => item.desired.body).concat(STORY_NODE_BODY);
  const links = [...new Set(desiredBodies.flatMap(wikiLinks))].sort();
  const allowedMissing = new Set([SITE_SLUG]);
  // Attributes and the preserved Enlistment history already carry this link.
  // It is outside the second-pass read/write surface, so validate the newly
  // authored graph without querying that retained target.
  const wanted = links.filter((slug) => !allowedMissing.has(slug) && slug !== "the-soul-forge");
  const found = await client.storyEntry.findMany({ where: { slug: { in: wanted } }, select: { slug: true } });
  const existing = new Set(found.map((row) => row.slug));
  const missing = wanted.filter((slug) => !existing.has(slug));
  if (missing.length) throw new Error(`Refusing unresolved [[links]]: ${missing.join(", ")}`);
  if (!links.includes(SITE_SLUG)) throw new Error("The new recruitment site is not cross-linked into the authored package.");
}

function desiredNodeData(next: NodeRow) {
  return {
    kind: "SCENE" as const,
    key: NODE_KEY,
    title: "SEQ-000 — Sign Your Life Away",
    summary: "The complete Start-button character-creation scene at the Red Forest recruitment camp, ending in Steve’s deployment-pod injection and the opening cinematic.",
    body: STORY_NODE_BODY,
    status: "CANON" as const,
    speakerEntryId: null,
    endingKind: null,
    completion: null,
    effects: [...STORY_NODE_EFFECTS],
    rewards: [] as string[],
    continuesInArcId: null,
    canvasX: Math.max(-100_000, next.canvasX - 320),
    canvasY: next.canvasY,
  };
}

function sameNode(current: NodeRow, desired: ReturnType<typeof desiredNodeData>) {
  return current.kind === desired.kind &&
    current.key === desired.key &&
    current.title === desired.title &&
    current.summary === desired.summary &&
    current.body === desired.body &&
    current.status === desired.status &&
    current.speakerEntryId === desired.speakerEntryId &&
    current.endingKind === desired.endingKind &&
    current.completion === desired.completion &&
    stableJson(current.effects) === stableJson(desired.effects) &&
    stableJson(current.rewards) === stableJson(desired.rewards) &&
    current.continuesInArcId === desired.continuesInArcId &&
    current.canvasX === desired.canvasX &&
    current.canvasY === desired.canvasY;
}

function desiredRooftopText(current: NodeRow) {
  return {
    summary: current.summary?.replaceAll("hypogriff", "Hypogriff") ?? null,
    body: current.body?.replaceAll("hypogriff", "Hypogriff") ?? null,
  };
}

function rooftopTextIsExact(current: NodeRow) {
  const desired = desiredRooftopText(current);
  return current.summary === desired.summary && current.body === desired.body;
}

function sameEdge(current: EdgeRow, fromNodeId: string, nextNodeId: string) {
  return current.key === EDGE_KEY &&
    current.fromNodeId === fromNodeId &&
    current.toNodeId === nextNodeId &&
    current.label === null &&
    current.condition === null &&
    current.effects.length === 0 &&
    current.position === 0 &&
    current.status === "CANON";
}

async function buildTopologyPlan(client: Client, actorId: string): Promise<TopologyPlan> {
  const arc = await loadArc(client);
  if (!arc || arc.status !== "CANON") throw new Error(`${ARC_SLUG}: required canon arc is missing.`);
  if (arc.lockedAt || arc.lockedByUserId) throw new Error(`${ARC_SLUG}: arc is deliberately locked.`);

  const next = await loadNode(client, arc.id, NEXT_NODE_KEY);
  if (!next || next.status !== "CANON" || next.version !== 6) throw new Error(`${ARC_SLUG}/${NEXT_NODE_KEY}: expected canon v6 endpoint is missing or changed.`);
  if (activeCourtesyLock(next, actorId)) throw new Error(`${ARC_SLUG}/${NEXT_NODE_KEY}: an active courtesy lock belongs to another writer.`);

  const rooftop = await loadNode(client, arc.id, ROOFTOP_NODE_KEY);
  if (!rooftop || rooftop.status !== EXPECTED_ROOFTOP.status) throw new Error(`${ARC_SLUG}/${ROOFTOP_NODE_KEY}: required canon scene is missing.`);
  if (activeCourtesyLock(rooftop, actorId)) throw new Error(`${ARC_SLUG}/${ROOFTOP_NODE_KEY}: an active courtesy lock belongs to another writer.`);
  let rooftopAction: TopologyPlan["rooftopAction"] = "update";
  if (rooftopTextIsExact(rooftop)) {
    if (rooftop.version !== EXPECTED_ROOFTOP.version + 1) throw new Error(`${ARC_SLUG}/${ROOFTOP_NODE_KEY}: exact spelling has unexpected version ${rooftop.version}.`);
    rooftopAction = "unchanged";
  } else {
    if (rooftop.version !== EXPECTED_ROOFTOP.version || nodeSemanticFingerprint(rooftop) !== EXPECTED_ROOFTOP.fingerprint) {
      throw new Error(`${ARC_SLUG}/${ROOFTOP_NODE_KEY}: source scene no longer matches the guarded fingerprint.`);
    }
  }

  const desired = desiredNodeData(next);
  const node = await loadNode(client, arc.id, NODE_KEY);
  let nodeAction: TopologyPlan["nodeAction"] = "create";
  if (node) {
    if (activeCourtesyLock(node, actorId)) throw new Error(`${ARC_SLUG}/${NODE_KEY}: an active courtesy lock belongs to another writer.`);
    if (!sameNode(node, desired) || node.version !== 1) throw new Error(`${ARC_SLUG}/${NODE_KEY}: scene exists outside this owner-ruling package.`);
    nodeAction = "unchanged";
  }

  const edge = await loadEdge(client, arc.id);
  let edgeAction: TopologyPlan["edgeAction"] = "create";
  if (edge) {
    if (!node || !sameEdge(edge, node.id, next.id)) throw new Error(`${ARC_SLUG}/${EDGE_KEY}: transition exists outside this package.`);
    edgeAction = "unchanged";
  } else if (node) {
    const conflicting = await client.storyEdge.findUnique({ where: { fromNodeId_position: { fromNodeId: node.id, position: 0 } }, select: { id: true } });
    if (conflicting) throw new Error(`${ARC_SLUG}/${NODE_KEY}: outgoing position zero is already occupied.`);
  }

  const nextIncoming = await client.storyEdge.findMany({ where: { toNodeId: next.id }, select: { id: true } });
  if ((!edge && nextIncoming.length !== 0) || (edge && (nextIncoming.length !== 1 || nextIncoming[0]?.id !== edge.id))) {
    throw new Error(`${ARC_SLUG}/${NEXT_NODE_KEY}: unexpected incoming route; refusing to alter the root topology.`);
  }
  if (node) {
    const nodeIncoming = await client.storyEdge.count({ where: { toNodeId: node.id } });
    if (nodeIncoming !== 0) throw new Error(`${ARC_SLUG}/${NODE_KEY}: must remain the unique root with no incoming route.`);
  }

  const currentLinks = node
    ? await client.storyEntryLink.findMany({ where: { nodeId: node.id }, select: { entry: { select: { slug: true } } } })
    : [];
  const currentSlugs = new Set(currentLinks.map((link) => link.entry.slug));
  const unexpected = [...currentSlugs].filter((slug) => !NODE_LINK_SLUGS.includes(slug as (typeof NODE_LINK_SLUGS)[number]));
  if (unexpected.length) throw new Error(`${ARC_SLUG}/${NODE_KEY}: unexpected entry links: ${unexpected.join(", ")}`);

  return {
    nodeAction,
    edgeAction,
    rooftopAction,
    linksToCreate: NODE_LINK_SLUGS.filter((slug) => !currentSlugs.has(slug)),
    linksUnchanged: NODE_LINK_SLUGS.filter((slug) => currentSlugs.has(slug)),
  };
}

async function activeTino(client: Client) {
  const actors = await client.user.findMany({
    where: { isActive: true, role: "ADMIN", OR: [{ username: "tino" }, { displayName: "Tino" }, { name: "Tino" }] },
    select: { id: true, username: true },
    take: 2,
  });
  if (actors.length !== 1) throw new Error(`Expected exactly one active ADMIN Tino author; found ${actors.length}.`);
  return actors[0];
}

function assertLiveTarget() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is missing.");
  const url = new URL(raw);
  const host = url.hostname.toLowerCase();
  if (!new Set(["localhost", "127.0.0.1", "::1", "[::1]"]).has(host)) throw new Error("SEQ-000 owner authoring requires the loopback live database target.");
  if (url.pathname.replace(/^\//, "") !== "habitat") throw new Error("SEQ-000 owner authoring requires the live habitat database, not a development clone.");
  if (process.env.HABITAT_ENVIRONMENT === "development") throw new Error("SEQ-000 owner authoring refuses the Atlas development environment.");
}

async function writeTargetPreimage(rows: EntryRow[]) {
  const root = process.env.HABITAT_BACKUP_PATH?.trim();
  if (!root || !path.isAbsolute(root)) throw new Error("Apply requires an absolute HABITAT_BACKUP_PATH.");
  const directory = path.join(root, "codex-preimages");
  await mkdir(directory, { recursive: true });

  const arc = await loadArc(db);
  if (!arc) throw new Error(`${ARC_SLUG}: arc vanished before backup.`);
  const nodes = await db.storyNode.findMany({
    where: { arcId: arc.id, key: { in: [NODE_KEY, NEXT_NODE_KEY, ROOFTOP_NODE_KEY] } },
    select: nodeSelect,
    orderBy: { key: "asc" },
  });
  const nodeIds = nodes.map((node) => node.id);
  const next = nodes.find((node) => node.key === NEXT_NODE_KEY);
  const edges = next
    ? await db.storyEdge.findMany({
      where: { arcId: arc.id, OR: [{ key: EDGE_KEY }, { toNodeId: next.id }, ...(nodeIds.length ? [{ fromNodeId: { in: nodeIds } }] : [])] },
      select: edgeSelect,
      orderBy: { key: "asc" },
    })
    : [];
  const seq = nodes.find((node) => node.key === NODE_KEY);
  const links = seq
    ? await db.storyEntryLink.findMany({ where: { nodeId: seq.id }, include: { entry: { select: { slug: true } } }, orderBy: { entryId: "asc" } })
    : [];
  const entityIds = [...rows.map((row) => row.id), ...nodeIds, ...edges.map((edge) => edge.id), ...links.map((link) => link.id)];
  const revisions = entityIds.length
    ? await db.storyRevision.findMany({ where: { entityId: { in: entityIds } }, orderBy: { createdAt: "asc" } })
    : [];

  const payload = {
    format: "habitat-seq-000-owner-rulings-target-preimage-v1",
    createdAt: new Date().toISOString(),
    sourceMarker: SOURCE_MARKER,
    targetSlugs: [...TARGET_SLUGS],
    missingAtCapture: TARGET_SLUGS.filter((slug) => !rows.some((row) => row.slug === slug)),
    entries: rows,
    arc,
    nodes,
    edges,
    links,
    revisions,
  };
  const serialized = `${JSON.stringify(payload, null, 2)}\n`;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(directory, `seq-000-owner-rulings-${stamp}.json`);
  await writeFile(file, serialized, { encoding: "utf8", flag: "wx" });
  const readBack = await readFile(file, "utf8");
  if (readBack !== serialized) throw new Error("Target preimage byte verification failed.");
  const verified = JSON.parse(readBack) as typeof payload;
  if (stableJson(verified.targetSlugs) !== stableJson([...TARGET_SLUGS])) throw new Error("Target preimage allow-list verification failed.");
  if (verified.entries.some((row) => !TARGET_SLUGS.includes(row.slug as (typeof TARGET_SLUGS)[number]))) {
    throw new Error("Target preimage escaped its entry allow-list.");
  }
  return { file, bytes: Buffer.byteLength(readBack), sha256: hash(readBack) };
}

async function revise(
  client: Prisma.TransactionClient,
  input: {
    entityType: "ENTRY" | "NODE" | "EDGE" | "LINK";
    entityId: string;
    arcId?: string | null;
    action: "CREATED" | "UPDATED" | "STATUS_CHANGED" | "LINKED";
    actorUserId: string;
    summary: string;
    before?: unknown;
    after?: unknown;
  },
) {
  await client.storyRevision.create({
    data: {
      id: randomUUID(),
      entityType: input.entityType,
      entityId: input.entityId,
      arcId: input.arcId ?? null,
      action: input.action,
      actorUserId: input.actorUserId,
      summary: input.summary,
      before: (input.before ?? {}) as Prisma.InputJsonValue,
      after: (input.after ?? {}) as Prisma.InputJsonValue,
    },
  });
}

function entryRevisionSummary(slug: string) {
  switch (slug) {
    case "attributes": return REVISION_SUMMARIES.attributes;
    case "character-classes": return REVISION_SUMMARIES.classes;
    case "enlistment": return REVISION_SUMMARIES.enlistment;
    case "steve": return REVISION_SUMMARIES.steve;
    case "stormglass-cartel": return REVISION_SUMMARIES.stormglass;
    case "the-captured-rider": return REVISION_SUMMARIES.capturedRider;
    case "the-kestrel-scout": return REVISION_SUMMARIES.kestrelScout;
    case "the-look-of-the-world": return REVISION_SUMMARIES.look;
    case "transportation": return REVISION_SUMMARIES.transportation;
    case "tropic-pearl-trade-house": return REVISION_SUMMARIES.pearl;
    case "wendy": return REVISION_SUMMARIES.wendy;
    case SITE_SLUG: return REVISION_SUMMARIES.site;
    default: throw new Error(`No revision summary for ${slug}.`);
  }
}

async function applyPackage(actorId: string) {
  return db.$transaction(async (tx) => {
    const currentRows = await loadEntries(tx);
    const entryPlan = buildEntryPlan(currentRows, actorId);
    await assertDesiredLinks(tx, entryPlan);
    const topologyPlan = await buildTopologyPlan(tx, actorId);
    assertPackageStateIsWhole(entryPlan, topologyPlan);

    for (const item of entryPlan) {
      if (item.action === "unchanged") continue;
      if (item.action === "create") {
        const created = await tx.storyEntry.create({
          data: {
            id: randomUUID(),
            kind: item.desired.kind,
            slug: item.desired.slug,
            title: item.desired.title,
            summary: item.desired.summary,
            body: item.desired.body,
            ...(item.desired.meta === null ? {} : { meta: item.desired.meta as Prisma.InputJsonValue }),
            status: item.desired.status,
            createdByUserId: actorId,
          },
          select: entrySelect,
        });
        await revise(tx, {
          entityType: "ENTRY",
          entityId: created.id,
          action: "CREATED",
          actorUserId: actorId,
          summary: entryRevisionSummary(item.slug),
          after: entrySnapshot(created),
        });
        continue;
      }

      if (!item.current) throw new Error(`${item.slug}: update lost its preimage.`);
      const before = entrySnapshot(item.current);
      const changed = await tx.storyEntry.updateMany({
        where: { id: item.current.id, version: item.current.version },
        data: {
          title: item.desired.title,
          summary: item.desired.summary,
          body: item.desired.body,
          ...(item.desired.meta === null ? {} : { meta: item.desired.meta as Prisma.InputJsonValue }),
          status: item.desired.status,
          updatedByUserId: actorId,
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1) throw new Error(`${item.slug}: optimistic version guard failed.`);
      const updated = await tx.storyEntry.findUniqueOrThrow({ where: { id: item.current.id }, select: entrySelect });
      await revise(tx, {
        entityType: "ENTRY",
        entityId: updated.id,
        action: "UPDATED",
        actorUserId: actorId,
        summary: entryRevisionSummary(item.slug),
        before,
        after: entrySnapshot(updated),
      });
      if (before.status !== updated.status) {
        const summary = item.slug === "wendy" ? REVISION_SUMMARIES.wendyStatus : REVISION_SUMMARIES.enlistmentStatus;
        await revise(tx, {
          entityType: "ENTRY",
          entityId: updated.id,
          action: "STATUS_CHANGED",
          actorUserId: actorId,
          summary,
          before: { status: before.status, version: before.version },
          after: { status: updated.status, version: updated.version },
        });
      }
    }

    const arc = await loadArc(tx);
    if (!arc) throw new Error(`${ARC_SLUG}: arc vanished inside transaction.`);
    if (topologyPlan.rooftopAction === "update") {
      const rooftop = await loadNode(tx, arc.id, ROOFTOP_NODE_KEY);
      if (!rooftop) throw new Error(`${ARC_SLUG}/${ROOFTOP_NODE_KEY}: scene vanished inside transaction.`);
      const before = nodeSnapshot(rooftop);
      const desired = desiredRooftopText(rooftop);
      const changed = await tx.storyNode.updateMany({
        where: { id: rooftop.id, version: rooftop.version },
        data: { summary: desired.summary, body: desired.body, updatedByUserId: actorId, version: { increment: 1 } },
      });
      if (changed.count !== 1) throw new Error(`${ARC_SLUG}/${ROOFTOP_NODE_KEY}: optimistic version guard failed.`);
      const updated = await tx.storyNode.findUniqueOrThrow({ where: { id: rooftop.id }, select: nodeSelect });
      await revise(tx, {
        entityType: "NODE",
        entityId: updated.id,
        arcId: arc.id,
        action: "UPDATED",
        actorUserId: actorId,
        summary: REVISION_SUMMARIES.rooftop,
        before,
        after: nodeSnapshot(updated),
      });
    }
    const next = await loadNode(tx, arc.id, NEXT_NODE_KEY);
    if (!next) throw new Error(`${ARC_SLUG}/${NEXT_NODE_KEY}: endpoint vanished inside transaction.`);
    let node = await loadNode(tx, arc.id, NODE_KEY);
    if (!node) {
      node = await tx.storyNode.create({
        data: {
          id: randomUUID(),
          arcId: arc.id,
          createdByUserId: actorId,
          ...desiredNodeData(next),
        },
        select: nodeSelect,
      });
      await revise(tx, {
        entityType: "NODE",
        entityId: node.id,
        arcId: arc.id,
        action: "CREATED",
        actorUserId: actorId,
        summary: REVISION_SUMMARIES.node,
        after: nodeSnapshot(node),
      });
    }

    let edge = await loadEdge(tx, arc.id);
    if (!edge) {
      edge = await tx.storyEdge.create({
        data: {
          id: randomUUID(),
          arcId: arc.id,
          key: EDGE_KEY,
          fromNodeId: node.id,
          toNodeId: next.id,
          label: null,
          condition: null,
          effects: [],
          position: 0,
          status: "CANON",
          createdByUserId: actorId,
        },
        select: edgeSelect,
      });
      await revise(tx, {
        entityType: "EDGE",
        entityId: edge.id,
        arcId: arc.id,
        action: "CREATED",
        actorUserId: actorId,
        summary: REVISION_SUMMARIES.edge,
        after: edgeSnapshot(edge),
      });
    }

    const linkedEntries = await tx.storyEntry.findMany({
      where: { slug: { in: [...NODE_LINK_SLUGS] } },
      select: { id: true, slug: true, title: true },
    });
    const linkedBySlug = new Map(linkedEntries.map((entry) => [entry.slug, entry]));
    for (const slug of NODE_LINK_SLUGS) {
      const entry = linkedBySlug.get(slug);
      if (!entry) throw new Error(`${ARC_SLUG}/${NODE_KEY}: missing link target ${slug}.`);
      const existing = await tx.storyEntryLink.findUnique({
        where: { nodeId_entryId: { nodeId: node.id, entryId: entry.id } },
        select: { id: true },
      });
      if (existing) continue;
      const link = await tx.storyEntryLink.create({ data: { id: randomUUID(), nodeId: node.id, entryId: entry.id } });
      await revise(tx, {
        entityType: "LINK",
        entityId: link.id,
        arcId: arc.id,
        action: "LINKED",
        actorUserId: actorId,
        summary: `SEQ-000 owner ruling: linked ${entry.title} to the opening creation scene`,
        after: { nodeKey: NODE_KEY, entrySlug: slug },
      });
    }

    const afterRows = await loadEntries(tx);
    const afterPlan = buildEntryPlan(afterRows, actorId);
    const afterTopology = await buildTopologyPlan(tx, actorId);
    if (afterPlan.some((item) => item.action !== "unchanged")) throw new Error("Post-write entry verification is not idempotent.");
    if (afterTopology.nodeAction !== "unchanged" || afterTopology.edgeAction !== "unchanged" || afterTopology.rooftopAction !== "unchanged" || afterTopology.linksToCreate.length) {
      throw new Error("Post-write topology verification is not idempotent.");
    }
  }, { isolationLevel: "Serializable", timeout: 45_000 });
}

async function assertRevisionProvenance(actorId: string) {
  type RevisionExpectation = {
    entityId: string;
    entityType: "ENTRY" | "NODE" | "EDGE";
    action: "CREATED" | "UPDATED" | "STATUS_CHANGED";
    summary: string;
  };
  const entries = await loadEntries(db);
  const expectedEntryRevisions: RevisionExpectation[] = entries.flatMap((entry) => {
    const rows: RevisionExpectation[] = [{ entityId: entry.id, entityType: "ENTRY", action: entry.slug === SITE_SLUG ? "CREATED" : "UPDATED", summary: entryRevisionSummary(entry.slug) }];
    if (entry.slug === "wendy") rows.push({ entityId: entry.id, entityType: "ENTRY", action: "STATUS_CHANGED", summary: REVISION_SUMMARIES.wendyStatus });
    if (entry.slug === "enlistment") rows.push({ entityId: entry.id, entityType: "ENTRY", action: "STATUS_CHANGED", summary: REVISION_SUMMARIES.enlistmentStatus });
    return rows;
  });
  const arc = await loadArc(db);
  if (!arc) throw new Error(`${ARC_SLUG}: arc missing during revision verification.`);
  const node = await loadNode(db, arc.id, NODE_KEY);
  const rooftop = await loadNode(db, arc.id, ROOFTOP_NODE_KEY);
  const edge = await loadEdge(db, arc.id);
  if (!node || !rooftop || !edge) throw new Error("SEQ-000 topology missing during revision verification.");

  const expected: RevisionExpectation[] = [
    ...expectedEntryRevisions,
    { entityId: node.id, entityType: "NODE", action: "CREATED", summary: REVISION_SUMMARIES.node },
    { entityId: rooftop.id, entityType: "NODE", action: "UPDATED", summary: REVISION_SUMMARIES.rooftop },
    { entityId: edge.id, entityType: "EDGE", action: "CREATED", summary: REVISION_SUMMARIES.edge },
  ];
  const revisions = await db.storyRevision.findMany({
    where: { actorUserId: actorId, OR: expected.map((item) => ({ entityId: item.entityId, entityType: item.entityType, action: item.action, summary: item.summary })) },
    select: { entityId: true, entityType: true, action: true, summary: true },
  });
  for (const item of expected) {
    if (!revisions.some((row) => row.entityId === item.entityId && row.entityType === item.entityType && row.action === item.action && row.summary === item.summary)) {
      throw new Error(`Missing audit revision: ${item.entityType} ${item.action} ${item.summary}`);
    }
  }

  const links = await db.storyEntryLink.findMany({
    where: { nodeId: node.id },
    select: { id: true, entry: { select: { slug: true, title: true } } },
  });
  if (links.length !== NODE_LINK_SLUGS.length) throw new Error("SEQ-000 link count differs from the closed link list.");
  for (const link of links) {
    const summary = `SEQ-000 owner ruling: linked ${link.entry.title} to the opening creation scene`;
    const revision = await db.storyRevision.findFirst({
      where: { entityType: "LINK", entityId: link.id, action: "LINKED", actorUserId: actorId, summary },
      select: { id: true },
    });
    if (!revision) throw new Error(`Missing LINKED revision for ${link.entry.slug}.`);
  }
}

function assertPackageStateIsWhole(entryPlan: EntryPlan[], topology: TopologyPlan) {
  const pending = entryPlan.filter((item) => item.action !== "unchanged").length +
    Number(topology.nodeAction !== "unchanged") + Number(topology.rooftopAction !== "unchanged") +
    Number(topology.edgeAction !== "unchanged") + topology.linksToCreate.length;
  const exact = entryPlan.filter((item) => item.action === "unchanged").length +
    Number(topology.nodeAction === "unchanged") + Number(topology.rooftopAction === "unchanged") +
    Number(topology.edgeAction === "unchanged") + topology.linksUnchanged.length;
  if (pending > 0 && exact > 0) {
    throw new Error("SEQ-000 owner package is in a mixed fresh/exact state; refusing to add writes before audit provenance is reconciled.");
  }
}

function report(entryPlan: EntryPlan[], topology: TopologyPlan, label: string) {
  console.log(`\n${label}`);
  for (const item of entryPlan) {
    const mark = item.action === "create" ? "+" : item.action === "update" ? "~" : "=";
    console.log(`  ${mark} ENTRY ${item.slug} — ${item.action} — ${item.desired.status} v${item.expectedVersion}`);
  }
  console.log(`  ${topology.nodeAction === "create" ? "+" : "="} NODE ${ARC_SLUG}/${NODE_KEY} — ${topology.nodeAction} — CANON v1`);
  console.log(`  ${topology.rooftopAction === "update" ? "~" : "="} NODE ${ARC_SLUG}/${ROOFTOP_NODE_KEY} — ${topology.rooftopAction} — CANON v2`);
  console.log(`  ${topology.edgeAction === "create" ? "+" : "="} EDGE ${EDGE_KEY} — ${topology.edgeAction} — CANON`);
  console.log(`  ${topology.linksToCreate.length ? "+" : "="} LINKS ${NODE_KEY} — ${topology.linksToCreate.length} create, ${topology.linksUnchanged.length} exact`);
  const changes = entryPlan.filter((item) => item.action !== "unchanged").length +
    Number(topology.nodeAction === "create") + Number(topology.rooftopAction === "update") + Number(topology.edgeAction === "create") + topology.linksToCreate.length;
  console.log(`${changes} write${changes === 1 ? "" : "s"} planned.`);
}

async function main() {
  assertLiveTarget();
  if (apply && confirmation !== CONFIRMATION) throw new Error(`Apply requires --confirm=${CONFIRMATION}.`);
  if (apply && suppliedSource !== SOURCE_MARKER) throw new Error(`Apply requires --source=${SOURCE_MARKER}.`);

  const actor = await activeTino(db);
  const rows = await loadEntries(db);
  const entryPlan = buildEntryPlan(rows, actor.id);
  await assertDesiredLinks(db, entryPlan);
  const topology = await buildTopologyPlan(db, actor.id);
  assertPackageStateIsWhole(entryPlan, topology);
  report(entryPlan, topology, `SEQ-000 owner rulings ${apply ? "apply preflight" : "preview"} · author ${actor.username}`);

  const changed = entryPlan.some((item) => item.action !== "unchanged") ||
    topology.nodeAction !== "unchanged" || topology.rooftopAction !== "unchanged" || topology.edgeAction !== "unchanged" || topology.linksToCreate.length > 0;
  if (!apply) {
    console.log("Dry run only. No rows or files were written.");
    return;
  }
  if (!changed) {
    await assertRevisionProvenance(actor.id);
    console.log("Already applied. No backup or database write was needed.");
    return;
  }

  const backup = await writeTargetPreimage(rows);
  console.log(`Target-only preimage: ${backup.file} · ${backup.bytes} bytes · sha256 ${backup.sha256}`);
  await applyPackage(actor.id);

  const afterRows = await loadEntries(db);
  const afterPlan = buildEntryPlan(afterRows, actor.id);
  await assertDesiredLinks(db, afterPlan);
  const afterTopology = await buildTopologyPlan(db, actor.id);
  await assertRevisionProvenance(actor.id);
  report(afterPlan, afterTopology, "SEQ-000 owner rulings post-commit verification");
}

main().then(
  () => db.$disconnect(),
  (error) => {
    console.error(error);
    return db.$disconnect().then(() => process.exit(1));
  },
);
