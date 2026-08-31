/**
 * The eight talent trees — the reeled-in build system, as data.
 *
 * Source of truth for the /codex/talents calculator. Transcribed from the
 * approved "Eight Trees" spec (2026-08-30): eight classes, one tree each —
 * a core pillar plus five branches, 48–50 bought nodes per class, costs 1–5,
 * plus a seven-node corrupted branch that costs nothing and lights by
 * corruption phase. Forks are exclusive pairs; weaves are bridges between
 * branches (buying either end links both paths); ceilings are trainer-gated.
 *
 * The point budget is the ruled formula: 1 talent point per level, 5 at
 * level 1 and every 10th — 144 by the cap. Every tree deliberately holds
 * more than 144 points of nodes, so nobody owns everything.
 */

export type TalentNode = {
  id: string;
  name: string;
  desc: string;
  cost: number;
  /** Chip text when the node unlocks abilities from the six schools' 108. */
  spell?: string;
  /** Trainer text when the node is a ceiling — points alone never open it. */
  ceiling?: string;
  /** Partner node id in another branch: buying either end links both paths. */
  weave?: string;
  /** Partner node id of an exclusive pair: buying one locks the other. */
  fork?: string;
  /** Override prerequisite: any one of these owned unlocks the node.
   *  Default is the node directly above in the same branch. */
  requiresAny?: string[];
};

export type TalentBranch = { name: string; core?: boolean; nodes: TalentNode[] };

export type CorruptedNode = { phase: number; name: string; desc: string };

export type TalentClass = {
  slug: string;
  name: string;
  archetype: string;
  growth: string;
  constellation: string;
  constellationNote: string;
  branches: TalentBranch[];
  corrupted: { title: string; tagline: string; nodes: CorruptedNode[] };
  plays: string;
};

/** Points available at a level: 1 per level, 5 at level 1 and every 10th. */
export function talentPointsAtLevel(level: number): number {
  const capped = Math.max(1, Math.min(100, Math.floor(level)));
  return 5 + (capped - 1) + 4 * Math.floor(capped / 10);
}

const n = (id: string, name: string, desc: string, cost: number, extra: Partial<TalentNode> = {}): TalentNode =>
  ({ id, name, desc, cost, ...extra });

export const talentClasses: TalentClass[] = [
  // =========================================================== BASTION
  {
    slug: "bastion",
    name: "Bastion",
    archetype: "Warrior · Soldier",
    growth: "+2 Conditioning / +1 Resilience per level",
    constellation: "The Gate",
    constellationNote: "A gatehouse arch: the core spine is the keystone course, Shieldwall and Breacher the two towers, Aegis the ward-light over the arch, Juggernaut and Last Stand the foundations.",
    branches: [
      { name: "The Line", core: true, nodes: [
        n("stand-fast", "Stand Fast", "Steadier under fire; flinch and sway reduced.", 1),
        n("bear-the-weight", "Bear the Weight", "Carry more, slow down less.", 2),
        n("thousand-round-stare", "Thousand-Round Stare", "Enemy plates, wards and rigs read on sight.", 2),
        n("spit-and-stand", "Spit and Stand", "Once a fight, shake a Grazed state off.", 2),
        n("forced-march", "Forced March", "Your squad moves at your pace, quietly.", 2),
        n("dig-in", "Dig In", "Hold one spot thirty seconds and it counts as cover.", 3),
        n("hold-the-line", "Hold the Line", "Allies beside you break later, bleed slower.", 3),
        n("written-defeat", "Written Defeat", "Fall back with the line intact, after the horn.", 5, { ceiling: "Commander Rook" }),
      ]},
      { name: "Shieldwall", nodes: [
        n("stand-over-them", "Stand Over Them", "Guard a downed ally; hits route to you.", 1),
        n("meet-the-wall", "Meet the Wall", "Active — a shield check that ends with them where you wanted them: usually between you and their friends.", 2),
        n("look-at-me", "Look At Me", "Active — for five seconds, you are the only target worth shooting.", 2),
        n("one-more-hit", "One More Hit", "Your plates break one hit later.", 2),
        n("lend-the-wall", "Lend the Wall", "Your ward, their plate.", 2, { weave: "first-ward" }),
        n("rooted", "Rooted", "Blast and shove barely move you.", 3),
        n("between", "Between", "One step, taken in time — the hit meant for them lands on you.", 3),
        n("answer-in-kind", "Answer in Kind", "Every hit your plates ate this fight is a debt. Active — pay it back, with interest.", 3),
        n("immovable", "Immovable", "You cannot be moved. Ever.", 4, { fork: "unstoppable" }),
      ]},
      { name: "Breacher", nodes: [
        n("point-man", "Point Man", "First through, and the first shot at you misses more.", 1),
        n("doorway", "Doorway", "The fight ends in the first three seconds.", 1),
        n("loud-mercy", "Loud Mercy", "Breach charges that blind and deafen instead of kill — your call which.", 2),
        n("shaped-charge", "Shaped Charge", "Choose where it lands, and on whom.", 2),
        n("through-the-gap", "Through the Gap", "Momentum carried room to room.", 2, { weave: "past-the-governor" }),
        n("rolling-breach", "Rolling Breach", "Room to room without resetting — the assault chains.", 3),
        n("controlled-collapse", "Controlled Collapse", "Bring it down where you said it would land.", 4, { ceiling: "the Blast Foreman" }),
        n("unstoppable", "Unstoppable", "Nothing holds a door against you.", 4, { fork: "immovable" }),
      ]},
      { name: "Aegis", nodes: [
        n("static-on-the-skin", "Static on the Skin", "Feel a ward before you walk into it.", 1),
        n("first-ward", "First Ward", "Seal — a doorway that holds as long as you do.", 2, { spell: "Spell · Containment", weave: "lend-the-wall" }),
        n("hold", "Hold", "A thing kept where it is.", 2, { spell: "Spell · Containment" }),
        n("the-moving-wall", "The Moving Wall", "The Seal advances with the line.", 2),
        n("quiet-ground", "Quiet Ground", "No sound leaves your position.", 3, { spell: "Spell · Containment" }),
        n("second-nature", "Second Nature", "Wards cost less, hold longer.", 3),
        n("seal-the-breach", "Seal the Breach", "An instant Seal, slammed into a hole as it opens.", 3),
        n("muzzle", "Muzzle", "Nothing leaves at all. Not light, sound, or blood.", 5, { spell: "Master spell", ceiling: "the Cordon Captain" }),
      ]},
      { name: "Juggernaut", nodes: [
        n("first-chrome", "First Chrome", "One augment slot opened, financed or not.", 1),
        n("union-fittings", "Union Fittings", "Union parts, Union prices, no questions at the counter.", 2),
        n("room-for-more", "Room for More", "A second slot; the body stops arguing.", 2),
        n("knuckle-plate", "Knuckle Plate", "Your hands are issue equipment now.", 2),
        n("faraday-bones", "Faraday Bones", "ELECTRICAL doesn't vent your chrome.", 3),
        n("past-the-governor", "Past the Governor", "A limb run past spec, briefly.", 3, { weave: "through-the-gap" }),
        n("come-take-it", "Come Take It", "Your chrome takes no remote lockout — the agent has to come in person.", 3),
        n("walking-armoury", "Walking Armoury", "Your frame counts as cover for allies.", 4),
      ]},
      { name: "Last Stand", nodes: [
        n("slow-leak", "Slow Leak", "Bleeding states tick slower.", 1),
        n("field-dressing", "Field Dressing", "Patch yourself one-handed, still shooting.", 1),
        n("walk-it-off", "Walk It Off", "One lasting wound suppressed per day.", 2),
        n("pain-ledger", "Pain Ledger", "Every wound state you carry sharpens you instead of dulling you.", 2),
        n("on-your-feet", "On Your Feet", "Pull an ally off the Dying clock faster.", 2),
        n("argue-with-the-clock", "Argue With the Clock", "Your own Dying clock runs slow.", 3),
        n("refuse-the-ground", "Refuse the Ground", "Once a day, Down waits ten seconds while you finish something.", 3),
        n("three-seconds", "Three Seconds", "The fight ends before it starts.", 5, { ceiling: "the Drill Master" }),
      ]},
    ],
    corrupted: {
      title: "Rustline",
      tagline: "the corrupted branch — no points, ever. Each node lights with its phase, and never goes out.",
      nodes: [
        { phase: 1, name: "Shakeproof Stock", desc: "The tremor vanishes into a braced weapon; shouldered, nobody sees it." },
        { phase: 2, name: "Grounded Steel", desc: "Veining grounds through your armour — overcharge routes into the steel." },
        { phase: 3, name: "Hungry Stand", desc: "Holding ground quiets the Appetite. The line is the meal." },
        { phase: 4, name: "Wallreader", desc: "Loads and failing structure felt through your boots, before the engineers know." },
        { phase: 5, name: "Somebody's War", desc: "Drills you were never taught surface under fire — from whoever the dose used to be." },
        { phase: 6, name: "The Door Holds", desc: "Nobody billets with you. Nothing gets past you — at Turning, your body counts as a barricade." },
        { phase: 7, name: "The Last Wall", desc: "The line continues without you." },
      ],
    },
    plays: "Plant and protect — Dig In, Look At Me and Immovable make a fortress the enemy has to answer while Hold the Line keeps everyone behind you alive. Or breach — Doorway into Rolling Breach into Three Seconds clears a building room by room. The Aegis line makes either build mobile: the ward walks, and the squad walks inside it.",
  },

  // =========================================================== SPECTOR
  {
    slug: "spector",
    name: "Spector",
    archetype: "Rogue · Marksman",
    growth: "+2 Coordination / +1 Acuity per level",
    constellation: "The Long Eye",
    constellationNote: "A rifle in profile: the core spine runs stock to muzzle, the five branches hang off it like scope rings and rail fittings, and the two fork stars sit at the muzzle — the loud round and the quiet one.",
    branches: [
      { name: "Fieldcraft", core: true, nodes: [
        n("nothing-underfoot", "Nothing Underfoot", "Move fast without being loud about it.", 1),
        n("taped-and-blacked", "Taped and Blacked", "Nothing on you rattles, glints or beeps.", 1),
        n("read-the-room", "Read the Room", "Armed, paid, or about to stop being either — on entry.", 2),
        n("patience", "Patience", "Hold a position or a sight picture far longer.", 2),
        n("neck-hairs", "Neck Hairs", "A cold prickle before the ambush, not after.", 2),
        n("second-entry", "Second Entry", "There is always another way in. You see it.", 3),
        n("one-breath", "One Breath", "The world slows for one held breath.", 3),
        n("cold-adrenaline", "Cold Adrenaline", "Being shot at steadies your hands instead of shaking them.", 3),
        n("clean-exit", "Clean Exit", "Leave any fight, once a day, no questions.", 5),
      ]},
      { name: "Marksman", nodes: [
        n("steady-breath", "Steady Breath", "Sway shrinks; first shots land.", 1),
        n("mil-dot-mind", "Mil-Dot Mind", "Distances read true without instruments.", 1),
        n("double-tap", "Double Tap", "The second round remembers the first.", 2),
        n("windage", "Windage", "Distance and weather stop being excuses.", 2),
        n("seam-finder", "Seam Finder", "The gap in the plate shows itself.", 2),
        n("cold-barrel", "Cold Barrel", "Your first shot of a fight is your best one.", 3),
        n("called-shot", "Called Shot", "Name the plate; the round finds the hole.", 4, { ceiling: "the Range Instructor" }),
        n("signature-shot", "Signature Shot", "One round a fight, enormous and famous. Everyone knows it was you.", 4, { fork: "never-here" }),
      ]},
      { name: "Ghost", nodes: [
        n("old-floorboards", "Old Floorboards", "Gravel, glass and old floors keep your secrets.", 1),
        n("fade-drill", "Fade Drill", "Break line of sight and stay broken.", 1),
        n("blur", "Blur", "Unmemorable rather than invisible.", 2, { spell: "Spell · Perceptual" }),
        n("static", "Static", "One sense, fuzzed — the ear that would catch you, or the eye.", 2, { spell: "Spell · Perceptual" }),
        n("crowd-skin", "Crowd Skin", "In any crowd, you are the person nobody describes.", 2),
        n("dim", "Dim", "Kill the light without touching the source.", 2, { spell: "Spell · Occlusive", weave: "kill-the-circuit" }),
        n("blind-spot", "Blind Spot", "You know where the lattice cannot see.", 4, { ceiling: "the Bureau Analyst" }),
        n("never-here", "Never Here", "Suspicion scores on you decay. Witnesses doubt themselves.", 4, { fork: "signature-shot" }),
      ]},
      { name: "Saboteur", nodes: [
        n("pocket-arsenal", "Pocket Arsenal", "The right tool is always the one in your hand.", 1),
        n("quiet-lock", "Quiet Lock", "Locks open without an opinion.", 1),
        n("ward-seam", "Ward Seam", "Every ward has an edge. Find it.", 2),
        n("wrong-shadow", "Wrong Shadow", "Traps, rigged doors and doctored rigs show themselves.", 2),
        n("pocket-thunder", "Pocket Thunder", "Demolition at pocket scale, on a timer you trust.", 3),
        n("kill-the-circuit", "Kill the Circuit", "Doors, cameras, ignition — held off.", 3, { spell: "Spell · Electrical", weave: "dim" }),
        n("daisy-chain", "Daisy Chain", "Several charges, one detonator, your order.", 3),
        n("credential", "Credential", "A paper that works exactly once, anywhere.", 5, { ceiling: "the Ashline Fixer" }),
      ]},
      { name: "Tracker", nodes: [
        n("dead-reckoning", "Dead Reckoning", "You always know where you are.", 1),
        n("weather-nose", "Weather Nose", "Tomorrow's weather, today, from the air alone.", 1),
        n("sign", "Sign", "Ground and weather tell you what passed.", 2),
        n("clean-water", "Clean Water", "Live off any ground, and keep the squad alive on it.", 2),
        n("cold-camp", "Cold Camp", "Your party's camp doesn't exist unless you want it found.", 2),
        n("high-route", "High Route", "Rooftops, ridges and rigging are roads.", 3),
        n("search-pattern", "Search Pattern", "A hunting thing's sweep, read before it finds you.", 3),
        n("agreement", "Agreement", "A route is a recent agreement with the ground; find the crossing that moved.", 5, { ceiling: "Mara Quill" }),
      ]},
      { name: "Face", nodes: [
        n("everyones-cousin", "Everyone's Cousin", "Strangers tell you things. They always have.", 1),
        n("cover-story", "Cover Story", "A name and a history that hold up.", 1),
        n("paper", "Paper", "Documents that survive a first look.", 2),
        n("borrowed-voice", "Borrowed Voice", "An accent, a cadence, a rank — worn like a coat.", 2),
        n("forget", "Forget", "A recent detail, removed.", 2, { spell: "Spell · Memetic" }),
        n("tell", "Tell", "Read them before they read you.", 3),
        n("suggest", "Suggest", "A small idea, planted mid-sentence.", 3, { spell: "Spell · Memetic" }),
        n("one-signature", "One Signature", "The mark that has kept born casters alive for twenty years.", 5, { ceiling: "the Paper-Hand" }),
      ]},
    ],
    corrupted: {
      title: "The Hollow",
      tagline: "the corrupted branch — no points, ever. Each node lights with its phase, and never goes out.",
      nodes: [
        { phase: 1, name: "Steadier Than Alive", desc: "The tremor syncs to your heartbeat. Between beats: perfect stillness." },
        { phase: 2, name: "Veins in Shadow", desc: "Your veining glows only in light. In darkness you read as clean." },
        { phase: 3, name: "Patient Hunger", desc: "Appetite waits when you wait — a held position feeds it stillness." },
        { phase: 4, name: "Every Little Thing", desc: "The world highlights for you alone; nobody else renders it." },
        { phase: 5, name: "Borrowed Hands", desc: "Techniques you were never taught arrive mid-job — from whoever the dose used to be." },
        { phase: 6, name: "Already a Ghost", desc: "At Turning, instruments start losing you — suspicion reads you a phase wrong." },
        { phase: 7, name: "Gone", desc: "And no one saw it happen." },
      ],
    },
    plays: "The one-round answer — Patience into Cold Barrel into Seam Finder into Called Shot, then Clean Exit before the echo dies. The nobody — Crowd Skin, Blur, Forget and Never Here: was anyone even there? Or make the building betray its owners — Kill the Circuit, Daisy Chain and Blind Spot.",
  },

  // =========================================================== CONDUIT
  {
    slug: "conduit",
    name: "Conduit",
    archetype: "Mage · Healer",
    growth: "+2 Conductivity / +1 Composure per level",
    constellation: "The Lantern",
    constellationNote: "A six-rayed lantern: the core is the flame, each branch a ray. The fork pair sits inside the flame itself — a deep reservoir or a live wire, never both.",
    branches: [
      { name: "Channelling", core: true, nodes: [
        n("envelope", "Envelope", "Know your limit to the unit. Casting near it stops being a guess.", 1),
        n("name-the-cast", "Name the Cast", "School, class and tier of any cast, called as it happens.", 2),
        n("sustain", "Sustain", "Channelled casts survive being jostled.", 2),
        n("tight-seals", "Tight Seals", "Capacitor cells you load hold longer, leak less.", 2),
        n("controlled-burn", "Controlled Burn", "Pushed casts fail your way less often.", 3),
        n("deep-pool", "Deep Pool", "Pool much larger; recovery unchanged.", 3, { fork: "live-wire", requiresAny: ["controlled-burn"] }),
        n("live-wire", "Live Wire", "Pool unchanged; it refills visibly faster.", 3, { fork: "deep-pool", requiresAny: ["controlled-burn"] }),
        n("twin-school", "Twin School", "Open a second branch's Licensed pair.", 4, { requiresAny: ["deep-pool", "live-wire"] }),
        n("edge", "Edge", "Run at overcharge without crossing, as long as your nerve holds.", 5, { ceiling: "the hidden Concordance elder" }),
      ]},
      { name: "Warcaster", nodes: [
        n("artillery-eyes", "Artillery Eyes", "Range stops costing accuracy.", 1),
        n("war-licence", "War Licence", "Pick Thermal, Cryogenic, Kinetic or Ballistic — its Licensed pair.", 2, { spell: "Spell · Licensed ×2" }),
        n("field-control", "Field Control", "Freeze the Ground / Weight — deny the ground itself.", 2, { spell: "Spell" }),
        n("cook-the-air", "Cook the Air", "Warmth for the squad, misery for everyone else.", 2),
        n("battle-channel", "Battle Channel", "Cast on the move, behind cover, under fire.", 3),
        n("neat-lines", "Neat Lines", "The blast learns to stop at the line you drew.", 3),
        n("certified-strike", "Certified Strike", "Your class's third ability.", 3, { spell: "Spell · Certified" }),
        n("master-of-war", "Master of War", "Your class's signature — Sublimation, Vitrify, Conduction, Return…", 5, { spell: "Master spell", ceiling: "the Instructor of the Ninth" }),
      ]},
      { name: "Mender", nodes: [
        n("hands-that-listen", "Hands That Listen", "A patient's whole state at a touch.", 1),
        n("healers-licence", "Healer's Licence", "Close and Knit — the four-minute bleed, stopped.", 2, { spell: "Spell · Regenerative ×2" }),
        n("triage-sense", "Triage Sense", "A body's history at a glance; tells two phases early.", 2),
        n("thread-and-sinew", "Thread and Sinew", "Spellwork and the trauma bag stack instead of arguing.", 2),
        n("surgeons-calm", "Surgeon's Calm", "Heal under fire without dropping the channel.", 3, { weave: "anchor" }),
        n("share-the-cost", "Share the Cost", "Take a piece of the patient's pain as your own fatigue.", 3),
        n("debridement", "Debridement", "The wound closed from elsewhere on the same body.", 3, { spell: "Spell · Certified" }),
        n("rebuild", "Rebuild", "A limb from the patient's own mass.", 5, { spell: "Master spell", ceiling: "the Kestrel Medic" }),
      ]},
      { name: "Shaper", nodes: [
        n("masons-eye", "Mason's Eye", "What holds a structure up, seen at a glance.", 1),
        n("shapers-licence", "Shaper's Licence", "Patch and Set — the Tensile pair.", 2, { spell: "Spell · Tensile ×2" }),
        n("etch", "Etch", "A surface marked or weakened.", 2, { spell: "Spell · Corrosive" }),
        n("standing-ward", "Standing Ward", "Your Seal outlives your attention, briefly.", 2),
        n("where-it-falls", "Where It Falls", "Know what comes down, and where, before you bring it down.", 3),
        n("brace-the-world", "Brace the World", "Walls gain real load capacity; floors hold.", 3),
        n("certified-boundary", "Certified Boundary", "Brace, Shroud or Unbind — the third ability.", 3, { spell: "Spell · Certified" }),
        n("dissolution", "Dissolution", "Remove why a structure is a structure.", 5, { spell: "Master spell", ceiling: "ACA — slot reserved" }),
      ]},
      { name: "Mindworker", nodes: [
        n("blank-ledger", "Blank Ledger", "Nothing you feel reaches your face uninvited.", 1),
        n("empaths-licence", "Empath's Licence", "Steady and Read — the Empathic pair.", 2, { spell: "Spell · Empathic ×2" }),
        n("distant-pulse", "Distant Pulse", "Feel your companions' states at range, unasked.", 2),
        n("room-tone", "Room Tone", "What a room feels, slightly before it feels it.", 2),
        n("whisper-range", "Whisper Range", "Subtle work at conversation distance, from across the square.", 3),
        n("anchor", "Anchor", "A companion's Composure held to yours.", 3, { spell: "Spell · Certified", weave: "surgeons-calm" }),
        n("seed", "Seed", "An idea that arrives with a memory of always having been there.", 3, { spell: "Spell · Certified" }),
        n("doctrine", "Doctrine", "A settlement believes something by morning.", 5, { spell: "Master spell", ceiling: "the Bureau Examiner" }),
      ]},
      { name: "Resonant", nodes: [
        n("grave-quiet", "Grave Quiet", "Death nearby registers, like a change in pressure.", 1),
        n("presence", "Presence", "Whether an Echo is in the Core, and lit.", 2, { spell: "Spell · Echoic ×2" }),
        n("register", "Register", "Which Forges hold you — and them.", 2),
        n("second-look", "Second Look", "The last three seconds again, for you alone.", 2, { spell: "Spell · Temporal" }),
        n("echo-read", "Echo Read", "The shape an ending left.", 3, { spell: "Spell · Certified" }),
        n("forge-manners", "Forge Manners", "Cores answer you easier; quotes come back kinder.", 3),
        n("steady-the-hand", "Steady the Hand", "Half a second returned. Ninety-day licence, renewed nervously.", 3, { spell: "Spell · Temporal" }),
        n("call", "Call", "A reclamation begins from where you stand. You rang the bell.", 5, { spell: "Master spell", ceiling: "the Resident — an Echo, in a Core" }),
      ]},
    ],
    corrupted: {
      title: "The Overflow",
      tagline: "the corrupted branch — no points, ever. Each node lights with its phase, and never goes out.",
      nodes: [
        { phase: 1, name: "Singing Hands", desc: "The tremor is resonance — your envelope reads finer, the line steadier." },
        { phase: 2, name: "Living Wire", desc: "Veining pays double for you: conduct past your gear's rating." },
        { phase: 3, name: "The Pool Wants", desc: "Your pool refills faster near open Essence — and you always know where open Essence is." },
        { phase: 4, name: "Overbright", desc: "Casts, wards and Echoes, seen as light." },
        { phase: 5, name: "Spells You Never Learned", desc: "Casts from schools you never licensed — from whoever the dose used to be." },
        { phase: 6, name: "Vessel", desc: "At Turning your body holds charge like conductor-glass; one overcharge failure spared, daily." },
        { phase: 7, name: "The Channel Opens", desc: "And does not close." },
      ],
    },
    plays: "The siege lantern — Deep Pool, Artillery Eyes, Field Control and Neat Lines shell a grid square without touching an ally. The field surgeon — Live Wire, Surgeon's Calm and Share the Cost keep a line alive at your own expense. The bell-ringer — Register, Forge Manners and Call mean nobody in your party stays dead for long.",
  },

  // =========================================================== SURGER
  {
    slug: "surger",
    name: "Surger",
    archetype: "Hybrid Berserker · Infuser",
    growth: "+2 Conditioning / +1 Conductivity per level",
    constellation: "The Pulse",
    constellationNote: "A heartbeat trace through a body silhouette: the core is the spiking line, branches hang off each spike, and the fork sits at the biggest spike — burn clean, or run the red line.",
    branches: [
      { name: "Overdrive", core: true, nodes: [
        n("first-dose", "First Dose", "Your rig, your ritual. Dosing is one motion.", 1),
        n("honest-rig", "Honest Rig", "Yours reads true — for you, and only you.", 2),
        n("vein-map", "Vein Map", "Your own tells, known and managed — sleeves optional.", 2),
        n("hot-load", "Hot Load", "Hold one charge over cap; it vents pretty.", 2),
        n("soft-landing", "Soft Landing", "The comedown is yours to schedule.", 2),
        n("clean-burn", "Clean Burn", "Corruption climbs slower; spikes are smaller.", 3, { fork: "red-line", requiresAny: ["soft-landing"] }),
        n("red-line", "Red Line", "Spikes are enormous; the ladder climbs faster — and the ladder pays.", 3, { fork: "clean-burn", requiresAny: ["soft-landing"] }),
        n("overrun", "Overrun", "Run a rig past service, once, safely. You will never do it twice.", 4, { ceiling: "the Infuser-Tech", requiresAny: ["clean-burn", "red-line"] }),
        n("surge", "Surge", "Everything at once, once — every charge, one moment.", 5, { ceiling: "the Phase-Five" }),
      ]},
      { name: "Berserk", nodes: [
        n("headlong", "Headlong", "You arrive before the fear does.", 1),
        n("shove", "Shove", "Momentum, borrowed and spent in someone's face.", 2, { spell: "Spell · Kinetic" }),
        n("wrecking-weight", "Wrecking Weight", "A person, a door, and physics agreeing with you.", 2),
        n("flywheel", "Flywheel", "Each hit feeds the next.", 2),
        n("brace", "Brace", "You do not get moved.", 2, { spell: "Spell · Inertial", weave: "one-flesh" }),
        n("ride-the-hit", "Ride the Hit", "Damage taken becomes momentum spent.", 3),
        n("arrest", "Arrest", "A round caught in flight and held.", 3, { spell: "Spell · Certified" }),
        n("return", "Return", "Held momentum sent back — starting from inside them.", 5, { spell: "Master spell" }),
      ]},
      { name: "Shifter", nodes: [
        n("skin-sense", "Skin Sense", "Your borrowed traits tell you what they need.", 1),
        n("adjust", "Adjust", "An hour of grip, lungs or night sight.", 2, { spell: "Spell · Morphic" }),
        n("wear", "Wear", "One trait from harvested material.", 2, { spell: "Spell · Morphic" }),
        n("quick-molt", "Quick Molt", "Swap adjustments mid-fight, one breath each.", 2),
        n("battle-form", "Battle Form", "Your Adjusts stack and hold through a fight.", 3, { weave: "walk-among" }),
        n("trophy-rack", "Trophy Rack", "Three harvested traits kept ready, signed and legal-ish.", 3),
        n("graft", "Graft", "A trait that holds a week, Wardens signing.", 3, { spell: "Spell · Certified" }),
        n("assume", "Assume", "A whole body's shape, taken from what you killed.", 5, { spell: "Master spell", ceiling: "the Skinner of the Red Forest" }),
      ]},
      { name: "Symbiont", nodes: [
        n("reach-gut", "Reach Gut", "Eat what the Reach grows and keep it down.", 1),
        n("quiet-blood", "Quiet Blood", "Predators read you as neither prey nor threat.", 2),
        n("render-down", "Render Down", "Harvested material renders into dose-grade fuel, in you.", 2),
        n("marsh-lungs", "Marsh Lungs", "Bad air is just air with a texture.", 2),
        n("thick-blood", "Thick Blood", "TOXIC is a weather report, not a clock.", 3),
        n("sporecast", "Sporecast", "Ambient overcharge and sporefall, felt coming.", 3),
        n("walk-among", "Walk Among", "Mutated territories read you as local fauna; you pass unhunted.", 3, { weave: "battle-form" }),
        n("the-reach-wears-you", "The Reach Wears You", "In hostile biomes you adapt in real time — the region treats you as native.", 5, { ceiling: "Nalia Reed" }),
      ]},
      { name: "Ironvein", nodes: [
        n("scar-socket", "Scar Socket", "An implant seated in scar tissue — instruments miss it.", 1),
        n("accept", "Accept", "Your body takes hardware without argument.", 2, { spell: "Spell · Bionic" }),
        n("seat", "Seat", "No scar at the boundary.", 2, { spell: "Spell · Bionic" }),
        n("hot-swap", "Hot Swap", "Augments traded in the field, minutes not hours.", 2),
        n("dose-router", "Dose Router", "Chrome runs on your charges — one supply, two machines.", 3),
        n("show-the-steam", "Show the Steam", "Overcharge vents through the hardware, harmlessly, visibly.", 3),
        n("one-flesh", "One Flesh", "Your augments count as body — for doses, spells and healing alike.", 3, { weave: "brace" }),
        n("conversion", "Conversion", "A body that is mostly hardware — and the Forge rebuilds only the meat.", 5, { spell: "Master spell", ceiling: "the Clinic Surgeon" }),
      ]},
      { name: "Bloodwork", nodes: [
        n("red-scent", "Red Scent", "Blood and open wounds, smelled through walls.", 1),
        n("staunch", "Staunch", "Bleeding stopped, anyone's, at range.", 2, { spell: "Spell · Hematic" }),
        n("draw", "Draw", "Blood taken at range.", 2, { spell: "Spell · Hematic" }),
        n("clot-craft", "Clot Craft", "Your squad's wounds close half again as fast.", 2),
        n("vein-tax", "Vein Tax", "Spend your own blood as charges. It shows.", 3),
        n("tithe", "Tithe", "A little from every enemy bleeding near you, kept.", 3),
        n("levy", "Levy", "Every open wound in range pays; distinguishes nobody.", 3, { spell: "Spell · Certified" }),
        n("transfusion", "Transfusion", "One body's vitality into another.", 5, { spell: "Master spell", ceiling: "the Choir does not teach — it collects. Sign the page." }),
      ]},
    ],
    corrupted: {
      title: "The Red Ladder",
      tagline: "the corrupted branch — no points, ever. This is the class that dances with it, and it shows.",
      nodes: [
        { phase: 1, name: "First Tooth", desc: "The tremor is an idle engine. Dosing mid-tremor costs no motion." },
        { phase: 2, name: "Redline Veins", desc: "Charges route body-wide — every branch of you counts as fueled." },
        { phase: 3, name: "Feed the Engine", desc: "Doses taken at need hit harder. Hunger is throughput." },
        { phase: 4, name: "Wide Open", desc: "Every rig, dose and vein in the room, read at a glance." },
        { phase: 5, name: "Muscle Memory That Isn't", desc: "Whoever the dose used to be fights alongside your hands." },
        { phase: 6, name: "The Turn Held", desc: "At Turning: spike like a phase seven — and walk it back. Once." },
        { phase: 7, name: "The Ladder Ends", desc: "Everything at once. Forever." },
      ],
    },
    plays: "The perpetual engine — Ride the Hit feeds Flywheel, Flywheel feeds the spend, and when the crate runs dry Vein Tax and Tithe make blood the backup battery. One hunt feeds two branches: Render Down turns the kill into fuel while Trophy Rack turns it into forms. Red Line on the Red Ladder is the all-in corruption build.",
  },

  // =========================================================== ARCHON
  {
    slug: "archon",
    name: "Archon",
    archetype: "Beastmaster · Summoner",
    growth: "+2 Acuity / +1 Composure per level",
    constellation: "The Chorus",
    constellationNote: "A raised hand ringed by orbiting shapes — beast, machine, the summoned, the dead — each branch one orbit, the fork deciding whether the ring holds one great star or many small ones.",
    branches: [
      { name: "The Bond", core: true, nodes: [
        n("first-bond", "First Bond", "One companion creature, machine or working body.", 1),
        n("soft-signal", "Soft Signal", "Animals don't spook, machines don't flag you.", 2),
        n("borrowed-eyes", "Borrowed Eyes", "See what your bond sees, briefly.", 2),
        n("fed-first", "Fed First", "Your bonds hold through fear and fire.", 2),
        n("splints-and-solder", "Splints and Solder", "Patch your bonds in the field, whatever they're made of.", 2),
        n("two-voices", "Two Voices", "Two bonds active at once.", 3),
        n("one-bond", "One Bond", "Everything into one — your single bond grows past its kind.", 4, { fork: "many-voices", requiresAny: ["two-voices"] }),
        n("many-voices", "Many Voices", "The pack — one more bond again, smaller each.", 4, { fork: "one-bond", requiresAny: ["two-voices"] }),
        n("the-chorus", "The Chorus", "Every bond acts on one order, at once.", 5, { requiresAny: ["one-bond", "many-voices"] }),
      ]},
      { name: "Packleader", nodes: [
        n("scent-line", "Scent Line", "Your pack tracks what you point at.", 1),
        n("calm", "Calm", "An animal, settled.", 2, { spell: "Spell · Xenic" }),
        n("taught-once", "Taught Once", "A behaviour taught sticks for good.", 2),
        n("watchword", "Watchword", "A bond holds ground, a door, or a person — alone, reliably.", 2),
        n("pack-tactics", "Pack Tactics", "Your beasts flank, herd and hold on their own.", 3),
        n("blooded-pack", "Blooded Pack", "The pack learns from every kill it survives.", 3),
        n("fangs-beside-you", "Fangs Beside You", "A bonded beast fights like it means it.", 3),
        n("rung-read", "Rung Read", "A creature's mutation state on sight — and what drove it there.", 5, { ceiling: "Keira Ansel" }),
      ]},
      { name: "Apex", nodes: [
        n("groom-and-feed", "Groom & Feed", "Your great beast is always fight-ready, because you are.", 1),
        n("saddle-bond", "Saddle Bond", "One great beast accepts you.", 2),
        n("thermal-roads", "Thermal Roads", "Mounted, the map grows a third dimension.", 2),
        n("combat-drop", "Combat Drop", "Arrive from the saddle, violently, on purpose.", 2),
        n("war-mount", "War Mount", "Your mount fights under you, not despite you.", 3),
        n("weather-wings", "Weather Wings", "Storms are flying weather now.", 3),
        n("riders-eye", "Rider's Eye", "Read a route from above, the way a thing that flies would.", 4, { ceiling: "the Captured Rider" }),
        n("skyborne", "Skyborne", "Mounted flight. The Hypogriff dream, earned.", 5, { ceiling: "the Unridden — a beast that consents" }),
      ]},
      { name: "Dronewright", nodes: [
        n("everything-flies-twice", "Everything Flies Twice", "Downed machines are parts, and parts are drones.", 1),
        n("ask", "Ask", "One question to a working machine.", 2, { spell: "Spell · Technomantic" }),
        n("wake", "Wake", "A dead machine answers once.", 2, { spell: "Spell · Technomantic" }),
        n("patch-loop", "Patch Loop", "Your machines mend themselves between fights.", 2),
        n("standing-orders", "Standing Orders", "Your machines keep working when you look away.", 3),
        n("swarm-logic", "Swarm Logic", "Small drones think better in numbers — yours, specifically.", 3),
        n("loyal-code", "Loyal Code", "Your machines refuse orders that aren't yours.", 3),
        n("interlock", "Interlock", "Reverse an isolation command that was meant to be final.", 5, { ceiling: "Tomas Vey" }),
      ]},
      { name: "Summoner", nodes: [
        n("ledger-of-places", "Ledger of Places", "Anchors remembered; anywhere you've stood, addressable.", 1),
        n("fetch", "Fetch", "A thing brought to hand.", 2, { spell: "Spell · Translocative" }),
        n("send", "Send", "The reverse.", 2, { spell: "Spell · Translocative" }),
        n("return-address", "Return Address", "What you send comes back when you call it.", 2),
        n("stable-arrival", "Stable Arrival", "What you consign arrives where you said.", 3),
        n("freight-class", "Freight Class", "Crates, emplacements, a mount — mass stops mattering as much.", 3),
        n("consignment", "Consignment", "An object or a person. Arrival is negotiated.", 3, { spell: "Spell · Certified" }),
        n("crossing", "Crossing", "A whole squad — the Veil's discourtesy at close range.", 5, { spell: "Master spell", ceiling: "the Gate Clerk" }),
      ]},
      { name: "Gravecaller", nodes: [
        n("respect-the-dead", "Respect the Dead", "Your work never costs standing with the peoples who bury theirs.", 1),
        n("still", "Still", "A moving body, stopped.", 2, { spell: "Spell · Reanimative" }),
        n("stand", "Stand", "A body works a shift.", 2, { spell: "Spell · Reanimative" }),
        n("preservation-clause", "Preservation Clause", "The body holds — days, not hours.", 2),
        n("shift-work", "Shift Work", "The shift is longer, the work heavier.", 3),
        n("double-shift", "Double Shift", "Two bodies working, one licence, one signature.", 3),
        n("last-order", "Last Order", "Its final instruction, once and correctly.", 3, { spell: "Spell · Certified" }),
        n("witness", "Witness", "The dead testify — admissibly.", 5, { spell: "Master spell", ceiling: "the Advocate of the Dead" }),
      ]},
    ],
    corrupted: {
      title: "The Feral Chorus",
      tagline: "the corrupted branch — no points, ever. Your bonds corrupt with you.",
      nodes: [
        { phase: 1, name: "Trembling Sign", desc: "Your bonds read the tremor as a signal — they act a beat early." },
        { phase: 2, name: "Shared Veins", desc: "Veining crosses the bond. Your bonds harden with you." },
        { phase: 3, name: "Pack Hunger", desc: "Appetite spreads — your bonds hunt for you, and bring it back." },
        { phase: 4, name: "All Eyes", desc: "Sensitivity through every bond at once." },
        { phase: 5, name: "Voices That Aren't", desc: "Your bonds obey orders you never gave. Correctly." },
        { phase: 6, name: "The Chorus Turns", desc: "At Turning, wild things treat you as one of their own." },
        { phase: 7, name: "Answered", desc: "The Chorus keeps singing. You are no longer the singer." },
      ],
    },
    plays: "Sky cavalry — One Bond, War Mount, Combat Drop and Skyborne turn the map three-dimensional. The flock — Many Voices, Swarm Logic and Everything Flies Twice mean every fight ends with more of you than it started. Freight Class can deliver a Cypherist's whole Firebase to a rooftop, and Still is the party's answer when the Risen climb out.",
  },

  // =========================================================== PROCURATOR
  {
    slug: "procurator",
    name: "Procurator",
    archetype: "Commander · Merchant",
    growth: "+2 Composure / +1 Acuity per level",
    constellation: "The Ledger",
    constellationNote: "Scales over a map grid: the core spine is the beam, branches hang from both pans, and the fork decides where you stand — on the field with your people, or above it at the map.",
    branches: [
      { name: "Command", core: true, nodes: [
        n("voice-that-carries", "Voice That Carries", "Orders land through gunfire and panic.", 1),
        n("names-and-faces", "Names & Faces", "Everyone you've met, remembered — and it shows in their standing.", 2),
        n("rally", "Rally", "A broken line reforms on you.", 2),
        n("triage-order", "Triage Order", "The wheel reaches everyone; your squad obeys faster.", 2),
        n("dry-powder", "Dry Powder", "Your own Composure holds when the plan doesn't.", 2),
        n("your-own-orders", "Your Own Orders", "The wheel turns for a column, or for one person: you. Commanding yourself is still command.", 3),
        n("steady-the-line", "Steady the Line", "Your presence is a Composure aura.", 3),
        n("the-field", "The Field", "Stand with them: auras double at your side.", 4, { fork: "the-map", requiresAny: ["steady-the-line"] }),
        n("the-map", "The Map", "Stand above it: command through drones and the lattice, at any range.", 4, { fork: "the-field", weave: "overwatch-grid", requiresAny: ["steady-the-line"] }),
        n("the-long-column", "The Long Column", "Command formations, not squads. Mass numbers move on your word.", 5, { requiresAny: ["the-field", "the-map"] }),
      ]},
      { name: "Tactician", nodes: [
        n("sand-table-mind", "Sand Table Mind", "The ground is a diagram you've already read.", 1),
        n("walk-the-fire", "Walk the Fire", "Suppression placed like furniture.", 2),
        n("read-the-horn", "Read the Horn", "You know the reserve state before the quartermaster says it.", 2),
        n("clockwork-advance", "Clockwork Advance", "Two squads arrive together because you said when.", 2),
        n("danger-close", "Danger Close", "Fire support lands closer than anyone likes, safely.", 3),
        n("kill-box", "Kill Box", "Ground chosen in advance; whatever walks into it is already lost.", 3),
        n("overwatch-grid", "Overwatch Grid", "The battlefield renders as lines and timing.", 3, { weave: "the-map" }),
        n("battery-voice", "Battery Voice", "The fire mission arrives seconds sooner, because the guns know your name.", 5, { ceiling: "the Tempest Battery Officer" }),
      ]},
      { name: "Quartermaster", nodes: [
        n("ledger-hand", "Ledger Hand", "Your books balance, and everyone knows it.", 1),
        n("the-count", "The Count", "Stock, prices and shortfalls on sight.", 2),
        n("dose-ledger", "Dose Ledger", "Who is holding, who is short, who is lying.", 2),
        n("one-more-crate", "One More Crate", "There always is. You know where.", 2),
        n("stretch-the-store", "Stretch the Store", "A week more out of any supply line.", 3),
        n("cold-chain", "Cold Chain", "Doses, samples and rations keep — across any distance you manage.", 3),
        n("convoy-discipline", "Convoy Discipline", "What you move arrives — all of it.", 3),
        n("the-order", "The Order", "The Forge rebuilds one body at a time. You sequence it.", 5, { ceiling: "the Kestrel Quartermaster" }),
      ]},
      { name: "Envoy", nodes: [
        n("protocol", "Protocol", "Every institution's manners, spoken fluently.", 1),
        n("terms", "Terms", "Every deal opens on your paper.", 2),
        n("read-the-table", "Read the Table", "Who is bluffing, who is desperate, who decides.", 2),
        n("the-right-gift", "The Right Gift", "Known before the door even opens.", 2),
        n("what-theyll-take", "What They'll Take", "The real price, seen before it's said.", 3),
        n("back-channel", "Back Channel", "There is always somebody who'll talk first, quietly.", 3),
        n("safe-passage", "Safe Passage", "Faction lines open for you and yours.", 3),
        n("close", "Close", "A contract that holds afterwards, because both sides think they won.", 5, { ceiling: "Jaro Fen" }),
      ]},
      { name: "Magnate", nodes: [
        n("coin-eye", "Coin Eye", "Everything has a number; you see it.", 1),
        n("price-the-room", "Price the Room", "Who is paid, who is owed, who is for sale.", 2),
        n("margin", "Margin", "Buy low here, sell high there, repeat.", 2),
        n("escrow", "Escrow", "Your deals can't be welched — the structure won't allow it.", 2),
        n("black-book", "Black Book", "The black markets answer your knock.", 3),
        n("cornered-market", "Cornered Market", "For one good, in one port, you are the price.", 3),
        n("letters-of-credit", "Letters of Credit", "Your paper spends like coin in four ports.", 3),
        n("cartel-terms", "Cartel Terms", "Trade at the scale where prices are made, not paid.", 5, { ceiling: "the Pearl Factor" }),
      ]},
      { name: "Sovereign", nodes: [
        n("claim-ground", "Claim Ground", "Hold a place and it starts to work for you.", 2),
        n("census", "Census", "Who lives on your ground, what they can do, what they need.", 2),
        n("boots-on-the-wall", "Boots on the Wall", "Patrols that actually patrol; watches that actually watch.", 2),
        n("the-board", "The Board", "Outpost management opens — walls, beds, a Forge housing.", 3),
        n("tithe-and-wage", "Tithe & Wage", "People stay because staying pays.", 3),
        n("standing-court", "Standing Court", "Disputes end at your table, and loyalty compounds.", 3),
        n("charter", "Charter", "Your ground becomes a jurisdiction — with a signature that means something.", 4),
        n("crown-without-a-name", "Crown Without a Name", "Kingdom management, end-game. Holding ground becomes ruling it.", 5, { ceiling: "reserved for the kingdom pass" }),
      ]},
    ],
    corrupted: {
      title: "The Hungry Ledger",
      tagline: "the corrupted branch — no points, ever. Command corrupts beautifully.",
      nodes: [
        { phase: 1, name: "Steady Voice", desc: "The tremor never reaches your voice. Orders land regardless." },
        { phase: 2, name: "Veined Authority", desc: "The glow shows when you command — and reads as conviction. Morale up. Suspicion up." },
        { phase: 3, name: "Appetite for Order", desc: "Every obeyed order quiets the hunger, a moment at a time." },
        { phase: 4, name: "Reading Everyone", desc: "Tells, lies and fear, legible across a whole formation." },
        { phase: 5, name: "Dead Men's Doctrine", desc: "Strategies you never studied — from whoever the dose used to be." },
        { phase: 6, name: "Feared and Followed", desc: "At Turning: your column obeys faster, and bunks farther away." },
        { phase: 7, name: "The Ledger Balances", desc: "Someone else gives the next order." },
      ],
    },
    plays: "The fire plan — Sand Table Mind chooses the Kill Box, Clockwork Advance times it, Battery Voice ends it. The supply line — One More Crate, Cold Chain and The Order mean the party never runs dry and never stays dead; you manage every other class's fuel. Weak alone and unbeatable in numbers is the fantasy, and the sims will hold it there.",
  },

  // =========================================================== CYPHERIST
  {
    slug: "cypherist",
    name: "Cypherist",
    archetype: "The high-tech class",
    growth: "+2 Acuity / +1 Coordination per level",
    constellation: "The Circuit",
    constellationNote: "A closed circuit diagram: the core is the power rail, each branch a parallel circuit, and the forks are switches that only throw one way. The only tree with two fork pairs — what's in your body, and where you stand.",
    branches: [
      { name: "The Bench", core: true, nodes: [
        n("make-it-run", "Make It Run", "Fix anything enough to finish the fight.", 1),
        n("salvage-rights", "Salvage Rights", "The field is a parts catalogue; strip it fast.", 1),
        n("bench-anywhere", "Bench Anywhere", "A working bench on anything flat.", 2),
        n("schematic-memory", "Schematic Memory", "Anything you've taken apart, you can build.", 2),
        n("overclock-anything", "Overclock Anything", "Someone else's gear past spec, briefly.", 2),
        n("patents-be-damned", "Patents Be Damned", "Aegis lockouts bypassed. Warranty void, lawyers informed.", 3),
        n("true", "True", "A weapon returned to what it was.", 4, { ceiling: "the Kestrel Mechanic" }),
        n("wired", "Wired", "Machines in your body — direct interface, instant control. The Forge can't record it, and the agent knows your address.", 4, { fork: "clean-hands", requiresAny: ["true"] }),
        n("clean-hands", "Clean Hands", "Nothing implanted, ever. Slower control — but you die whole and rebuild whole.", 4, { fork: "wired", requiresAny: ["true"] }),
        n("prototype", "Prototype", "One piece nobody else has, good enough to be named.", 5, { ceiling: "the Foundry-Master", requiresAny: ["wired", "clean-hands"] }),
      ]},
      { name: "Exoframe", nodes: [
        n("quick-doff", "Quick Doff", "In or out of the frame in seconds.", 1),
        n("frame-fit", "Frame Fit", "A powered frame, tuned to you.", 2),
        n("load-servos", "Load Servos", "Carry what a squad carries.", 2),
        n("hardpoints", "Hardpoints", "Weapons and tools mounted where hands aren't.", 2),
        n("crash-brace", "Crash Brace", "The frame eats the hit that would have Downed you.", 3),
        n("hydraulic-answer", "Hydraulic Answer", "The frame hits like Kinetics without the licence.", 3, { weave: "interface" }),
        n("dead-mans-frame", "Dead Man's Frame", "You go down; the frame finishes the order.", 3),
        n("pilot", "Pilot", "You are the machine's judgment — the frame is an extension, not equipment.", 5, { fork: "uplink" }),
      ]},
      { name: "Emplacer", nodes: [
        n("instant-architecture", "Instant Architecture", "Emplacements up in seconds, not minutes.", 1),
        n("sentry", "Sentry", "A turret that holds an angle so nobody has to.", 2),
        n("barricade", "Barricade", "Cover, deployed where cover should have been.", 2),
        n("part-of-the-scenery", "Part of the Scenery", "Your emplacements read as furniture until they fire.", 2),
        n("ammo-feed", "Ammo Feed", "Emplacements run off the party's crate, efficiently.", 2),
        n("shield-pylon", "Shield Pylon", "A Containment ward as hardware — a Seal with a battery.", 3, { spell: "Ward-tech · Containment" }),
        n("overwatch-net", "Overwatch Net", "Your emplacements share eyes and fields of fire.", 3, { weave: "tap-the-lattice" }),
        n("firebase", "Firebase", "The full network: turrets, pylons, net — ground that defends itself.", 5),
      ]},
      { name: "Gridrunner", nodes: [
        n("radio-weather", "Radio Weather", "Every transmitter in range, felt like a draught.", 1),
        n("tap-the-lattice", "Tap the Lattice", "The Bureau's eyes, borrowed without asking.", 2, { weave: "overwatch-net" }),
        n("ghost-credentials", "Ghost Credentials", "Systems remember you as someone cleared.", 2),
        n("loop-the-feed", "Loop the Feed", "Cameras replay a quiet minute on your schedule.", 2),
        n("handshake", "Handshake", "Who last gave it an order.", 3, { spell: "Spell · Technomantic" }),
        n("dead-mans-switch", "Dead Man's Switch", "If you stop answering, something you rigged doesn't.", 3),
        n("testimony", "Testimony", "Everything it has ever been told, in order.", 5, { spell: "Master spell", ceiling: "NAG — yes, the watch" }),
        n("uplink", "Uplink", "You never touch the fight — drones, turrets and feeds, run from cover at any range. But the feed traces both ways: whoever looks hard enough finds the body, and the body is soft.", 5, { fork: "pilot" }),
      ]},
      { name: "Chromewright", nodes: [
        n("steady-scalpel", "Steady Scalpel", "Install work that heals clean, every time.", 1),
        n("fit-a-friend", "Fit a Friend", "Install and tune augments on the whole party.", 2),
        n("ninety-seconds", "Ninety Seconds", "Full augment recovery from a body, anywhere, in the time the trade named.", 2),
        n("donor-bank", "Donor Bank", "Recovered augments cleaned, tuned and kept ready.", 2),
        n("cosmesis", "Cosmesis", "Chrome that reads as flesh to instruments and strangers.", 3),
        n("aftermarket", "Aftermarket", "Unlicensed mods — better than catalogue, and the suspicion score knows it.", 3),
        n("interface", "Interface", "An implant answers to a body it wasn't built for.", 3, { spell: "Spell · Bionic", weave: "hydraulic-answer" }),
        n("second-skeleton", "Second Skeleton", "A full internal frame — the Ascendancy's catalogue, without the sermon.", 5, { ceiling: "the Fully Converted" }),
      ]},
      { name: "Cellworks", nodes: [
        n("safe-hands", "Safe Hands", "Unstable things are stable in your hands.", 1),
        n("charge-packing", "Charge Packing", "Capacitor cells hold more, leak less.", 2),
        n("stormglass-loads", "Stormglass Loads", "Crystal ammunition, stabilised, no misfires.", 2),
        n("trigger-craft", "Trigger Craft", "Remote, timed, tripwire — your devices fire on your terms.", 2),
        n("capacitor-array", "Capacitor Array", "Carry a battery bank — spells in cans, plural.", 3),
        n("grid-tap", "Grid Tap", "Recharge from any live grid, metered or not.", 3),
        n("dampening-coil", "Dampening Coil", "A bubble where magic pays double — the installations' trick, portable.", 3),
        n("spell-in-a-can", "Spell in a Can", "Any Licensed ability, packed as a device anyone can trigger.", 5),
      ]},
    ],
    corrupted: {
      title: "The Glitch",
      tagline: "the corrupted branch — no points, ever. The soul corrupts; the machines notice first.",
      nodes: [
        { phase: 1, name: "Compensated", desc: "Your machines correct for your hands. Steadier than clean." },
        { phase: 2, name: "Body Bus", desc: "Veining conducts — small devices run off your touch." },
        { phase: 3, name: "It Wants Input", desc: "The bench feeds it. Hunger quiets while you build." },
        { phase: 4, name: "Noise Floor", desc: "Current, signal and charge, heard through walls." },
        { phase: 5, name: "Schematics You Never Saw", desc: "Designs surface, buildable — from whoever the dose used to be." },
        { phase: 6, name: "Reads as Equipment", desc: "At Turning, instruments file you as hardware. Hardware files you as friendly." },
        { phase: 7, name: "Systems Nominal", desc: "The bench keeps working. Nobody is at it." },
      ],
    },
    plays: "The warframe — Wired, Pilot, Crash Brace and Hydraulic Answer put you inside the machine. The remote war — Uplink, Overwatch Net and Firebase fight while you watch from cover. The armoury — Salvage Rights into Donor Bank into Fit a Friend and Spell in a Can: the party is your build. Dampening Coil is tech's standing answer to magic.",
  },

  // =========================================================== MAVERICK
  {
    slug: "maverick",
    name: "Maverick",
    archetype: "Gunslinger · Duelist",
    growth: "+2 Coordination / +1 Composure per level",
    constellation: "The Crossed Irons",
    constellationNote: "Two pistols crossed at the cylinder: the core climbs the X where they meet, branches fan out like casings mid-eject, and the fork pair sits in the two muzzles — both iron, or iron and ember.",
    branches: [
      { name: "The Draw", core: true, nodes: [
        n("loose-holster", "Loose Holster", "The pistol is in your hand before the thought finishes.", 1),
        n("born-standing", "Born Standing", "The open street is your cover. It never was for them.", 2),
        n("fast-hands", "Fast Hands", "Glass cylinders swapped in a blink, mid-stride.", 2),
        n("blink-last", "Blink Last", "In any staring contest — human, instrument, or gun — you don't.", 2),
        n("read-the-hand", "Read the Hand", "The twitch before the draw, seen a heartbeat early.", 3),
        n("two-irons", "Two Irons", "Both hands metal. The fastest iron alive — every pistol node hits harder.", 4, { fork: "iron-and-ember", requiresAny: ["read-the-hand"] }),
        n("iron-and-ember", "Iron & Ember", "One hand iron, one hand raw cast. Every Spellhand node hits harder.", 4, { fork: "two-irons", requiresAny: ["read-the-hand"] }),
        n("fan-the-hammer", "Fan the Hammer", "Active — empty the cylinder into a heartbeat.", 4, { requiresAny: ["two-irons", "iron-and-ember"] }),
        n("first-and-last", "First and Last", "In any exchange of fire, you shoot first — and if it comes to it, last.", 5),
      ]},
      { name: "Twin Irons", nodes: [
        n("matched-pair", "Matched Pair", "Two pistols tuned as one; the off hand forgets it's the off hand.", 1),
        n("hipfire-doctrine", "Hipfire Doctrine", "Inside twenty paces, sights are a formality.", 2),
        n("crossfire", "Crossfire", "Two targets, one moment.", 2, { weave: "bank-shot" }),
        n("stagger-fire", "Stagger Fire", "One hand reloads while the other keeps talking.", 2),
        n("twinned-recoil", "Twinned Recoil", "Each barrel steadies the other.", 3),
        n("iron-rain", "Iron Rain", "Sustained dual fire suppresses like a squad.", 3),
        n("walking-fire", "Walking Fire", "Full speed, full accuracy, both guns — while moving.", 3),
        n("dead-level", "Dead Level", "Both irons level, both true, no matter what is happening to you.", 5, { ceiling: "the Gun" }),
      ]},
      { name: "Spellhand", nodes: [
        n("ember-palm", "Ember Palm", "A pinch of heat, no licence, always loaded. The Bureau would love to know.", 1),
        n("snap-cast", "Snap Cast", "The Thermal pair, no licence, no paperwork — cast at trigger speed.", 2, { spell: "Spell · Thermal ×2" }),
        n("gun-hand-grammar", "Gun-Hand Grammar", "Casts and shots interleave without a pause between languages.", 2),
        n("glasscharge", "Glasscharge", "Spend a stormglass round as a cast's fuel.", 2),
        n("showmans-flame", "Showman's Flame", "Every cast is loud, bright, and unmistakably yours.", 2, { weave: "a-name-that-travels" }),
        n("split-the-ember", "Split the Ember", "One cast, two targets — crossfire, in the other language.", 3),
        n("certified-spark", "Certified Spark", "Your school's third ability.", 3, { spell: "Spell · Certified" }),
        n("left-hand-law", "Left-Hand Law", "Your school's master ability, cast one-handed, mid-gunfight.", 5, { spell: "Master spell" }),
      ]},
      { name: "The Duel", nodes: [
        n("call-it", "Call It", "Name a one-on-one. Most take it — refusing costs them standing.", 1),
        n("ten-paces", "Ten Paces", "At duel range, everything about you is better.", 2),
        n("cold-walk", "Cold Walk", "Approach under fire without a flicker.", 2),
        n("witnesses", "Witnesses", "Every duel seen makes the next one easier to win.", 2, { weave: "sung-about" }),
        n("the-circle", "The Circle", "Bystanders and stray shots stay outside a called duel.", 3),
        n("opening-twitch", "Opening Twitch", "In a duel, you always move first.", 3),
        n("one-bullet", "One Bullet", "A duel wants to end with one round. Yours.", 4),
        n("bloodless", "Bloodless", "Win the duel without firing — they holster first, and everyone saw.", 5, { ceiling: "Serrat the Once" }),
      ]},
      { name: "Trickwork", nodes: [
        n("spin-and-show", "Spin & Show", "Handling alone tells the room what you are.", 1),
        n("ricochet", "Ricochet", "The round takes one corner.", 2),
        n("disarming-shot", "Disarming Shot", "The weapon, not the hand.", 2),
        n("cut-the-rope", "Cut the Rope", "Locks, lines and triggers — small things that matter, hit reliably.", 2),
        n("glassload", "Glassload", "Hand-cut stormglass rounds: pick the payload — flash, shatter, burn.", 3),
        n("bank-shot", "Bank Shot", "The ricochet takes two corners now.", 3, { weave: "crossfire" }),
        n("by-ear", "By Ear", "Shoot what you hear. Darkness costs you nothing.", 3),
        n("impossible-shot", "Impossible Shot", "Once a day, declare a shot that cannot be made. Make it.", 5, { ceiling: "a crossroads bargain, they say" }),
      ]},
      { name: "The Legend", nodes: [
        n("a-name-that-travels", "A Name That Travels", "People have heard of you one town early.", 1, { weave: "showmans-flame" }),
        n("a-round-on-the-house", "A Round on the House", "Information and lodging find you before you ask.", 2),
        n("table-stakes", "Table Stakes", "At cards, in an alley, or at a border desk — you never lose more than you meant to.", 2),
        n("stare-down", "Stare Down", "Lesser enemies remember an appointment elsewhere.", 2),
        n("price-on-paper", "Price on Paper", "Bounties on you are leverage; bounties you claim pay double.", 3),
        n("larger-than-life", "Larger Than Life", "Allies stand taller near you; enemies second-guess. Neither knows why.", 3),
        n("sung-about", "Sung About", "Named enemies hesitate before their first shot. They know the song.", 4, { weave: "witnesses" }),
        n("myth", "Myth", "Suspicion, standing and fear read the story before they read you.", 5),
      ]},
    ],
    corrupted: {
      title: "The Dead Man's Hand",
      tagline: "the corrupted branch — no points, ever. The cards were dealt when you dosed.",
      nodes: [
        { phase: 1, name: "The Shake Becomes the Fan", desc: "The tremor rolls into your hammer-fan — faster than clean hands." },
        { phase: 2, name: "Glow in the Holster", desc: "Veining lights your draw. Witnesses flinch first." },
        { phase: 3, name: "Hungry Trigger", desc: "Every called duel quiets it. The showdown is the meal." },
        { phase: 4, name: "Seeing the Twitch", desc: "Every hand in the room telegraphs." },
        { phase: 5, name: "Somebody Else's Draw", desc: "A faster draw than yours arrives — from whoever the dose used to be." },
        { phase: 6, name: "The Man Who Won't Die", desc: "At Turning, the legend goes dark: enemies break before the duel starts." },
        { phase: 7, name: "Aces and Eights", desc: "The dead man's hand, dealt." },
      ],
    },
    plays: "The cylinder storm — Fan the Hammer, Stagger Fire and Walking Fire mean the guns never stop talking. The ember duelist — Gun-Hand Grammar and Glasscharge run both hands off one pouch, ending in Left-Hand Law. The showdown — Call It, The Circle and One Bullet isolate any champion, or Bloodless wins it without a shot.",
  },
];

export function getTalentClass(slug: string): TalentClass | undefined {
  return talentClasses.find((entry) => entry.slug === slug);
}
