/**
 * The Classes shelf's design layer: what the trees don't say about a class —
 * its pitch, how it holds a weapon, and its signature builds — curated here
 * the way lib/professions.ts holds the trades. Node data, costs, chips and
 * mechanic lines come from lib/talent-trees.ts and lib/talent-effects.ts;
 * nothing here duplicates them. Pending codex integration as class dossiers.
 */

/** The eight weapon families, in the Kit dossier's own order. */
export const weaponFamilies = [
  "Rifle", "Suppressed carbine", "Marksman rifle", "Shotgun", "Sidearm", "Crew-served", "Blade", "Thrown",
] as const;
export type WeaponFamily = (typeof weaponFamilies)[number];

/** 3 primary · 2 strong · 1 serviceable · 0 rarely, if ever. */
export type Affinity = 0 | 1 | 2 | 3;
export const affinityLabel: Record<Affinity, string> = { 3: "Primary", 2: "Strong", 1: "Serviceable", 0: "Rare" };

export type SignatureBuild = { name: string; line: string };

export type ClassDossier = {
  slug: string;
  /** The one-line hook under the name on the shelf. */
  hook: string;
  /** Two or three sentences: who this is on the ground. */
  pitch: string;
  /** What the class fights with, and how. */
  weaponNote: string;
  weapons: Record<WeaponFamily, Affinity>;
  builds: SignatureBuild[];
  /** The people who open the class's ceilings, as canon writes them. */
  teachersNote: string;
};

const w = (r: number, sc: number, m: number, sh: number, sd: number, cs: number, b: number, t: number): Record<WeaponFamily, Affinity> => ({
  "Rifle": r as Affinity, "Suppressed carbine": sc as Affinity, "Marksman rifle": m as Affinity, "Shotgun": sh as Affinity,
  "Sidearm": sd as Affinity, "Crew-served": cs as Affinity, "Blade": b as Affinity, "Thrown": t as Affinity,
});

export const classDossiers: Record<string, ClassDossier> = {
  bastion: {
    slug: "bastion",
    hook: "The wall that answers back.",
    pitch: "The Bastion is the soldier every line is built around: plates, a shotgun, and the stubbornness to stand in a doorway until the doorway agrees. Where a Bastion digs in, the fight has a shape; where one breaches, the room ends in three seconds. Its wards make either build walk — the squad moves inside the Seal.",
    weaponNote: "Shotgun for doors and what is behind them; a rifle for everything the door was hiding. Breach charges are the Bastion's thrown weapon, and a walking Bastion frame counts as cover for everyone behind it.",
    weapons: w(2, 0, 0, 3, 1, 1, 1, 2),
    builds: [
      { name: "Plant and protect", line: "Dig In, Look At Me and Immovable make a fortress the enemy has to answer while Hold the Line keeps everyone behind you alive." },
      { name: "Breach", line: "Doorway into Rolling Breach into Three Seconds clears a building room by room." },
      { name: "The walking ward", line: "The Aegis line makes either build mobile: the ward walks, and the squad walks inside it." },
    ],
    teachersNote: "Commander Rook holds the line's ceiling; the Blast Foreman signs the collapse; the Cordon Captain teaches Muzzle — a seat still reserved.",
  },
  spector: {
    slug: "spector",
    hook: "Was anyone even there?",
    pitch: "The Spector is patience with a rifle: one round, one answer, and gone before the echo. Or nobody at all — a face the crowd forgets and a building that betrays its own owners. The Long Eye is the class that ends fights before the other side knows one has started.",
    weaponNote: "A marksman rifle and a suppressed carbine are the two halves of the argument; the blade is for the moments a shot would be a confession. Nothing crew-served — nothing that needs a second person to carry the noise.",
    weapons: w(1, 3, 3, 0, 1, 0, 2, 1),
    builds: [
      { name: "The one-round answer", line: "Patience into Cold Barrel into Seam Finder into Called Shot, then Clean Exit before the echo dies." },
      { name: "The nobody", line: "Crowd Skin, Blur, Forget and Never Here: was anyone even there?" },
      { name: "The building betrays", line: "Kill the Circuit, Daisy Chain and Blind Spot turn a place against the people who own it." },
    ],
    teachersNote: "The Range Instructor and the Bureau Analyst hold the eye's ceilings; the Ashline Fixer teaches the circuit.",
  },
  conduit: {
    slug: "conduit",
    hook: "The lantern in the siege.",
    pitch: "The Conduit is the pure caster — a deep pool, a steady hand, and the only class that speaks freely across every school. It shells a grid square without touching an ally, keeps a line alive at its own expense, and rings the bell that brings the party back from the Forge. The Lantern is both the artillery and the surgeon.",
    weaponNote: "The pool is the weapon and the rig or the bag is the magazine. A sidearm is the last thing a caster reaches for when the reserve is dark — and the Conduit keeps one for exactly that hour.",
    weapons: w(1, 0, 0, 0, 2, 0, 0, 0),
    builds: [
      { name: "The siege lantern", line: "Deep Pool, Artillery Eyes, Field Control and Neat Lines shell a grid square without touching an ally." },
      { name: "The field surgeon", line: "Live Wire, Surgeon's Calm and Share the Cost keep a line alive at your own expense." },
      { name: "The bell-ringer", line: "Register, Forge Manners and Call mean nobody in your party stays dead for long." },
    ],
    teachersNote: "The Kestrel Medic and the Clinic Surgeon teach the healing ceilings; the Resident — an Echo teaching from inside a Riverlands Core — teaches Call.",
  },
  surger: {
    slug: "surger",
    hook: "The engine that runs on the hit.",
    pitch: "The Surger is the infused berserker: a rig, a blade, and a body that treats damage as fuel. Ride the Hit feeds Flywheel, Flywheel feeds the spend, and when the crate runs dry the blood becomes the backup battery. It is the one class that dances with the corruption ladder on purpose — and it shows.",
    weaponNote: "Blade first, fists a close second, a shotgun for anything that will not come closer. Thrown weapons matter because the Surger can Catch. It carries no long glass; the Surger is where the glass points.",
    weapons: w(1, 0, 0, 2, 1, 0, 3, 2),
    builds: [
      { name: "The perpetual engine", line: "Ride the Hit feeds Flywheel, Flywheel feeds the spend, and Vein Tax and Tithe make blood the backup battery." },
      { name: "One hunt, two branches", line: "Render Down turns the kill into fuel while Trophy Rack turns it into forms." },
      { name: "Red Line on the Red Ladder", line: "The all-in corruption build — faster than anything clean, and the ladder collects." },
    ],
    teachersNote: "The Infuser-Tech and Nalia Reed hold the rig's ceilings; the Phase-Five — a Carrier alive at phase five — teaches Surge, a seat still reserved; the Skinner of the Red Forest teaches Assume.",
  },
  archon: {
    slug: "archon",
    hook: "More of you than the fight started with.",
    pitch: "The Archon fights by bond — a war mount, a flock, a machine that answers to a name. Sky cavalry turns the map three-dimensional; the flock means every fight ends with more of you than it began with; Freight Class can deliver a whole firebase to a rooftop. Its Still is the party's answer when the Risen climb out.",
    weaponNote: "A rifle and a sidearm for the moments the bond is elsewhere; the bond is the real weapon, and the Archon's job is to be where it is most useful. Nothing that needs both hands and a crate.",
    weapons: w(2, 0, 1, 0, 2, 0, 1, 1),
    builds: [
      { name: "Sky cavalry", line: "One Bond, War Mount, Combat Drop and Skyborne turn the map three-dimensional." },
      { name: "The flock", line: "Many Voices, Swarm Logic and Everything Flies Twice mean every fight ends with more of you than it started." },
      { name: "Freight Class", line: "Deliver a Cypherist's whole Firebase to a rooftop — and Still is the answer when the Risen climb out." },
    ],
    teachersNote: "Mara Quill and the Captured Rider hold the bond's ceilings; the Gate Clerk teaches Crossing; the Unridden — a beast that consents — is the game's one non-person teacher, and Skyborne is hers.",
  },
  procurator: {
    slug: "procurator",
    hook: "Weak alone. Unbeatable in numbers.",
    pitch: "The Procurator is the commander and the merchant: the fire plan, the supply line, and the wheel that every other class's fuel runs through. Sand Table Mind chooses the kill box, Clockwork Advance times it, Battery Voice ends it — and One More Crate means the party never runs dry. It is the Kingdom Management class, and the only one that masters two trades.",
    weaponNote: "Crew-served, because a Procurator is never alone; a rifle and a sidearm for the day it is. The order wheel is the real weapon, and the Levy draws from the Procurator's own squad.",
    weapons: w(2, 0, 1, 1, 2, 3, 0, 1),
    builds: [
      { name: "The fire plan", line: "Sand Table Mind chooses the Kill Box, Clockwork Advance times it, Battery Voice ends it." },
      { name: "The supply line", line: "One More Crate, Cold Chain and The Order mean the party never runs dry and never stays dead." },
      { name: "The crown", line: "The Field or the Map: the class the realm is built for, and the Second Seal lets it master two trades." },
    ],
    teachersNote: "The Kestrel Quartermaster, the Tempest Battery Officer and Jaro Fen hold the wheel's ceilings; the Pearl Factor teaches Cartel Terms; the kingdom pass's ceiling — the Crown Without a Name — is reserved.",
  },
  cypherist: {
    slug: "cypherist",
    hook: "Bench anywhere. War from a chair.",
    pitch: "The Cypherist is the high-tech class: the bench made portable, the frame made personal, the grid made an accomplice. It wears a warframe or fights remote through an uplink, plants emplacements that turn a doorway into architecture, and builds the machines the soulless garrison is made of. The Circuit is the only tree with two forks, because the owner said give me both.",
    weaponNote: "Crew-served emplacements and a rifle by hand; the frame and the drones do the rest. A Cypherist's suppressed carbine is for the walk to the bench, not the fight after it.",
    weapons: w(2, 1, 0, 0, 2, 2, 0, 1),
    builds: [
      { name: "The warframe", line: "Pilot the frame: Exoframe and Chromewright make a body the fight has to get through." },
      { name: "The remote war", line: "Uplink and Gridrunner: the operator's body is findable — the feed traces both ways — but the war happens somewhere else." },
      { name: "The armoury", line: "Emplacer and Cellworks: instant architecture, hardpoints, and the reserve to run them." },
    ],
    teachersNote: "The Kestrel Mechanic and the Foundry-Master hold the bench's ceilings; NAG — yes, the watch — teaches Testimony; the Fully Converted teaches Second Skeleton.",
  },
  maverick: {
    slug: "maverick",
    hook: "Twin irons, or iron and ember.",
    pitch: "The Maverick is the gunslinger and the duelist: loud, fast, seen. Two pistols or a pistol and a spell-hand, a Call It duel nobody can decline, and a reputation that works as a weapon before the draw. The Crossed Irons are the opposite personality to the Spector — and the showdown is a build.",
    weaponNote: "Sidearms first, last and always — Fan the Hammer wants two. A blade for the duel that goes wrong; a shotgun for the day the legend is not enough. No long glass, no crew: nothing a Maverick cannot draw.",
    weapons: w(0, 0, 0, 1, 3, 0, 2, 1),
    builds: [
      { name: "The cylinder storm", line: "Twin Irons and Trickwork: Glassload rounds and an Impossible Shot from two hands." },
      { name: "The ember duelist", line: "Iron & Ember: Glasscharge makes one pouch feed two hands — pistol and spell-hand together." },
      { name: "The showdown", line: "Call It, the Circle, and the Legend: Born Standing, paid for in glow." },
    ],
    teachersNote: "The Gun — the Southside rifle's own open question — teaches Dead Level; Serrat the Once teaches Bloodless; the Impossible Shot is a crossroads bargain, they say, and never a person.",
  },
};

export function getClassDossier(slug: string): ClassDossier | undefined {
  return classDossiers[slug];
}
