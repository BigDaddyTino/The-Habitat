/**
 * The character hub's data: what a player picks at the enlistment desk and
 * what grows afterwards, in gamer shapes (species = stat caps + perk +
 * drawback; background = kit + skill head start + passive + contact + hook;
 * origin = your casting resource). Every line here is a readable summary of
 * a codex dossier — the dossier is canon, this is the handbook page, and each
 * block links back to the entry it summarises.
 */

export const attributeNames = ["Conditioning", "Coordination", "Resilience", "Acuity", "Composure", "Conductivity"] as const;
export type AttributeName = (typeof attributeNames)[number];

export type AttributeCard = { name: AttributeName; short: string; governs: string; raisedBy: string; corruption: string };

export const attributes: AttributeCard[] = [
  { name: "Conditioning", short: "strength & stamina", governs: "Carry load, sprint, how far the vignette closes when you are winded.", raisedBy: "Distance under load, real food, a medic who makes you rest.", corruption: "Phase 2 takes a rung." },
  { name: "Coordination", short: "aim & reflexes", governs: "Sway, reload, recoil recovery, whether a channelled cast survives being jostled.", raisedBy: "Precise action under stress — a reload while being shot at counts, on the range it does not.", corruption: "Phase 1 takes a rung." },
  { name: "Resilience", short: "toughness", governs: "Hits before Down (1 + a third of the rung), the Dying clock in minutes, toxin resistance.", raisedBy: "Surviving things, medicine, good prosthetics.", corruption: "Phase 6 pays a rung, above your ceiling." },
  { name: "Acuity", short: "perception", governs: "What the world renders for you at all — reads, tells, the information nobody else gets.", raisedBy: "Reads that turned out right, optics worth more than your kit.", corruption: "Phase 4 pays a rung, above your ceiling." },
  { name: "Composure", short: "nerve", governs: "Whether the world stays legible when it goes badly; the capacity to refuse a dose.", raisedBy: "Holding under fire, rest, a real meal.", corruption: "Phase 3 takes two rungs." },
  { name: "Conductivity", short: "the casting stat", governs: "Pool = 8 + level + 2 × Conductivity for born and gifted casters. Charges held = Conductivity + 2 for the infused.", raisedBy: "The one attribute an instrument reads; the Reach raises it, and so does veining.", corruption: "Phase 2 pays a rung, above your ceiling." },
];

export type SpeciesCard = {
  slug: string; name: string; tagline: string;
  caps: Record<AttributeName, number | null>;
  perks: string[]; drawbacks: string[];
  forge: string;
};

const caps = (co: number | null, cr: number | null, r: number | null, a: number | null, cm: number | null, cd: number | null): Record<AttributeName, number | null> =>
  ({ Conditioning: co, Coordination: cr, Resilience: r, Acuity: a, Composure: cm, Conductivity: cd });

export const species: SpeciesCard[] = [
  { slug: "human", name: "Human", tagline: "The baseline.", caps: caps(8, 8, 8, 8, 8, 8), perks: ["No strings: no premium, no watchers, no clock."], drawbacks: ["No edge either — 8 across the board."], forge: "Standard reclamation cost." },
  { slug: "returnees", name: "Returnees", tagline: "Back from hidden realms after two thousand years; long-lived.", caps: caps(7, 8, 7, 9, 9, 7), perks: ["Long Memory: reads on anything pre-war succeed where a human's fail; reads ancient scripts.", "Lifespan of two to three human spans."], drawbacks: ["Slow to Mend: Resilience recovers at half pace.", "Reclamation costs +10% Essence (dense soul pattern)."], forge: "+10% Essence to rebuild." },
  { slug: "carriers", name: "Carriers", tagline: "Bloodlines that bred corruption tolerance, not corruption.", caps: caps(8, 8, 8, 8, 7, 9), perks: ["Tolerance: corruption advances at two-thirds pace — the only discount on the ladder.", "Reads corruption tells on others a phase early."], drawbacks: ["Wanted: a Conductivity-9 body is the ideal infusion subject, and one blood test says so."], forge: "Standard reclamation cost." },
  { slug: "chartered", name: "The Chartered", tagline: "Purpose-built people, recognised by a challengeable document.", caps: caps(9, 8, 8, 7, 7, 9), perks: ["Specification: one attribute starts at rung 5 — top of the recruit band on day one.", "The charter opens doors in four jurisdictions."], drawbacks: ["Expiry: past an undisclosed threshold, Resilience decays unless Helix maintains you.", "Your reclamation pattern is patented; someone eventually invoices."], forge: "Patented pattern — an invoice follows." },
  { slug: "the-unregistered", name: "The Unregistered", tagline: "The Forge cannot read them. Opt-in hardcore.", caps: caps(8, 8, 8, 8, 9, null), perks: ["Unreadable: every scanner, assay and surveillance instrument returns noise. Concealed by default, forever, free.", "Nerve: Composure caps at 9."], drawbacks: ["Permadeath. The Forge cannot rebuild them. Every death is final, from minute one. The game warns you twice."], forge: "No reclamation. Ever." },
  { slug: "the-latent", name: "The Latent", tagline: "Survived the purges by passing as human, so well it erased its own record.", caps: caps(8, 8, 8, 8, 8, 8), perks: ["Surfacing: once, ever, something dormant expresses — a licence class never trained, a creature-sense, or an inherited memory. One cap becomes 9."], drawbacks: ["You do not choose when: a near-death, a first dose or a magical overload triggers it.", "Until then you are, in every readable way, human — and after, your blood test is suddenly very interesting."], forge: "Standard until Surfacing; then whatever surfaced." },
];

export const reservedSpecies = ["the Benthic (ocean)", "the Aerials (high cliffs)", "the Quiet (wasteland)", "a returned giver"];

export type BackgroundCard = { slug: string; name: string; role: string; skill: string; kit: string; passive: { name: string; effect: string }; contact: string; hook: string };

export const backgrounds: BackgroundCard[] = [
  { slug: "contract-security", name: "Contract Security", role: "the soldier", skill: "Marksmanship at Reliable", kit: "Worn plate refitted twice, a rifle with somebody else's filing on the serial, 60 rounds when issue is 30.", passive: { name: "Price the Room", effect: "On entry you see who is armed, who is paid, and who is about to stop being either." }, contact: "A former squadmate drawing Iron Saints pay.", hook: "A checkpoint where the paperwork was in order and the people were not." },
  { slug: "infusion-technician", name: "Infusion Technician", role: "the caster-tech", skill: "Rig Maintenance at Reliable", kit: "A rig nobody else touches, a torque driver worn smooth in one spot, three doses on no manifest.", passive: { name: "Bad Valve", effect: "You hear a rig running past service across a room, including the one on the enemy." }, contact: "A supplier who has never asked what it is for.", hook: "Whose crate those three doses came out of." },
  { slug: "field-medicine", name: "Field Medicine", role: "the medic", skill: "Trauma at Reliable, plus a provisional Regenerative licence", kit: "A trauma bag rebuilt for weight rather than completeness, and a phase-reader that was supposed to be handed back.", passive: { name: "Triage Eye", effect: "A body's history at a glance; corruption tells two phases before anybody else in the room." }, contact: "A clinic that still forwards your mail.", hook: "The first reading you falsified — not that you did it, but who asked." },
  { slug: "reconnaissance", name: "Reconnaissance", role: "the scout", skill: "Navigation at Reliable", kit: "Optics worth more than everything else you own, and a map wrong in two places you know about.", passive: { name: "Ground Truth", effect: "Wildlife, weather and ground tell you what is coming." }, contact: "Somebody in a village who feeds you and is not supposed to.", hook: "A position you reported clear." },
  { slug: "materiel", name: "Materiel", role: "the quartermaster", skill: "Negotiation at Reliable", kit: "Keys to four things you should not have keys to, and a ledger in your own shorthand.", passive: { name: "Count the Crates", effect: "Stock, prices and shortfalls on sight; at Reliable, who took it." }, contact: "A Black Tithe buyer holding the other half of a ledger you would like back.", hook: "A shortfall that killed somebody, and the entry that covered it." },
  { slug: "salvage-engineering", name: "Salvage Engineering", role: "the mechanic", skill: "Fabrication at Reliable", kit: "The only door that starts with chrome: one limb augment, unfinanced, built for somebody else.", passive: { name: "Load Path", effect: "Structures show you what they are holding up." }, contact: "A Foundry Workers' Union steward who considers you a member whether you agreed or not.", hook: "Who the prosthetic was for." },
];

export const reservedBackgrounds = ["holdfast militia", "caravan guide", "line worker", "cordon veteran", "transit inspector", "Meridian graduate", "lodge apprentice", "Coast Guard rating", "skiff militia", "missionary", "Choir debtor"];

export type OriginCard = { name: string; line: string; resource: string; starts: string; watched: string };

export const origins: OriginCard[] = [
  { name: "None", line: "No magic. The absence of an origin, not a fourth one.", resource: "Rounds and kit. Stormglass rounds are the one way you put ARCANE on a wall.", starts: "Composure a rung higher — people who cannot borrow power learn to hold.", watched: "By nobody, until the first dose makes you Infused from that second." },
  { name: "Born", line: "A bloodline. The pillar is set at birth; the licence class declares itself under pressure, in the prologue, and somebody sees.", resource: "A pool: 8 + level + 2 × Conductivity. Refills with sleep (full), a real meal (a quarter), a Chemistry tonic (a third, once a day).", starts: "Conductivity a rung higher. An unlicensed practitioner from minute one.", watched: "Hidden by the Concordance, fought for by the Liberation, priced by Aegis." },
  { name: "Gifted", line: "A giver decided. A Lizzarnix gift expresses as Thermodynamics or Biologics; a Pale Embassy gift as Cognition or Resonance, with terms you read years later.", resource: "A pool, same as Born. The sheet cannot tell the two apart; the Church and the Embassy can.", starts: "Whichever pillar the giver chose.", watched: "Venerated and collected by the Church of the First Gift; courted by the Embassy." },
  { name: "Infused", line: "Manufactured. You were dosing before the island and your hand already knows.", resource: "Charges through a rig: a dose loads 5, the body holds Conductivity + 2, nothing regenerates. Casts cost 1 · 2 · 4 by tier.", starts: "Corruption phase 1. The Tremor is already in your hand.", watched: "Regulated by the Directorate, manufactured with expiry dates by Helix, supplied by the harvest economy or its black arm." },
];

export type LedgerCard = { name: string; slug: string | null; tier: "Given" | "Earned" | "Carried"; death: "kept" | "rebuilt" | "lost"; line: string };

export const ledgers: LedgerCard[] = [
  { name: "Species", slug: null, tier: "Given", death: "kept", line: "The only ledger with no cost, and the one strangers read first." },
  { name: "Background", slug: "character-classes", tier: "Given", death: "kept", line: "The door you came in through, chosen once." },
  { name: "Attributes", slug: "attributes", tier: "Earned", death: "rebuilt", line: "Six rungs; their sum is your level and the Forge's price: 35 Essence + 11.7 a level." },
  { name: "Skills", slug: "skills", tier: "Earned", death: "kept", line: "Twenty skills, five ranks, sixty techniques. The last rank always needs a person." },
  { name: "Talents", slug: null, tier: "Earned", death: "kept", line: "One tree per class: 1 point a level, 5 at level 1 and every 10th, 144 by the cap." },
  { name: "Licences", slug: "the-six-pillars", tier: "Earned", death: "kept", line: "Up to three licence classes from at most two pillars; master exactly one. No respec anywhere." },
  { name: "Professions", slug: "professions", tier: "Earned", death: "kept", line: "Nine trades, four rungs. Master one, ever — unless you are a Procurator." },
  { name: "Corruption", slug: "the-corruption-system", tier: "Carried", death: "kept", line: "Seven phases. Nobody dies their way clean." },
  { name: "Suspicion", slug: "suspicion", tier: "Carried", death: "kept", line: "One score per institution. A public death is evidence." },
  { name: "Kit", slug: "kit", tier: "Carried", death: "lost", line: "On the corpse where it fell." },
];

export const levelLaw = {
  talentPoints: "1 talent point per level; 5 at level 1 and at every 10th level. 144 by level 100. Every tree holds more than 144 points of nodes, so nobody owns everything.",
  attributes: "Your level is the sum of your six attribute rungs. A raw recruit is level 7 to 14; a developed character at level 30 averages rung 5.",
  creation: "Every class starts from 9 rungs: 3 in its primary attribute, 2 in its secondary, 1 in each of the other four. You place 2 more where species caps allow (no attribute above 4 at the desk unless a species says so), and may move 1 point from one class-allotted attribute to another. Origin adds its rung on top: None a Composure, Born a Conductivity. A recruit signs the file at level 11 or 12.",
};

/**
 * The per-class starting allotment (owner delegation, ruled 2026-09-02):
 * nine rungs, shaped 3 · 2 · 1 · 1 · 1 · 1. The primary is the attribute the
 * class's growth line drives first, the secondary the one it drives second,
 * and nobody starts at 0 in anything — a recruit is a whole person before
 * they are a build. 9 + the player's 2 + an origin rung lands at level 11–12,
 * inside canon's 7–14 recruit band, and quotes at about 165 Essence.
 */
export type ClassAllotment = { classSlug: string; primary: AttributeName; secondary: AttributeName };

export const classAllotments: ClassAllotment[] = [
  { classSlug: "bastion", primary: "Conditioning", secondary: "Resilience" },
  { classSlug: "spector", primary: "Coordination", secondary: "Acuity" },
  { classSlug: "conduit", primary: "Conductivity", secondary: "Composure" },
  { classSlug: "surger", primary: "Conditioning", secondary: "Conductivity" },
  { classSlug: "archon", primary: "Acuity", secondary: "Composure" },
  { classSlug: "procurator", primary: "Composure", secondary: "Acuity" },
  { classSlug: "cypherist", primary: "Acuity", secondary: "Coordination" },
  { classSlug: "maverick", primary: "Coordination", secondary: "Composure" },
];

export const creationRules = {
  baseTotal: 9,
  primaryRung: 3,
  secondaryRung: 2,
  otherRung: 1,
  freePoints: 2,
  deskCap: 4,
  reassign: 1,
  originRung: { None: "Composure", Born: "Conductivity", Gifted: "the giver's pillar decides", Infused: "none — the Tremor is the gift" } as Record<string, string>,
};

/** The six rungs a class signs the file with, before the player's points. */
export function startingRungs(classSlug: string): Record<AttributeName, number> | null {
  const allotment = classAllotments.find((entry) => entry.classSlug === classSlug);
  if (!allotment) return null;
  return Object.fromEntries(attributeNames.map((name) => [name, name === allotment.primary ? creationRules.primaryRung : name === allotment.secondary ? creationRules.secondaryRung : creationRules.otherRung])) as Record<AttributeName, number>;
}
