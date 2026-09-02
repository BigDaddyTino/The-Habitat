import "../lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import { BoardWriter, type NodeSpec } from "./lib/story-authoring";

/**
 * The story cohesion pass (owner order 2026-09-02: no errors, nothing
 * missing, strong world connections, player responses with real options,
 * the whole thing flowing). Everything here is reconciled, never appended:
 * nodes by (arc, key), edges by (arc, from, to, label), links as the exact
 * set a scene names, lines by (node, number). A second run reports zero
 * changes.
 *
 * What it fixes, and why:
 *
 *  - The watch is on TINO's wrist. "Wheels" handed the player "your wrist
 *    back" twice; the picks, the panel and the leads all come off his arm,
 *    which is why the band is what tears when he is taken.
 *  - The strike is shown twice — on the correspondent's camera, then in
 *    gameplay. Cold Open now says so: the broadcast was live, the game
 *    starts inside the minute before it lands.
 *  - The mercenary beside Tino in Cold Open is Steve, who rode the pod in
 *    with the player and dies on the roof two cards later.
 *  - Every place the player is asked something now offers a real answer:
 *    Rook's "Where are you bound?" (three answers, three reactions, one
 *    road), the guard's "Where's your partner?", Tino's "You know what I'm
 *    doing when we get off this shithole?", the Kestrel survivor who
 *    recognises the question, NAG's four words (whatever you ask), and
 *    Tomas Vey's briefing. Each option records what the world learns.
 *  - Lines the migration could not attribute now have their speakers;
 *    quote cards and titles that are not speech are retired; a bible link
 *    the splitter flattened to "tino" is Tino again.
 *  - Scenes with no bible references get the ones they are actually about.
 *  - The prologue, both island branches and the Hollow Wing are filed to
 *    the regions they take place in.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-story-cohesion-pass.ts [--apply]
 */

const db = getPrismaClient();
const apply = process.argv.includes("--apply");

// ── Text ────────────────────────────────────────────────────────────────────

const ISLAND = "the-island-is-already-lost";
const KESTREL = "the-last-days-of-kestrel";
const ARCADIA = "binding-in-arcadia";
const CAPTIVITY = "the-captivity-arc";
const SOUTHREACH = "the-southreach-record";
const TRUE_DEATH = "the-danger-of-true-death";

const coldOpenBody = `The blackout breaks into tracer fire. You are face-down behind shattered masonry in a tropical market street that has been converted, violently and recently, into a battlefield: storefronts burning, awnings shredded, civilian cars abandoned mid-flight, and arcane scarring on the walls that no explosive ever left. Somewhere close, a soldier is vomiting. Somewhere closer, Tino is arguing with [[steve]] — the Blue Spiral guard who rode the pod in with you, and who has been on this island for exactly as long as you have.

TINO: "Hey. Eyes up. Eyes the fuck up."

Steve fires over cover. STEVE: "Pearl's pushing the east street!" TINO: "Then let 'em. We're getting boxed in."

The radio answers with a voice already halfway to panic. RADIO: "Stormglass Actual, this is Red Three. We have movement under the streets. Repeat — under the fucking streets." The transmission ends in screaming and static.

Tino looks at you. TINO: "You still with me?"

You don't answer with words. You answer by looking up. That is the whole tutorial: the war teaches, and it does not pause.

The comet you watched arrive on the broadcast has not landed yet. The report was live, and you are inside the minute before it comes down.`;

const theStrikeBody = `The squad advances twenty meters through a scripted combat lane — friendlies shooting, dragging wounded, reloading, shouting orders that already sound like obituaries. Then the sky changes. Every sound drops into one low-frequency pressure tone, the kind you feel in your teeth before you hear it.

Tino looks up. TINO: "Oh, shit."

This is the thing the correspondent's camera tilted up into. [[the-strike]] is not artillery. It is a spell — something cast, at a scale nothing in this war is supposed to be able to cast, from somewhere east along the coast where [[tropic-pearl-trade-house]] keeps its casters — and it comes in across the battlefield rather than down onto it, and it lands like the fist of something that was never asked for permission. Glass bows inward before it breaks. Streetlights die. Gravity forgets itself in glittering arcane particles. Bodies and debris cross your vision and then you are airborne, thrown through your own cover, and the world collapses into tinnitus and a single held breath of black.`;

const wheelsBody = `The one usable truck is locked, and its crew will not be needing it. Tino tries the door with the weary optimism of a man who has never once been lucky.

TINO: "Locked." He surveys the incoming battle. "Naturally."

Then he pushes his sleeve back, and the tutorial that runs for the rest of the game starts without any announcement at all.

**The picks.** The watch case unfolds — properly unfolds, in stages, like it is enjoying itself — and puts out two fine picks. Tino holds his wrist out to you with them still extended.

TINO: "Tension on the bottom. Feel for the one that's stiff. Don't force it, it'll set."

The tumblers are a small honest minigame under theatrical pressure, not punishing, this first time. The horizon gets louder while you work. The door gives.

**The panel.** Inside, the ignition answers with nothing, and it is not a dead battery — there is a Pearl lockout spliced into the column, because the contractors have been losing vehicles all week and somebody in procurement finally did something about it.

A panel throws itself into the air above his wrist, keyed and typed on directly, and Tino talks you through it the way people talk when they are not looking at you: fast, bored, and completely clear. The lockout comes apart.

**The leads.** Two hair-thin leads spool out of the crown.

TINO: "You know how to hot-wire one of these?"

If you are the engineer, he catches himself: "Actually, stupid question. Do your thing." For everyone else: "Good news. Today you learn."

Red to red. The other one to the thing that is obviously not red. The engine catches. For one second, both of you grin like the war isn't watching.

And you look at the watch, because of course you do.

TINO, without turning his head: "Don't even think about it. It's a personal gift."

A palm-sized head resolves above his wrist — mostly eyebrows, and no hurry at all.

NAG: "Damn, Tino. You're getting soft. Usually you ain't this nice."

TINO: "Shut the fuck up, Nag."

NAG, to you, in a completely different register — polite, almost formal, the tone of something being introduced properly for the first time: "He calls me Nag."

It does not explain why. Neither does he. Nobody in this truck has time, and the road is about to narrow.`;

const tinoDrivesBody = `Tino takes the wheel and the convoy escape unrolls past your window like a war film that forgot you were in it: retreating Stormglass units, burning roadside positions, Pearl pursuit weaving through the wrecks, monsters hauling themselves out of impact zones — and once, far off, something so large that the smoke moves around it, shown and not fought.

TINO: "You know what I'm doing when we get off this shithole?"

He is not really asking. He is going to tell you either way. But it is the first time since the market street that anybody has asked you anything, and the road is straight for exactly long enough to answer.`;

const aBoatBody = `Gunfire punches into the side panel. TINO: "Okay. Assuming we get off this shithole."

He swerves around wreckage. TINO: "I'm getting a boat."

Another impact rocks the frame. TINO: "Little piece of coast. Cold beer. Fishing."

He glances at you — one second of a man showing you the inside of his life.

TINO: "And absolutely nobody trying to summon fucking hell."`;

const wherePartnerBody = `You step out of the truck into a military position held together by exhaustion: medics working in open air, ammunition passed hand to hand, engineers splinting the fortifications, terrified recruits, officers arguing over evacuation, boats being readied, prisoners under guard, maps showing how much of the island is simply gone. And one empty space, exactly the size of the man who should be standing next to you.

A guard clocks the truck, then you, then the seat.

GUARD: "Where's your partner?"

You don't answer. Or you answer with something small and true, and it costs you. Either way it is the first thing anybody at [[forward-camp-kestrel]] will know about you.`;

const outOfTimeBody = `The camp commander approaches — senior, spent, still standing anyway.

COMMANDER: "You came from the east road?" The commander reads your face the way officers read casualty lists. COMMANDER: "Fuck."

A radio operator cuts in: "Commander — western perimeter says Pearl armor is moving again." Another: "And the docks are asking if they're cleared to launch."

The commander looks between the battle map and you, and the world's audio begins to narrow, like the island itself is inhaling.

COMMANDER: "We're out of time."`;

const whereBoundBody = `Rook finds you before the map does.

They have been watching the camp fill up with people who should not have made it, and they walk over with the flat, unhurried certainty of somebody who has already decided what they need to know. Not how many Pearl armor you counted. Not what the east road looked like.

COMMANDER: "Where are you bound?"

It takes a second to land, because it is not the question anyone expects after a morning like that one.

The law of this scene: **the answers characterise and change nothing.** They tell Rook what kind of person is standing in their camp, and they tell the player that this world has a question about death which everyone except them already knows the answer to ([[soul-binding]]). Whatever the party says, the next thing that happens is the same, because Rook decided before they walked over.`;

const boundSomewhereBody = `Answer straight — a Forge, a city, a company chapel, whatever the truth is — and Rook nods once and files it. That is a person with somewhere to come back to, and there is nothing else to discuss.

COMMANDER: "Good. Then you already know what this is."

COMMANDER: "Come with me."`;

const boundDeflectBody = `Deflect — *what's it to you*, *why are you asking* — and they let the annoyance show, openly and without heat. They are not being nosy. They are doing inventory.

COMMANDER: "It's inventory. I count what I've got and I count what I'm about to lose, and I need to know which column you're in."

COMMANDER: "Come with me."`;

const boundNowhereBody = `Say you don't know, and something moves behind their face that is closer to alarm than anger.

COMMANDER: "You've been walking a front line with nowhere to come back to."

COMMANDER: "Fuck's sake."

COMMANDER: "Come with me."`;

const oneWhoAskedBody = `Somewhere in the Forge search a Kestrel survivor places you. Not your face. Your question.

"You're the one who asked Rook about the infuser." A pause that runs a beat too long for comfort. "Nobody else did."

They do not have an answer. What they have is an absence, and they have carried it since the island because nobody else wanted it. [[tino]] was not on the beach. He was not in the boats. He was not among the dead, and Kestrel counted its dead twice, because on that last night Kestrel had nothing else to do.

A man does not become nothing.

They are waiting to see what you do with that.`;

const askTheWatchBody = `Somebody says it out loud, in a tent, at two in the morning, because somebody was always going to.

"Ask the watch."

It is a reasonable idea. It is arguably the only idea anyone has had in nine weeks. [[nag]] was on his arm for a decade. It came off in your hand. By any measure you can apply, it is the last thing that was with him.

The panel comes up. The head resolves, mostly eyebrows, and for once there is nothing queued behind it.

NAG: "Ask."`;

const fourWordsBody = `A pause of exactly the wrong length. Not long enough to be thinking. Too long to be nothing.

NAG: "I don't know."

Try it another way. Any way.

NAG: "I don't know."

That is the whole conversation. It does not vary. You can come back to it as often as you like, in any phrasing, with anybody asking, across the entire campaign, and you will get the same four words in the same flat register from a machine that is funny about literally everything else.

**Direction.** Play this absolutely straight and do not signpost it. The scene must read as a dead end, because to the party it is one — they asked the obvious question, got nothing, and moved on. What the player is actually watching is [[nag]] lying, and the two tells are already in the room and neither is a line of dialogue:

It is a *watch*. Ask it the time and it will give you a hundredth of a second. Ask it how long he has been gone and it does not know anything.

And it has never nagged anybody about him. Not once, in nine weeks, from a machine that nags about boots.

Nothing here confirms he is alive, dead, held, or anywhere. That is not restraint on NAG's part — it genuinely does not know any of it ([[what-the-player-knows-about-tino]]). The single thing it knows is how late he is, it has had the figure to a hundredth of a second since the band went, and it will not read it out, because it was built by somebody to expect him home and saying the number out loud is the same as agreeing he is not coming.`;

const manWhoWasThereBody = `[[tomas-vey]] was shift-control on the night, and he is the only person still alive who was inside the building.

He gives you the route from memory. Which galleries flooded, which stairwell is the one that actually goes through, where the archival stack sits and what the door code was in the year the door was installed. It is precise, unhesitating, and useful.

Then he stops and says the other thing, because he has clearly decided in advance that he was going to.

His account does not match the official sequence. It has never matched. He has given it four times to three different institutions and every time somebody has explained to him, kindly, that he was under extraordinary stress, and every time he has agreed that he was — because he was — and gone on remembering it the way he remembers it ([[three-failure-reports]]).

He is not asking you to believe him. He is asking you to bring back the reading so that for the first time in twenty years somebody can check.

"If I'm wrong," he says, in the flat voice of a man who has thought about this every day since, "I would like to know. That is not a small thing to want."

Then he waits, because he has said his piece and he is a man who lets other people say theirs.`;

const nothingAnswersBody = `However they arrived — off the evacuation boats or up a storm beach — something is wrong before anyone can say what. An Echo with nowhere to answer is a feeling before it is a fact, and the fact arrives when somebody in [[port-arcadia]] says it plainly: you are bound to a Forge that is at the bottom of the sea ([[the-soul-forge]], [[forward-camp-kestrel]]). Until you bind again, if you die, you are gone ([[true-death]]).

This is the same walk the mainline makes in Binding in Arcadia, told from the rule's side: the campaign's search for the city's Forge is where the party actually does it, and this quest ends at the same machine. Keep the two in step — what the dockside clerk or the Kestrel survivor says here is what the mainline's survivors already know.

Writers: this is the scene that makes true death legible. Do not let the party talk their way out of understanding it, and do not let the game bind them automatically to spare them the walk.`;

// ── Line reconciliation ────────────────────────────────────────────────────

type LineSpeaker = { slug: string } | { role: string };
type LineSpec = { number: number; speaker: LineSpeaker; text: string; performance?: string; intensity?: number; emotion?: string[]; voiced?: boolean };

const c = (slug: string): LineSpeaker => ({ slug });
const r = (role: string): LineSpeaker => ({ role });
const line = (number: number, speaker: LineSpeaker, text: string, extra: Partial<Omit<LineSpec, "number" | "speaker" | "text">> = {}): LineSpec => ({ number, speaker, text, ...extra });

/** Lines to (re)attribute in place: the stored text stays, the speaker changes. */
const RESPEAK: Array<{ arc: string; node: string; number: number; speaker: LineSpeaker; voiced?: boolean }> = [
  { arc: ISLAND, node: "cold-open", number: 2, speaker: c("steve") },
  { arc: ISLAND, node: "one-idiot", number: 3, speaker: c("tino") },
  { arc: ISLAND, node: "one-idiot", number: 4, speaker: c("tino") },
  { arc: ISLAND, node: "wheels", number: 5, speaker: c("tino") },
  { arc: ISLAND, node: "wheels", number: 6, speaker: c("tino") },
  { arc: ISLAND, node: "wheels", number: 10, speaker: c("nag") },
  { arc: ISLAND, node: "bound-at-kestrel", number: 1, speaker: c("the-kestrel-commander") },
  { arc: ISLAND, node: "the-operations-table", number: 1, speaker: c("the-kestrel-commander") },
  { arc: ISLAND, node: "the-operations-table", number: 2, speaker: c("the-kestrel-commander") },
  { arc: ISLAND, node: "the-operations-table", number: 3, speaker: c("the-kestrel-commander") },
  { arc: ISLAND, node: "the-operations-table", number: 4, speaker: c("the-kestrel-commander") },
  // The quote card is Tino's words, shown not spoken.
  { arc: ISLAND, node: "live-from-the-island", number: 3, speaker: c("tino"), voiced: false },
  { arc: KESTREL, node: "the-dead-do-not-wait", number: 1, speaker: c("the-kestrel-commander") },
  { arc: ARCADIA, node: "the-one-who-asked", number: 1, speaker: r("kestrel-survivor") },
  { arc: ARCADIA, node: "the-one-who-asked", number: 2, speaker: r("kestrel-survivor") },
  { arc: SOUTHREACH, node: "the-man-who-was-there", number: 1, speaker: c("tomas-vey") },
  { arc: SOUTHREACH, node: "the-man-who-was-there", number: 2, speaker: c("tomas-vey") },
  { arc: "the-purge-window", node: "the-forecast", number: 1, speaker: c("keira-ansel") },
  { arc: "the-purge-window", node: "the-forecast", number: 2, speaker: c("keira-ansel") },
];

/** Lines that are not speech (titles, a repeated cue) or that moved to a new card. */
const RETIRE: Array<{ arc: string; node: string; numbers: number[]; because: string }> = [
  { arc: ISLAND, node: "live-from-the-island", numbers: [4], because: "the same utterance is cold-open/01; the beat only says the prologue resumes there" },
  { arc: ISLAND, node: "seq-000", numbers: [5, 11], because: "a screen title and a cinematic title, not speech" },
  { arc: ISLAND, node: "where-is-your-partner", numbers: [2, 3, 4, 5, 6], because: "moved to out-of-time, after the player answers the guard" },
  { arc: ISLAND, node: "where-are-you-bound", numbers: [2, 3, 4], because: "moved to bound-nowhere, the answer that earns them" },
  { arc: ISLAND, node: "tino-drives", numbers: [2, 3, 4, 5], because: "moved to a-boat-cold-beer-fishing, after the player answers him" },
  { arc: CAPTIVITY, node: "ask-the-watch", numbers: [1, 3, 4, 5, 6], because: "the questions are the player's options now; the answers moved to four-words" },
  { arc: "menders-work", node: "regional-alert", numbers: [1], because: "a quoted phrase in narration, not speech" },
];

const RETEXT: Array<{ arc: string; node: string; number: number; text: string }> = [
  { arc: ISLAND, node: "seq-000", number: 7, text: "I got you the best gig we’ve got on Ignit Island. You’ll be with one of the best — or biggest assholes — I know. Depends how you look at it. Hey, Steve. Get this one loaded up and head with them to meet Tino." },
];

/** Lines on the new and reshaped cards. */
const LINES: Array<{ arc: string; node: string; lines: LineSpec[] }> = [
  { arc: ISLAND, node: "out-of-time", lines: [
    line(1, c("the-kestrel-commander"), "You came from the east road?", { performance: "reads your face like a casualty list", intensity: 4, emotion: ["dry"] }),
    line(2, c("the-kestrel-commander"), "Fuck.", { performance: "flat; the answer landed", intensity: 5, emotion: ["sad", "dry"] }),
    line(3, r("radio-operator"), "Commander — western perimeter says Pearl armor is moving again.", { performance: "cutting in, urgent", intensity: 7, emotion: ["urgent"] }),
    line(4, r("radio-operator"), "And the docks are asking if they're cleared to launch.", { performance: "a second operator, over the first", intensity: 6, emotion: ["urgent"] }),
    line(5, c("the-kestrel-commander"), "We're out of time.", { performance: "quiet; the room narrows around it", intensity: 5, emotion: ["command", "calm"] }),
  ] },
  { arc: ISLAND, node: "bound-somewhere", lines: [
    line(1, c("the-kestrel-commander"), "Good. Then you already know what this is.", { performance: "a nod, filed", intensity: 3, emotion: ["calm", "dry"] }),
    line(2, c("the-kestrel-commander"), "Come with me.", { performance: "already walking", intensity: 4, emotion: ["command"] }),
  ] },
  { arc: ISLAND, node: "bound-deflect", lines: [
    line(1, c("the-kestrel-commander"), "It's inventory. I count what I've got and I count what I'm about to lose, and I need to know which column you're in.", { performance: "open annoyance, no heat", intensity: 5, emotion: ["dry", "contempt"] }),
    line(2, c("the-kestrel-commander"), "Come with me.", { performance: "already walking", intensity: 4, emotion: ["command"] }),
  ] },
  { arc: ISLAND, node: "bound-nowhere", lines: [
    line(1, c("the-kestrel-commander"), "You've been walking a front line with nowhere to come back to.", { performance: "closer to alarm than anger", intensity: 6, emotion: ["afraid", "protective"] }),
    line(2, c("the-kestrel-commander"), "Fuck's sake.", { performance: "under the breath", intensity: 5, emotion: ["dry"] }),
    line(3, c("the-kestrel-commander"), "Come with me.", { performance: "already walking", intensity: 4, emotion: ["command"] }),
  ] },
  { arc: ISLAND, node: "a-boat-cold-beer-fishing", lines: [
    line(1, c("tino"), "Okay. Assuming we get off this shithole.", { performance: "correcting himself as a round hits the panel", intensity: 6, emotion: ["dry", "amused"] }),
    line(2, c("tino"), "I'm getting a boat.", { performance: "swerving; said like a decision", intensity: 5, emotion: ["warm"] }),
    line(3, c("tino"), "Little piece of coast. Cold beer. Fishing.", { performance: "each word placed; the frame rocks", intensity: 4, emotion: ["warm", "calm"] }),
    line(4, c("tino"), "And absolutely nobody trying to summon fucking hell.", { performance: "one glance at you; the inside of his life", intensity: 5, emotion: ["warm", "dry"] }),
  ] },
  { arc: CAPTIVITY, node: "four-words", lines: [
    line(1, c("nag"), "I don't know.", { performance: "flat register; a pause of exactly the wrong length before it", intensity: 3, emotion: ["neutral"] }),
    line(2, c("nag"), "I don't know.", { performance: "identical; it does not vary", intensity: 3, emotion: ["neutral"] }),
  ] },
  { arc: SOUTHREACH, node: "vey-bring-it-back", lines: [
    line(1, c("tomas-vey"), "Bring it back before Thursday. After Thursday you can bring back anything you like and it will not matter.", { performance: "a nod at weather", intensity: 4, emotion: ["calm", "dry"] }),
  ] },
  { arc: SOUTHREACH, node: "vey-if-right", lines: [
    line(1, c("tomas-vey"), "Then I was right for twenty years in a room where being right was the same as being confused. I would like to know that too.", { performance: "no bitterness left in it", intensity: 4, emotion: ["sad", "calm"] }),
  ] },
  { arc: SOUTHREACH, node: "vey-nobody-checked", lines: [
    line(1, c("tomas-vey"), "Because checking needs the reading, and the reading is in a building nobody opens. Thursday opens it. Nobody planned that either.", { performance: "the closest he comes to a joke", intensity: 4, emotion: ["dry"] }),
  ] },
  // The only DIALOGUE card with no spoken line: Mender's one question to the
  // only man it has ever addressed by name, in borrowed workplace phrases.
  { arc: "menders-work", node: "the-shift-credential", lines: [
    line(1, c("maintenance-unit-m-17"), "Shift-control, Sector Nine. Work order four-four-seven-one, feeder continuity, Splicefield to Southreach. Has the tie-in been authorised?", { performance: "flat, procedural, deferential; a lookup returned a role", intensity: 2, emotion: ["neutral", "calm"] }),
  ] },
];

// ── Bible references per scene (the exact set) ─────────────────────────────

const LINKS: Array<{ arc: string; node: string; slugs: string[] }> = [
  { arc: ISLAND, node: "cold-open", slugs: ["tino", "steve", "stormglass-cartel", "tropic-pearl-trade-house", "the-starting-island", "something-under-the-war", "the-strike"] },
  { arc: ISLAND, node: "the-strike", slugs: ["the-strike", "tino", "tropic-pearl-trade-house"] },
  { arc: ISLAND, node: "where-is-your-partner", slugs: ["forward-camp-kestrel", "tino"] },
  { arc: ISLAND, node: "your-partner-answer", slugs: ["forward-camp-kestrel", "tino"] },
  { arc: ISLAND, node: "out-of-time", slugs: ["the-kestrel-commander", "tino", "forward-camp-kestrel"] },
  { arc: ISLAND, node: "where-are-you-bound", slugs: ["the-kestrel-commander", "soul-binding"] },
  { arc: ISLAND, node: "where-are-you-bound-answer", slugs: ["the-kestrel-commander", "soul-binding"] },
  { arc: ISLAND, node: "bound-somewhere", slugs: ["the-kestrel-commander", "soul-binding"] },
  { arc: ISLAND, node: "bound-deflect", slugs: ["the-kestrel-commander"] },
  { arc: ISLAND, node: "bound-nowhere", slugs: ["the-kestrel-commander", "soul-binding", "true-death"] },
  { arc: ISLAND, node: "tino-drives", slugs: ["tino"] },
  { arc: ISLAND, node: "assuming-we-get-off", slugs: ["tino"] },
  { arc: ISLAND, node: "a-boat-cold-beer-fishing", slugs: ["tino", "what-the-player-knows-about-tino"] },
  { arc: KESTREL, node: "the-scattered-living", slugs: ["stormglass-cartel", "forward-camp-kestrel"] },
  { arc: KESTREL, node: "the-long-nights", slugs: ["tropic-pearl-trade-house", "true-demons", "the-risen", "forward-camp-kestrel"] },
  { arc: ARCADIA, node: "what-the-city-is-owed", slugs: ["port-arcadia"] },
  { arc: ARCADIA, node: "the-ones-who-lived", slugs: ["port-arcadia", "the-soul-forge"] },
  { arc: ARCADIA, node: "the-army-is-interested", slugs: ["port-arcadia", "peninsula-expeditionary-army"] },
  { arc: ARCADIA, node: "leverage-and-liability", slugs: ["port-arcadia", "tropic-pearl-trade-house", "national-defense-directorate", "drone-surveillance-bureau"] },
  { arc: ARCADIA, node: "the-one-who-asked", slugs: ["tino", "the-kestrel-commander", "what-the-player-knows-about-tino"] },
  { arc: ARCADIA, node: "answer-the-survivor", slugs: ["tino", "has-the-tino-file"] },
  { arc: CAPTIVITY, node: "start-from-a-rumour", slugs: ["tino", "shattermarket", "the-search-was-loud"] },
  { arc: CAPTIVITY, node: "the-shape-of-the-nothing", slugs: ["tino", "the-empty-cribs"] },
  { arc: CAPTIVITY, node: "expected", slugs: ["helix-arcanobiotics", "tino"] },
  { arc: CAPTIVITY, node: "you-have-been-here", slugs: ["draw-nine", "essence", "nag"] },
  { arc: CAPTIVITY, node: "ask-the-watch", slugs: ["nag", "tino"] },
  { arc: CAPTIVITY, node: "ask-it-anything", slugs: ["nag", "tino"] },
  { arc: CAPTIVITY, node: "four-words", slugs: ["nag", "tino", "what-the-player-knows-about-tino"] },
  { arc: SOUTHREACH, node: "the-man-who-was-there", slugs: ["tomas-vey", "three-failure-reports"] },
  { arc: SOUTHREACH, node: "answer-vey", slugs: ["tomas-vey"] },
  { arc: SOUTHREACH, node: "vey-bring-it-back", slugs: ["tomas-vey", "the-last-safe-reading"] },
  { arc: SOUTHREACH, node: "vey-if-right", slugs: ["tomas-vey", "three-failure-reports"] },
  { arc: SOUTHREACH, node: "vey-nobody-checked", slugs: ["tomas-vey", "southreach-complex", "reactor-cycles"] },
  { arc: TRUE_DEATH, node: "nothing-answers", slugs: ["the-soul-forge", "soul-binding", "true-death", "port-arcadia", "forward-camp-kestrel"] },
  { arc: TRUE_DEATH, node: "find-a-forge", slugs: ["port-arcadia", "the-soul-forge"] },
  { arc: TRUE_DEATH, node: "bind-again", slugs: ["the-soul-forge", "soul-binding", "the-kestrel-commander"] },
  { arc: TRUE_DEATH, node: "somewhere-to-come-back-to", slugs: ["true-death", "port-arcadia", "reclamation"] },
];

/** Where each arc takes place, as the region field. */
const ARC_REGIONS: Record<string, string> = {
  [ISLAND]: "the-starting-island",
  [KESTREL]: "forward-camp-kestrel",
  "the-evacuation": "the-starting-island",
  "the-hollow-wing": "draw-nine",
};

// ── The pass ────────────────────────────────────────────────────────────────

async function main() {
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  const writer = new BoardWriter(db, actor.id, apply);

  // A card's canvas position is kept, not zeroed: the sidecar sorts by it.
  const keep = async (arc: string, key: string, spec: Omit<NodeSpec, "x" | "y">): Promise<NodeSpec> => {
    const arcId = await writer.arcId(arc);
    const existing = await db.storyNode.findUnique({ where: { arcId_key: { arcId, key } }, select: { canvasX: true, canvasY: true } });
    return { ...spec, x: existing?.canvasX ?? 0, y: existing?.canvasY ?? 0 };
  };
  const near = async (arc: string, key: string, dx: number, dy: number) => {
    const arcId = await writer.arcId(arc);
    const existing = await db.storyNode.findUnique({ where: { arcId_key: { arcId, key } }, select: { canvasX: true, canvasY: true } });
    return { x: (existing?.canvasX ?? 0) + dx, y: (existing?.canvasY ?? 0) + dy };
  };

  // ── The prologue ────────────────────────────────────────────────────────
  await writer.node(ISLAND, await keep(ISLAND, "cold-open", { key: "cold-open", kind: "SCENE", title: "Eyes The Fuck Up", summary: "No menu. No mercy. You blink back in from a dead broadcast and you are already crouched in a war you are losing — inside the minute before the strike you just watched arrive.", body: coldOpenBody }));
  await writer.node(ISLAND, await keep(ISLAND, "the-strike", { key: "the-strike", kind: "BEAT", title: "The Sky Changes Its Mind", summary: "The squad moves. The sky falls. The player is not expected to win this battle — they are expected to survive being wrong about what a battle is.", body: theStrikeBody }));
  await writer.node(ISLAND, await keep(ISLAND, "wheels", { key: "wheels", kind: "SCENE", title: "Good News. Today You Learn.", summary: "One locked truck, three tools, and the rudest wristwatch on the island — on Tino's wrist, where it stays until the band gives.", body: wheelsBody }));

  // Tino asks; the player answers; Tino tells you about the boat.
  await writer.node(ISLAND, await keep(ISLAND, "tino-drives", { key: "tino-drives", kind: "DIALOGUE", title: "A Boat, Cold Beer, Fishing", summary: "Tino drives so the player can watch the war go by — and asks the first question anybody has asked them since the market street.", body: tinoDrivesBody, speakerSlug: "tino" }));
  await writer.node(ISLAND, { key: "assuming-we-get-off", kind: "CHOICE", title: "Assuming We Get Off", summary: "The road is straight for exactly long enough to answer him.", body: `He asked. Rounds are coming through the side panel and the truck is doing sixty through wreckage, and he asked.

Whatever you say, he tells you anyway. He was always going to. But what you say is the first thing you have said to him since he told you to look up, and he hears it.`, ...(await near(ISLAND, "tino-drives", 300, 40)) });
  await writer.node(ISLAND, { key: "a-boat-cold-beer-fishing", kind: "DIALOGUE", title: "The Inside of His Life", summary: "In the middle of the escape, he builds himself a small human future, out loud, moments before it is taken from him.", body: aBoatBody, speakerSlug: "tino", ...(await near(ISLAND, "tino-drives", 600, 80)) });
  await writer.retireEdge(ISLAND, "tino-drives", "tino-is-taken", null, "the player answers him first; the boat, the beer and the fishing follow on a-boat-cold-beer-fishing");
  await writer.edge(ISLAND, { from: "tino-drives", to: "assuming-we-get-off" });
  await writer.edge(ISLAND, { from: "assuming-we-get-off", to: "a-boat-cold-beer-fishing", label: "Tell me.", effects: ["Tino gets to say the plan out loud to somebody who asked; the party remembers it as a plan."] });
  await writer.edge(ISLAND, { from: "assuming-we-get-off", to: "a-boat-cold-beer-fishing", label: "We're getting off?", effects: ["Tino corrects himself before he answers; the plan is offered as a hedge, and the party remembers the hedge."] });
  await writer.edge(ISLAND, { from: "assuming-we-get-off", to: "a-boat-cold-beer-fishing", label: "Watch the road.", effects: ["He tells you anyway, eyes on the wreckage; the party remembers not asking."] });
  await writer.edge(ISLAND, { from: "a-boat-cold-beer-fishing", to: "tino-is-taken" });

  // The guard asks; the player answers; Rook arrives and the world narrows.
  await writer.node(ISLAND, await keep(ISLAND, "where-is-your-partner", { key: "where-is-your-partner", kind: "DIALOGUE", title: "Where's Your Partner?", summary: "Arrival at the camp that is barely holding, and one question the player has to answer before anyone at Kestrel knows anything else about them.", body: wherePartnerBody }));
  await writer.node(ISLAND, { key: "your-partner-answer", kind: "CHOICE", title: "The Empty Seat", summary: "What you say about the man who should be standing next to you.", body: `The guard is waiting. The seat is empty. Whatever you say next is the first thing anybody at Kestrel will know about you, and the camp has a long memory for first things.`, ...(await near(ISLAND, "where-is-your-partner", 300, 40)) });
  await writer.node(ISLAND, { key: "out-of-time", kind: "DIALOGUE", title: "We're Out of Time", summary: "The commander reads the answer off your face, the radios close in, and the island inhales for the title sequence.", body: outOfTimeBody, speakerSlug: "the-kestrel-commander", ...(await near(ISLAND, "where-is-your-partner", 600, 80)) });
  await writer.retireEdge(ISLAND, "where-is-your-partner", "the-shard", null, "the player answers the guard first; the commander's arrival is its own card, out-of-time");
  await writer.edge(ISLAND, { from: "where-is-your-partner", to: "your-partner-answer" });
  await writer.edge(ISLAND, { from: "your-partner-answer", to: "out-of-time", label: "Say nothing.", effects: ["The camp reads the silence; it has seen that face before, and files the party as people who do not waste words."] });
  await writer.edge(ISLAND, { from: "your-partner-answer", to: "out-of-time", label: "He's gone.", effects: ["Said out loud for the first time, and it costs exactly what it sounds like; the camp files the party as people who say the true thing."] });
  await writer.edge(ISLAND, { from: "your-partner-answer", to: "out-of-time", label: "Something took him on the road.", effects: ["The first report of the thing on the east road reaches Kestrel, from you; the scouts hear it before the commander does."] });
  await writer.edge(ISLAND, { from: "out-of-time", to: "the-shard" });

  // Rook asks where you are bound; three answers, three reactions, one road.
  await writer.node(ISLAND, await keep(ISLAND, "where-are-you-bound", { key: "where-are-you-bound", kind: "DIALOGUE", title: "Where Are You Bound?", summary: "Rook's first question is not about the battle, and the answer tells them what kind of person is standing in their camp.", body: whereBoundBody, speakerSlug: "the-kestrel-commander" }));
  await writer.node(ISLAND, { key: "where-are-you-bound-answer", kind: "CHOICE", title: "Your Answer", summary: "Three ways to answer a question you have never been asked. Rook listens to all of them the same way: as inventory.", body: `Three ways to answer a question you have never been asked before, from a commander who already knows what they are going to do with you whatever you say.

Rook is listening to all of them the same way. As inventory.`, ...(await near(ISLAND, "where-are-you-bound", 300, 40)) });
  await writer.node(ISLAND, { key: "bound-somewhere", kind: "DIALOGUE", title: "Somewhere to Come Back To", summary: "A straight answer. Rook nods once and files it.", body: boundSomewhereBody, speakerSlug: "the-kestrel-commander", ...(await near(ISLAND, "where-are-you-bound", 600, 0)) });
  await writer.node(ISLAND, { key: "bound-deflect", kind: "DIALOGUE", title: "Doing Inventory", summary: "Deflect, and Rook lets the annoyance show, openly and without heat.", body: boundDeflectBody, speakerSlug: "the-kestrel-commander", ...(await near(ISLAND, "where-are-you-bound", 600, 80)) });
  await writer.node(ISLAND, { key: "bound-nowhere", kind: "DIALOGUE", title: "Nowhere to Come Back To", summary: "Say you don't know, and something moves behind Rook's face that is closer to alarm than anger.", body: boundNowhereBody, speakerSlug: "the-kestrel-commander", ...(await near(ISLAND, "where-are-you-bound", 600, 160)) });
  await writer.retireEdge(ISLAND, "where-are-you-bound", "bound-at-kestrel", null, "the answer is the player's to give; each answer has its own card before the Forge");
  await writer.edge(ISLAND, { from: "where-are-you-bound", to: "where-are-you-bound-answer" });
  await writer.edge(ISLAND, { from: "where-are-you-bound-answer", to: "bound-somewhere", label: "Name a Forge, a city, a company chapel.", effects: ["Rook files the party as people with somewhere to come back to."] });
  await writer.edge(ISLAND, { from: "where-are-you-bound-answer", to: "bound-deflect", label: "What's it to you?", effects: ["Rook files the party as difficult, and alive, and worth the annoyance."] });
  await writer.edge(ISLAND, { from: "where-are-you-bound-answer", to: "bound-nowhere", label: "I don't know.", effects: ["Rook files the party as unbound: a front line walked with nowhere to come back to."] });
  await writer.edge(ISLAND, { from: "bound-somewhere", to: "bound-at-kestrel" });
  await writer.edge(ISLAND, { from: "bound-deflect", to: "bound-at-kestrel" });
  await writer.edge(ISLAND, { from: "bound-nowhere", to: "bound-at-kestrel" });

  // ── Binding in Arcadia: the survivor who recognises the question ─────────
  await writer.node(ARCADIA, await keep(ARCADIA, "the-one-who-asked", { key: "the-one-who-asked", kind: "SCENE", title: "The One Who Asked", summary: "A Kestrel survivor recognises the party — not by face, by question — and waits to see what they do with an absence.", body: oneWhoAskedBody, effects: ["set flag: has-the-tino-file"] }));
  await writer.node(ARCADIA, { key: "answer-the-survivor", kind: "CHOICE", title: "What You Do With the Question", summary: "The first line of a file that does not exist yet.", body: `They are waiting. The Forge is somewhere ahead and every one of you still dies for good, and a stranger has just handed you the one thing nobody else on the island wanted to carry.

Write it down. However you answer them, it is the first line of a file that does not exist yet, and it exists at all because somebody in your party thought to ask a busy commander one question about one infuser on the worst night of the war.`, ...(await near(ARCADIA, "the-one-who-asked", 300, 40)) });
  await writer.retireEdge(ARCADIA, "the-one-who-asked", "bind-to-arcadia", null, "the party answers the survivor before the Forge; the file starts with what they say");
  await writer.edge(ARCADIA, { from: "the-one-who-asked", to: "answer-the-survivor" });
  await writer.edge(ARCADIA, { from: "answer-the-survivor", to: "bind-to-arcadia", label: "I asked. Tell me everything you counted.", effects: ["The survivor gives up the absence they have been carrying: the count, twice, and the empty column; the file opens with numbers."] });
  await writer.edge(ARCADIA, { from: "answer-the-survivor", to: "bind-to-arcadia", label: "Who else has asked about him?", effects: ["Nobody. The file opens with a count of one, and the party knows the search is theirs alone."] });
  await writer.edge(ARCADIA, { from: "answer-the-survivor", to: "bind-to-arcadia", label: "Keep walking.", effects: ["The survivor follows anyway and says it on the move; the file gets written by somebody who did not want it either."] });

  // ── The Captivity Arc: ask the watch anything, get four words ────────────
  await writer.node(CAPTIVITY, await keep(CAPTIVITY, "ask-the-watch", { key: "ask-the-watch", kind: "DIALOGUE", title: "Ask the Watch", summary: "The only idea anybody has had in nine weeks. It was on his arm for a decade. It says: ask.", body: askTheWatchBody, speakerSlug: "nag", effects: ["The party has asked and been told nothing.", "NAG's refusal is on the record for anyone who rewatches it."] }));
  await writer.node(CAPTIVITY, { key: "ask-it-anything", kind: "CHOICE", title: "Ask It Anything", summary: "Three questions for a machine that knows the time to a hundredth of a second.", body: `It is waiting, and for once nothing is queued behind the eyebrows.

Ask it anything. Ask it the thing everyone in the tent is thinking, or the thing nobody wants to say, or the one question a watch of all things ought to be able to answer.`, ...(await near(CAPTIVITY, "ask-the-watch", 300, 40)) });
  await writer.node(CAPTIVITY, { key: "four-words", kind: "DIALOGUE", title: "Four Words", summary: "Whatever you asked, the same four words in the same flat register. It does not vary. Play it as a dead end.", body: fourWordsBody, speakerSlug: "nag", ...(await near(CAPTIVITY, "ask-the-watch", 600, 80)) });
  await writer.retireEdge(CAPTIVITY, "ask-the-watch", "owner-gate-the-captor", null, "the questions are the player's; the answer is its own card, four-words");
  await writer.edge(CAPTIVITY, { from: "ask-the-watch", to: "ask-it-anything" });
  await writer.edge(CAPTIVITY, { from: "ask-it-anything", to: "four-words", label: "Where is he?", effects: ["NAG answers with the same four words; the party asked the obvious question and moved on."] });
  await writer.edge(CAPTIVITY, { from: "ask-it-anything", to: "four-words", label: "Is he alive?", effects: ["NAG answers with the same four words; nothing in the room confirms he is alive, dead, held, or anywhere."] });
  await writer.edge(CAPTIVITY, { from: "ask-it-anything", to: "four-words", label: "How long has it been?", effects: ["NAG answers with the same four words — to the one question a watch could answer to a hundredth of a second. The lie is on the record."] });
  await writer.edge(CAPTIVITY, { from: "four-words", to: "owner-gate-the-captor" });

  // ── The Southreach Record: answering Tomas Vey ────────────────────────────
  await writer.node(SOUTHREACH, await keep(SOUTHREACH, "the-man-who-was-there", { key: "the-man-who-was-there", kind: "DIALOGUE", title: "The Man Who Was There", summary: "Tomas Vey briefs the party, tells them not to trust him, and waits for an answer.", body: manWhoWasThereBody, speakerSlug: "tomas-vey" }));
  await writer.node(SOUTHREACH, { key: "answer-vey", kind: "CHOICE", title: "What You Tell Him", summary: "He has said his piece. He is a man who lets other people say theirs.", body: `He has been told he was confused by three institutions and he has agreed with all of them, and he is still standing here with the route in his head and the door code from the year the door went in.

Say something to him. He will remember what.`, ...(await near(SOUTHREACH, "the-man-who-was-there", 300, 40)) });
  await writer.node(SOUTHREACH, { key: "vey-bring-it-back", kind: "DIALOGUE", title: "Before Thursday", summary: "A promise, and the only deadline that matters.", body: `He nods, once, the way people nod at weather.

VEY: "Bring it back before Thursday. After Thursday you can bring back anything you like and it will not matter."`, speakerSlug: "tomas-vey", ...(await near(SOUTHREACH, "the-man-who-was-there", 600, 0)) });
  await writer.node(SOUTHREACH, { key: "vey-if-right", kind: "DIALOGUE", title: "And If You're Right", summary: "Twenty years of being right in a room where being right was the same as being confused.", body: `VEY: "Then I was right for twenty years in a room where being right was the same as being confused. I would like to know that too."

He does not say it bitterly. He has had a long time to take the bitterness out of it, and what is left is only the wanting.`, speakerSlug: "tomas-vey", ...(await near(SOUTHREACH, "the-man-who-was-there", 600, 80)) });
  await writer.node(SOUTHREACH, { key: "vey-nobody-checked", kind: "DIALOGUE", title: "Why Nobody Checked", summary: "The reading is in a building nobody opens. Thursday opens it.", body: `VEY: "Because checking needs the reading, and the reading is in a building nobody opens. Thursday opens it. Nobody planned that either."

It is the closest he comes to a joke, and he watches to see whether you take it as one.`, speakerSlug: "tomas-vey", ...(await near(SOUTHREACH, "the-man-who-was-there", 600, 160)) });
  await writer.retireEdge(SOUTHREACH, "the-man-who-was-there", "fieldwork", null, "the party answers Vey before the fieldwork; each answer has its own card");
  await writer.edge(SOUTHREACH, { from: "the-man-who-was-there", to: "answer-vey" });
  await writer.edge(SOUTHREACH, { from: "answer-vey", to: "vey-bring-it-back", label: "We'll bring it back.", effects: ["Vey has a promise for the first time in twenty years, and the party has a deadline."] });
  await writer.edge(SOUTHREACH, { from: "answer-vey", to: "vey-if-right", label: "And if you're right?", effects: ["Vey says what being right would mean; the party carries it into the building."] });
  await writer.edge(SOUTHREACH, { from: "answer-vey", to: "vey-nobody-checked", label: "Why has nobody checked in twenty years?", effects: ["Vey names the restart as the only reason anyone can check now; the clock is the quest."] });
  await writer.edge(SOUTHREACH, { from: "vey-bring-it-back", to: "fieldwork" });
  await writer.edge(SOUTHREACH, { from: "vey-if-right", to: "fieldwork" });
  await writer.edge(SOUTHREACH, { from: "vey-nobody-checked", to: "fieldwork" });

  // ── The Danger of True Death: the rule's own telling, kept in step ────────
  await writer.node(TRUE_DEATH, await keep(TRUE_DEATH, "nothing-answers", { key: "nothing-answers", kind: "QUEST_START", title: "Nothing Answers", summary: "Landfall, and the wrongness the party cannot name yet: they are still bound to Kestrel, and Kestrel is gone.", body: nothingAnswersBody }));

  // ── References ────────────────────────────────────────────────────────────
  for (const entry of LINKS) await writer.links(entry.arc, entry.node, entry.slugs);

  // ── Lines ─────────────────────────────────────────────────────────────────
  const nodeId = async (arc: string, key: string) => {
    const arcId = await writer.arcId(arc);
    const node = await db.storyNode.findUnique({ where: { arcId_key: { arcId, key } }, select: { id: true } });
    return node?.id ?? null;
  };
  const entryId = async (slug: string) => (await db.storyEntry.findUnique({ where: { slug }, select: { id: true } }))?.id ?? null;
  const speakerData = async (speaker: LineSpeaker) => {
    if ("slug" in speaker) {
      const id = await entryId(speaker.slug);
      if (!id) throw new Error(`speaker "${speaker.slug}" is not in the bible`);
      return { speakerEntryId: id, speakerRole: null };
    }
    return { speakerEntryId: null, speakerRole: speaker.role };
  };
  const lineChanges: string[] = [];

  for (const fix of RESPEAK) {
    const id = await nodeId(fix.arc, fix.node);
    if (!id) { lineChanges.push(`MISSING ${fix.arc}/${fix.node}`); continue; }
    const stored = await db.storyLine.findUnique({ where: { nodeId_number: { nodeId: id, number: fix.number } } });
    if (!stored || stored.retiredAt) continue;
    const data = await speakerData(fix.speaker);
    const voiced = fix.voiced ?? stored.voiced;
    if (stored.speakerEntryId === data.speakerEntryId && stored.speakerRole === data.speakerRole && stored.voiced === voiced) continue;
    lineChanges.push(`respeak ${fix.arc}/${fix.node}/${String(fix.number).padStart(2, "0")} -> ${"slug" in fix.speaker ? fix.speaker.slug : fix.speaker.role}${fix.voiced === false ? " (silent)" : ""}`);
    if (apply) await db.storyLine.update({ where: { id: stored.id }, data: { ...data, voiced, updatedByUserId: actor.id } });
  }
  for (const fix of RETEXT) {
    const id = await nodeId(fix.arc, fix.node);
    if (!id) continue;
    const stored = await db.storyLine.findUnique({ where: { nodeId_number: { nodeId: id, number: fix.number } } });
    if (!stored || stored.text === fix.text) continue;
    lineChanges.push(`retext ${fix.arc}/${fix.node}/${String(fix.number).padStart(2, "0")}`);
    if (apply) await db.storyLine.update({ where: { id: stored.id }, data: { text: fix.text, updatedByUserId: actor.id } });
  }
  for (const fix of RETIRE) {
    const id = await nodeId(fix.arc, fix.node);
    if (!id) continue;
    for (const number of fix.numbers) {
      const stored = await db.storyLine.findUnique({ where: { nodeId_number: { nodeId: id, number } } });
      if (!stored || stored.retiredAt) continue;
      lineChanges.push(`retire ${fix.arc}/${fix.node}/${String(number).padStart(2, "0")} — ${fix.because}`);
      if (apply) await db.storyLine.update({ where: { id: stored.id }, data: { retiredAt: new Date(), updatedByUserId: actor.id } });
    }
  }
  for (const set of LINES) {
    const id = await nodeId(set.arc, set.node);
    if (!id) { if (apply) throw new Error(`no node ${set.arc}/${set.node} for its lines`); lineChanges.push(`(lines on ${set.arc}/${set.node} land after create)`); continue; }
    for (const [index, spec] of set.lines.entries()) {
      const data = { ...(await speakerData(spec.speaker)), order: index, text: spec.text, performance: spec.performance ?? "", intensity: spec.intensity ?? 5, emotion: spec.emotion ?? [], locale: "en-US", voiced: spec.voiced ?? true, retiredAt: null as Date | null };
      const stored = await db.storyLine.findUnique({ where: { nodeId_number: { nodeId: id, number: spec.number } } });
      if (!stored) {
        lineChanges.push(`create ${set.arc}/${set.node}/${String(spec.number).padStart(2, "0")} "${spec.text.slice(0, 50)}"`);
        if (apply) await db.storyLine.create({ data: { nodeId: id, number: spec.number, createdByUserId: actor.id, ...data } });
        continue;
      }
      const same = stored.speakerEntryId === data.speakerEntryId && stored.speakerRole === data.speakerRole && stored.order === data.order && stored.text === data.text && stored.performance === data.performance && stored.intensity === data.intensity && JSON.stringify(stored.emotion) === JSON.stringify(data.emotion) && stored.voiced === data.voiced && stored.retiredAt === null;
      if (same) continue;
      lineChanges.push(`update ${set.arc}/${set.node}/${String(spec.number).padStart(2, "0")}`);
      if (apply) await db.storyLine.update({ where: { id: stored.id }, data: { ...data, updatedByUserId: actor.id } });
    }
  }

  // ── Arc regions ───────────────────────────────────────────────────────────
  const arcChanges: string[] = [];
  for (const [slug, region] of Object.entries(ARC_REGIONS)) {
    const arc = await db.storyArc.findUnique({ where: { slug }, select: { id: true, regionEntryId: true, lockedAt: true } });
    const regionId = await entryId(region);
    if (!arc || !regionId) { arcChanges.push(`MISSING ${slug} or region ${region}`); continue; }
    if (arc.lockedAt) { arcChanges.push(`LOCKED ${slug}: region left as is`); continue; }
    if (arc.regionEntryId === regionId) continue;
    arcChanges.push(`region on ${slug} -> ${region}`);
    if (apply) {
      await db.storyArc.update({ where: { id: arc.id }, data: { regionEntryId: regionId } });
      await db.storyRevision.create({ data: { entityType: "ARC", entityId: arc.id, arcId: arc.id, action: "UPDATED", actorUserId: actor.id, summary: `Filed the story to ${region}.` } });
    }
  }

  writer.report(`Story cohesion pass — ${apply ? "APPLIED" : "PREVIEW"}`);
  console.log(`\nLines (${lineChanges.length})`);
  for (const change of lineChanges) console.log(`  ${change}`);
  console.log(`\nArcs (${arcChanges.length})`);
  for (const change of arcChanges) console.log(`  ${change}`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
