/**
 * The campaign's cast: species, origins, professions, the mechanical weight
 * of individual talent nodes, the archetype builds, and the opposition.
 *
 * Builds are assembled from the REAL tree data, so a build that breaks a
 * prerequisite, takes both sides of a fork, or overspends the level-100
 * budget fails validation instead of quietly simulating something the game
 * would never allow.
 */

import { getTalentClass, talentPointsAtLevel, type TalentNode } from "../../lib/talent-trees";
import type { AttackProfile, AttributeKey, NodeEffect, OriginProfile, ProfessionProfile, SimCharacter, SpeciesProfile } from "./talent-sim";
import { attributesFor, mergeEffects } from "./talent-sim";
import { corruptedEffects, institutionalCosts, nodeEffects } from "../../lib/talent-effects";

export { corruptedEffects, institutionalCosts, nodeEffects };

const caps = (conditioning: number, coordination: number, resilience: number, acuity: number, composure: number, conductivity: number) =>
  ({ conditioning, coordination, resilience, acuity, composure, conductivity });

export const species: SpeciesProfile[] = [
  { slug: "human", name: "Human", caps: caps(8, 8, 8, 8, 8, 8), corruptionPace: 1, mendPace: 1, permadeath: false, unreadable: false, note: "No strings, no edge." },
  { slug: "returnees", name: "Returnee", caps: caps(7, 8, 7, 9, 9, 7), corruptionPace: 1, mendPace: 0.5, permadeath: false, unreadable: false, note: "Long Memory; slow to mend; reclamation costs ten percent more." },
  { slug: "carriers", name: "Carrier", caps: caps(8, 8, 8, 8, 7, 9), corruptionPace: 2 / 3, mendPace: 1, permadeath: false, unreadable: false, note: "Tolerance — the ladder's only discount, and it is inherited." },
  { slug: "chartered", name: "Chartered", caps: caps(9, 8, 8, 7, 7, 9), corruptionPace: 1, mendPace: 1, permadeath: false, unreadable: false, specification: "conditioning", note: "Built for one thing, on a clock nobody at the table can read." },
  { slug: "the-unregistered", name: "Unregistered", caps: caps(8, 8, 8, 8, 9, 8), corruptionPace: 1, mendPace: 1, permadeath: true, unreadable: true, note: "Every death is true death. Instruments return noise." },
  { slug: "the-latent", name: "Latent", caps: caps(8, 8, 8, 8, 8, 9), corruptionPace: 1, mendPace: 1, permadeath: false, unreadable: false, note: "Surfaced: one ceiling became nine." },
];

export const origins: OriginProfile[] = [
  { slug: "none", name: "None", economy: "none", startingPhase: 0, composureBonus: 1 },
  { slug: "born", name: "Born", economy: "pool", startingPhase: 0, composureBonus: 0 },
  { slug: "gifted", name: "Gifted", economy: "pool", startingPhase: 0, composureBonus: 0 },
  { slug: "infused", name: "Infused", economy: "charges", startingPhase: 1, composureBonus: 0 },
];

export const professions: ProfessionProfile[] = [
  { slug: "medicine", name: "Medicine (master)", effects: { partyRecovery: 2, partyDyingClock: 6 } },
  { slug: "logistics", name: "Logistics (master)", effects: { extraDoses: 2, ammoMultiplier: 1.5 } },
  { slug: "chemistry", name: "Chemistry (master)", effects: { corruptionPace: 0.7, extraDoses: 1 } },
  { slug: "engineering", name: "Engineering (master)", effects: { extraPlates: 1 } },
  { slug: "culinary", name: "Culinary (master)", effects: { composureRestore: 2, partyRecovery: 1 } },
  { slug: "xenobiology", name: "Xenobiology (master)", effects: { partyRecovery: 1, extraPlates: 1 } },
  { slug: "none", name: "No trade", effects: {} },
];


/** Base attacks per class. Spell attacks drop out for a `none` origin. */
const classAttacks: Record<string, AttackProfile[]> = {
  bastion: [
    { name: "Rifle", type: "PHYSICAL", wounds: 1.2, accuracy: 0.58, cost: 1, costs: "ammo" },
    { name: "Plate and boot", type: "PHYSICAL", wounds: 1.3, accuracy: 0.62, cost: 0, costs: "none" },
    { name: "Seal (Containment)", type: "ARCANE", wounds: 1, accuracy: 0.6, cost: 2, costs: "pool" },
  ],
  spector: [
    { name: "Aimed shot", type: "PHYSICAL", wounds: 2, accuracy: 0.48, cost: 2, costs: "ammo" },
    { name: "Quick shot", type: "PHYSICAL", wounds: 1, accuracy: 0.58, cost: 1, costs: "ammo" },
    { name: "Blur (Perceptual)", type: "ARCANE", wounds: 0.5, accuracy: 0.7, cost: 2, costs: "pool" },
  ],
  conduit: [
    { name: "Thermal cast", type: "FIRE", wounds: 2, accuracy: 0.6, cost: 4, costs: "pool" },
    { name: "Licensed cast", type: "ARCANE", wounds: 1, accuracy: 0.66, cost: 2, costs: "pool" },
    { name: "Master signature", type: "ARCANE", wounds: 3, accuracy: 0.66, cost: 8, costs: "pool" },
    { name: "Sidearm", type: "PHYSICAL", wounds: 0.5, accuracy: 0.5, cost: 1, costs: "ammo" },
  ],
  surger: [
    { name: "Kinetic shove", type: "PHYSICAL", wounds: 1.5, accuracy: 0.62, cost: 1, costs: "charges" },
    { name: "Fists and momentum", type: "PHYSICAL", wounds: 1, accuracy: 0.66, cost: 0, costs: "none" },
    { name: "Return (Master)", type: "ARCANE", wounds: 3, accuracy: 0.6, cost: 4, costs: "charges" },
  ],
  archon: [
    { name: "Sidearm", type: "PHYSICAL", wounds: 1, accuracy: 0.55, cost: 1, costs: "ammo" },
    { name: "Set the bond on them", type: "PHYSICAL", wounds: 1.5, accuracy: 0.6, cost: 0, costs: "none", bleeds: true },
    { name: "Consignment", type: "ARCANE", wounds: 2, accuracy: 0.6, cost: 4, costs: "pool" },
  ],
  procurator: [
    { name: "Sidearm", type: "PHYSICAL", wounds: 1.2, accuracy: 0.56, cost: 1, costs: "ammo" },
    { name: "Called fire mission", type: "FIRE", wounds: 2.5, accuracy: 0.55, cost: 4, costs: "ammo" },
  ],
  cypherist: [
    { name: "Frame strike", type: "PHYSICAL", wounds: 1.5, accuracy: 0.58, cost: 0, costs: "none" },
    { name: "Carbine", type: "PHYSICAL", wounds: 1, accuracy: 0.55, cost: 1, costs: "ammo" },
    { name: "Spell in a can", type: "ELECTRICAL", wounds: 2, accuracy: 0.62, cost: 2, costs: "charges" },
  ],
  maverick: [
    { name: "Twin irons", type: "PHYSICAL", wounds: 1.5, accuracy: 0.6, cost: 2, costs: "ammo" },
    { name: "Single iron", type: "PHYSICAL", wounds: 1, accuracy: 0.62, cost: 1, costs: "ammo" },
    { name: "Fan the hammer", type: "PHYSICAL", wounds: 3, accuracy: 0.5, cost: 6, costs: "ammo", onceOnly: true },
    { name: "Ember cast", type: "FIRE", wounds: 2, accuracy: 0.62, cost: 2, costs: "pool" },
  ],
};

const primaries: Record<string, [AttributeKey, AttributeKey]> = {
  bastion: ["conditioning", "resilience"],
  spector: ["coordination", "acuity"],
  conduit: ["conductivity", "composure"],
  surger: ["conditioning", "conductivity"],
  archon: ["acuity", "composure"],
  procurator: ["composure", "acuity"],
  cypherist: ["acuity", "coordination"],
  maverick: ["coordination", "composure"],
};

export type BuildSpec = {
  label: string;
  classSlug: string;
  /** How many nodes to take from each branch, in tree order. */
  take: Record<string, number>;
  /** Fork ids kept; the partner of each is skipped. */
  forks?: string[];
};

export type ValidatedBuild = { spec: BuildSpec; nodes: TalentNode[]; cost: number; problems: string[] };

/** Walks the real tree, so a build that cheats fails here rather than lying
 *  in a result table. */
export function validateBuild(spec: BuildSpec): ValidatedBuild {
  const tree = getTalentClass(spec.classSlug);
  const problems: string[] = [];
  if (!tree) return { spec, nodes: [], cost: 0, problems: [`unknown class ${spec.classSlug}`] };

  const chosenForks = new Set(spec.forks ?? []);
  const owned: TalentNode[] = [];
  const ownedIds = new Set<string>();

  for (const [branchName, count] of Object.entries(spec.take)) {
    const branch = tree.branches.find((entry) => entry.name === branchName);
    if (!branch) { problems.push(`${spec.classSlug} has no branch "${branchName}"`); continue; }
    let taken = 0;
    for (const node of branch.nodes) {
      if (taken >= count) break;
      // Skip the fork side this build did not choose.
      if (node.fork && !chosenForks.has(node.id) && (chosenForks.has(node.fork) || (spec.forks ?? []).length > 0)) continue;
      owned.push(node); ownedIds.add(node.id); taken += 1;
    }
    if (taken < count) problems.push(`${spec.label}: asked for ${count} of ${branchName}, took ${taken}`);
  }

  // Prerequisites, checked the way the calculator checks them.
  for (const branch of tree.branches) {
    branch.nodes.forEach((node, index) => {
      if (!ownedIds.has(node.id)) return;
      if (node.requiresAny) {
        if (!node.requiresAny.some((id) => ownedIds.has(id))) problems.push(`${spec.label}: ${node.id} needs one of ${node.requiresAny.join("/")}`);
        return;
      }
      if (index === 0) return;
      const previous = branch.nodes[index - 1];
      if (!ownedIds.has(previous.id) && !(node.weave && ownedIds.has(node.weave))) {
        problems.push(`${spec.label}: ${node.id} stands on nothing`);
      }
    });
  }
  for (const node of owned) {
    if (node.fork && ownedIds.has(node.fork)) problems.push(`${spec.label}: took both sides of the ${node.id}/${node.fork} fork`);
  }
  const cost = owned.reduce((sum, node) => sum + node.cost, 0);
  if (cost > talentPointsAtLevel(100)) problems.push(`${spec.label}: costs ${cost}, over the ${talentPointsAtLevel(100)} budget`);
  return { spec, nodes: owned, cost, problems };
}

export function makeCharacter(build: ValidatedBuild, speciesSlug: string, originSlug: string, professionSlugs: string[], phase = 0, level = 100): SimCharacter {
  const kind = species.find((entry) => entry.slug === speciesSlug) ?? species[0];
  const origin = origins.find((entry) => entry.slug === originSlug) ?? origins[0];
  const trades = professionSlugs.map((slug) => professions.find((entry) => entry.slug === slug) ?? professions[5]);
  const [primary, secondary] = primaries[build.spec.classSlug];

  const corrupted = Object.entries(corruptedEffects[build.spec.classSlug] ?? {})
    .filter(([phaseKey]) => Number(phaseKey) <= phase)
    .map(([, effect]) => effect);
  const effects = mergeEffects([
    ...build.nodes.map((node) => nodeEffects[`${build.spec.classSlug}/${node.id}`] ?? {}),
    ...corrupted,
    institutionalCosts(phase),
  ]);
  const attributes = attributesFor(level, primary, secondary, kind, phase);
  attributes.composure = Math.min(kind.caps.composure, attributes.composure + origin.composureBonus);

  const attacks = classAttacks[build.spec.classSlug].filter((attack) => {
    if (attack.costs === "pool") return origin.economy === "pool";
    if (attack.costs === "charges") return origin.economy === "charges";
    return true;
  });

  const character: SimCharacter = {
    label: `${build.spec.label} · ${kind.name} · ${origin.name}${phase ? ` · P${phase}` : ""}`,
    classSlug: build.spec.classSlug,
    species: kind, origin, professions: trades, level, phase,
    attributes, attacks, effects,
    wounds: 0, bleeding: 0, plates: 0, resource: 0, resourceMax: 0, ammo: 0,
    down: false, dying: 0, dead: false, usedOnce: new Set(), refusedDown: false, burstUsed: false,
  };
  return character;
}

/** The archetype builds: the shapes the gameplay audit said each tree makes. */
export const archetypes: BuildSpec[] = [
  { label: "Bastion · Fortress", classSlug: "bastion", forks: ["immovable"], take: { "The Line": 8, "Shieldwall": 9, "Last Stand": 8, "Aegis": 5 } },
  { label: "Bastion · Breach", classSlug: "bastion", forks: ["unstoppable"], take: { "The Line": 5, "Breacher": 8, "Juggernaut": 8, "Last Stand": 6 } },
  { label: "Spector · One Round", classSlug: "spector", forks: ["signature-shot"], take: { "Fieldcraft": 9, "Marksman": 8, "Tracker": 6, "Saboteur": 4 } },
  { label: "Spector · The Nobody", classSlug: "spector", forks: ["never-here"], take: { "Fieldcraft": 8, "Ghost": 8, "Face": 8, "Saboteur": 5 } },
  { label: "Conduit · Siege Lantern", classSlug: "conduit", forks: ["deep-pool"], take: { "Channelling": 8, "Warcaster": 8, "Shaper": 6, "Mindworker": 3 } },
  { label: "Conduit · Field Surgeon", classSlug: "conduit", forks: ["live-wire"], take: { "Channelling": 8, "Mender": 8, "Mindworker": 6, "Resonant": 4 } },
  { label: "Surger · Red Ladder", classSlug: "surger", forks: ["red-line"], take: { "Overdrive": 8, "Berserk": 8, "Bloodwork": 8, "Ironvein": 4 } },
  { label: "Surger · Clean Shifter", classSlug: "surger", forks: ["clean-burn"], take: { "Overdrive": 8, "Shifter": 8, "Symbiont": 8, "Berserk": 4 } },
  { label: "Archon · Sky Cavalry", classSlug: "archon", forks: ["one-bond"], take: { "The Bond": 8, "Apex": 8, "Packleader": 7, "Dronewright": 3 } },
  { label: "Archon · The Flock", classSlug: "archon", forks: ["many-voices"], take: { "The Bond": 8, "Dronewright": 8, "Packleader": 8, "Gravecaller": 4 } },
  { label: "Procurator · Fire Plan", classSlug: "procurator", forks: ["the-map"], take: { "Command": 9, "Tactician": 8, "Quartermaster": 8, "Envoy": 2 } },
  { label: "Procurator · Supply Line", classSlug: "procurator", forks: ["the-field"], take: { "Command": 9, "Quartermaster": 8, "Sovereign": 6, "Envoy": 4 } },
  { label: "Cypherist · Warframe", classSlug: "cypherist", forks: ["wired", "pilot"], take: { "The Bench": 9, "Exoframe": 8, "Chromewright": 7, "Cellworks": 4 } },
  { label: "Cypherist · Remote War", classSlug: "cypherist", forks: ["clean-hands", "uplink"], take: { "The Bench": 9, "Gridrunner": 8, "Emplacer": 8, "Cellworks": 5 } },
  { label: "Maverick · Cylinder Storm", classSlug: "maverick", forks: ["two-irons"], take: { "The Draw": 8, "Twin Irons": 8, "Trickwork": 7, "The Legend": 4 } },
  { label: "Maverick · Ember Duelist", classSlug: "maverick", forks: ["iron-and-ember"], take: { "The Draw": 8, "Spellhand": 8, "The Duel": 8, "The Legend": 4 } },
];

/** The opposition, drawn from the fourteen kinds. */
export type Encounter = { name: string; make: () => SimCharacter[]; note: string };

const enemy = (name: string, attributes: Partial<Record<AttributeKey, number>>, attacks: AttackProfile[], effects: NodeEffect = {}, plates = 1): SimCharacter => ({
  label: name, classSlug: "enemy",
  species: species[0], origin: origins[0], professions: [], level: 60, phase: 0,
  attributes: { conditioning: 5, coordination: 5, resilience: 5, acuity: 5, composure: 5, conductivity: 0, ...attributes },
  attacks, effects: { ...effects, extraPlates: plates - 2 },
  wounds: 0, bleeding: 0, plates, resource: 0, resourceMax: 0, ammo: 0,
  down: false, dying: 0, dead: false, usedOnce: new Set(), refusedDown: false, burstUsed: false,
});

const rifle: AttackProfile = { name: "Rifle", type: "PHYSICAL", wounds: 1, accuracy: 0.55, cost: 1, costs: "ammo" };
const heavy: AttackProfile = { name: "Heavy", type: "PHYSICAL", wounds: 2, accuracy: 0.5, cost: 2, costs: "ammo" };

export const encounters: Encounter[] = [
  { name: "Pearl fire team (3)", note: "canon's line infantry — plate sigils say which ward they bought",
    make: () => [enemy("Pearl rifleman", { coordination: 6 }, [rifle]), enemy("Pearl rifleman", { coordination: 6 }, [rifle]), enemy("Pearl gunner", { coordination: 5 }, [heavy])] },
  { name: "Iron Saints shock team (2)", note: "cosmesis, no tells, and ELECTRICAL vents them",
    make: () => [enemy("Saint", { coordination: 7, conditioning: 7, resilience: 7 }, [heavy], { chrome: true, damageBonus: 0.3 }, 3), enemy("Saint", { coordination: 7, conditioning: 7, resilience: 7 }, [heavy], { chrome: true, damageBonus: 0.3 }, 3)] },
  { name: "ACA cordon team (4)", note: "grey coats who do not want to kill you",
    make: () => Array.from({ length: 4 }, (_, index) => enemy(`Cordon ${index + 1}`, { coordination: 6, resilience: 6 }, [{ name: "Tranquilliser", type: "TOXIC", wounds: 1.5, accuracy: 0.55, cost: 0, costs: "none" }], { control: 0.1 }, 2)) },
  { name: "Reach creature, Advanced rung", note: "trained on, harvested from, and still faster than you",
    make: () => [enemy("Adapted predator", { conditioning: 8, coordination: 7, resilience: 8 }, [{ name: "Rend", type: "PHYSICAL", wounds: 2, accuracy: 0.6, cost: 0, costs: "none", bleeds: true }, { name: "Spore burst", type: "TOXIC", wounds: 1.5, accuracy: 0.6, cost: 0, costs: "none" }], { toughness: 4 }, 0)] },
  { name: "Abomination (phase seven)", note: "used to be someone",
    make: () => [enemy("Abomination", { conditioning: 9, coordination: 6, resilience: 9 }, [{ name: "Arcane sweep", type: "ARCANE", wounds: 2.5, accuracy: 0.62, cost: 0, costs: "none", ignoresPlates: true }], { toughness: 8, damageBonus: 0.2 }, 0)] },
  { name: "Risen wave (6)", note: "no stat block, ever — they simply keep coming",
    make: () => Array.from({ length: 6 }, (_, index) => enemy(`Risen ${index + 1}`, { conditioning: 6, coordination: 4, resilience: 4 }, [{ name: "Grasp", type: "PHYSICAL", wounds: 1, accuracy: 0.5, cost: 0, costs: "none" }], {}, 0)) },
  { name: "Directorate checkpoint (2)", note: "reads paper before it reads people",
    make: () => [enemy("Officer", { coordination: 6 }, [rifle], { detection: 0.2 }), enemy("Conscript", { coordination: 4 }, [rifle])] },
  { name: "Monstrosity", note: "has a budget line and a name on the sign-off",
    make: () => [enemy("Monstrosity", { conditioning: 9, coordination: 5, resilience: 9 }, [{ name: "Slam", type: "PHYSICAL", wounds: 3, accuracy: 0.55, cost: 0, costs: "none" }], { toughness: 10 }, 2)] },
];
