/**
 * The combat model the balance simulations run on.
 *
 * Everything here is canon's own arithmetic where canon has any: the wound
 * model's six states and the Dying clock, the five damage types against
 * plates, both casting economies (a born caster's pool of 8 + level + twice
 * Conductivity; an infused caster's charges at Conductivity + 2 with a
 * standard rig delivering four of five), the corruption ladder's attribute
 * trades, and the species ceilings.
 *
 * Where canon has no number, this file invents one and says so. Those are
 * MODEL ASSUMPTIONS, listed at the bottom of the report, and they are the
 * part a designer should argue with. The simulations are not proof about a
 * game that does not exist yet; they are a structural test of whether the
 * trees produce builds that function, run dry, counter each other, and need
 * a party  which is exactly what the design claims.
 */

export type DamageType = "PHYSICAL" | "FIRE" | "ELECTRICAL" | "ARCANE" | "TOXIC";

/**
 * CONTINUOUS TIME. This is an FPS on a live dedicated server: there are no
 * rounds and no pausing, so the model runs on a real clock. One "contact
 * beat" — the cadence at which a fighter commits an attack, the old round —
 * is BEAT_SECONDS of wall time, and every rate in the model is defined
 * against seconds. The integrator steps at TICK_SECONDS, the way a server
 * ticks; probabilities per beat are converted to per-tick so expected values
 * are identical at any step size.
 */
export const BEAT_SECONDS = 3;
export const TICK_SECONDS = 0.5;

/**
 * Per-beat event rate → per-tick probability, preserving the EXPECTED NUMBER
 * of events (each event carries a fixed amount — a bleed's seep, a mended
 * wound — so the count is what must match, not the chance of at-least-one).
 */
const perTick = (perBeat: number) => Math.min(1, Math.max(0, perBeat) * (TICK_SECONDS / BEAT_SECONDS));

export type Attributes = {
  conditioning: number; coordination: number; resilience: number;
  acuity: number; composure: number; conductivity: number;
};
export type AttributeKey = keyof Attributes;

export type SpeciesProfile = {
  slug: string; name: string;
  caps: Attributes;
  /** Corruption advances at this multiple of the standard pace. */
  corruptionPace: number;
  /** Resilience recovery multiplier between fights. */
  mendPace: number;
  /** True death: no reclamation, ever. */
  permadeath: boolean;
  /** Instruments cannot read them at all. */
  unreadable: boolean;
  /** One attribute begins at rung 5  the thing they were built for. */
  specification?: AttributeKey;
  note: string;
};

export type OriginProfile = {
  slug: string; name: string;
  economy: "none" | "pool" | "charges";
  /** Infused characters start on the ladder. */
  startingPhase: number;
  composureBonus: number;
};

/** A profession's mechanical weight in a fight or across a day of them. */
export type ProfessionProfile = {
  slug: string; name: string;
  effects: Partial<{
    /** Doses carried into a fight beyond the standard issue. */
    extraDoses: number;
    /** Seconds of Dying clock added to the whole party. */
    partyDyingClock: number;
    /** Wounds healed between fights, per person. */
    partyRecovery: number;
    /** Composure restored between fights  Culinary's real meal. */
    composureRestore: number;
    /** Multiplier on ammunition carried. */
    ammoMultiplier: number;
    /** Corruption pace multiplier  Chemistry's cut. */
    corruptionPace: number;
    /** Plates carried beyond issue. */
    extraPlates: number;
    /** Extra fraction of a caster's pool restored between fights. */
    poolRestore: number;
    /** Fractional cut in cast costs  Engineering's conductor-grade rig. */
    castCostRelief: number;
    /**
     * Fractional cut in damage taken by everyone on the ground this trade
     * prepared  Architecture's walls. MODEL ASSUMPTION: the column is
     * treated as fighting on ground it built, which is what a defensive day
     * is and is not what an ambush is.
     */
    damageReduction: number;
  }>;
};

export type AttackProfile = {
  name: string;
  type: DamageType;
  /** Wounds inflicted when it lands and is not stopped by a plate. */
  wounds: number;
  /** Base chance before the attribute contest. */
  accuracy: number;
  /** Pool units, rig charges, or rounds  whichever the economy uses. */
  cost: number;
  costs: "none" | "pool" | "charges" | "ammo";
  /** Opens a bleed that ticks until treated. */
  bleeds?: boolean;
  /** Ignores plates outright  the arcane scar. */
  ignoresPlates?: boolean;
  /** Usable once per fight. */
  onceOnly?: boolean;
};

/** Everything a talent node can do to the model. Nodes not listed here are
 * — narrative in-sim: real in play, no arithmetic to test. */
export type NodeEffect = Partial<{
  accuracy: number;
  damageBonus: number;
  extraPlates: number;
  /** Multiplier on wounds taken  mitigation. */
  incoming: number;
  /** Readiness: shaves the delay before the first shot. */
  initiative: number;
  /** Extra SECONDS on the owner's Dying clock. */
  dyingClock: number;
  /** Wounds before Down, added. */
  toughness: number;
  /** Pool or charge efficiency multiplier on costs. */
  castCost: number;
  /** Resource returned per landed hit  the engines. */
  resourcePerHit: number;
  /** Resource returned per wound taken. */
  resourcePerWound: number;
  /** Flat resource ceiling bonus. */
  resourceCap: number;
  /** Ammunition multiplier. */
  ammo: number;
  /** Chance per contact beat to shrug a bleed or heal a wound (continuous). */
  selfRepair: number;
  /** Ally wounds restored when pulling somebody back up  party value. */
  partyHeal: number;
  /** Reduces every ally's incoming wounds  auras and cover. */
  partyMitigation: number;
  /** Action tempo bonus: attacks cycle this much faster. */
  extraAction: number;
  /** Chance to avoid being targeted first in PvP  the unseen. */
  concealment: number;
  /** Sees through concealment. */
  detection: number;
  /** Chance per committed attack to strip a plate or stagger  control. */
  control: number;
  /** Multiplier on enemy cast costs in range  the Dampening Coil. */
  enemyCastCost: number;
  /** Bodies fighting on your side that are not you. */
  minions: number;
  /** Immunity to the ELECTRICAL chrome-vent rule. */
  hardenedChrome: boolean;
  /** Carries chrome at all  what ELECTRICAL vents. */
  chrome: boolean;
  /** Once per fight, refuse Down. */
  refuseDown: boolean;
  /** Once per fight, spend everything for a burst. */
  burst: number;
}>;

export type SimCharacter = {
  label: string;
  classSlug: string;
  species: SpeciesProfile;
  origin: OriginProfile;
  professions: ProfessionProfile[];
  level: number;
  phase: number;
  attributes: Attributes;
  attacks: AttackProfile[];
  effects: NodeEffect;
  // Live state
  wounds: number;
  bleeding: number;
  plates: number;
  resource: number;
  resourceMax: number;
  ammo: number;
  down: boolean;
  dying: number;
  dead: boolean;
  usedOnce: Set<string>;
  refusedDown: boolean;
  burstUsed: boolean;
};

/** Deterministic RNG: the same seed always produces the same campaign. */
export function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state |= 0; state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * MODEL ASSUMPTION  attribute growth.
 *
 * Canon fixes the rungs (09) and the species ceilings but not the curve a
 * hundred levels draws through them. The class growth line ("+2 Conditioning
 * / +1 Resilience") is read as weights: the primary reaches its ceiling
 * around level 80, the secondary near the cap, and everything untouched
 * drifts to about 5  a developed character, never a maxed one.
 */
export function attributesFor(level: number, primary: AttributeKey, secondary: AttributeKey, species: SpeciesProfile, phase: number): Attributes {
  const base = (weight: number) => 2 + level * weight;
  const raw: Attributes = {
    conditioning: base(0.035), coordination: base(0.035), resilience: base(0.035),
    acuity: base(0.035), composure: base(0.035), conductivity: base(0.035),
  };
  raw[primary] = base(0.08);
  raw[secondary] = base(0.06);
  if (species.specification) raw[species.specification] = Math.max(raw[species.specification], 5 + level * 0.045);

  const out = {} as Attributes;
  for (const key of Object.keys(raw) as AttributeKey[]) {
    out[key] = Math.min(species.caps[key], Math.round(raw[key] * 10) / 10);
  }
  // The corruption ladder trades rungs  canon's own table.
  if (phase >= 1) out.coordination -= 1;
  if (phase >= 2) { out.conditioning -= 1; out.conductivity += 1; }
  if (phase >= 3) out.composure -= 2;
  if (phase >= 4) out.acuity += 1;
  if (phase >= 6) out.resilience += 1;
  for (const key of Object.keys(out) as AttributeKey[]) out[key] = Math.max(0, Math.round(out[key] * 10) / 10);
  return out;
}

export function mergeEffects(effects: NodeEffect[]): NodeEffect {
  const sum: NodeEffect = {};
  for (const effect of effects) {
    for (const [key, value] of Object.entries(effect)) {
      // Display-only keys (the hand-written `world` lines) never sum.
      if (typeof value !== "number" && typeof value !== "boolean") continue;
      if (typeof value === "boolean") { (sum as Record<string, unknown>)[key] = ((sum as Record<string, unknown>)[key] as boolean) || value; continue; }
      const multiplicative = key === "incoming" || key === "castCost" || key === "enemyCastCost";
      const current = (sum as Record<string, number>)[key];
      (sum as Record<string, number>)[key] = multiplicative
        ? (current === undefined ? 1 : current) * (value as number)
        : (current ?? 0) + (value as number);
    }
  }
  return sum;
}

export function hitsBeforeDown(character: SimCharacter): number {
  return 2 + Math.floor(character.attributes.resilience / 2) + (character.effects.toughness ?? 0);
}

export function resourceCeiling(character: SimCharacter): number {
  const { origin, attributes, level, effects } = character;
  if (origin.economy === "pool") return Math.round(8 + level * 0.35 + 2 * attributes.conductivity + (effects.resourceCap ?? 0));
  if (origin.economy === "charges") {
    const perDose = 4; // standard rig: three lit, two delivered  a full dose of five lands four
    const doses = 3 + (character.professions.reduce((sum, p) => sum + (p.effects.extraDoses ?? 0), 0));
    return Math.round(doses * perDose + (effects.resourceCap ?? 0));
  }
  return 0;
}

export function reset(character: SimCharacter) {
  character.wounds = 0;
  character.bleeding = 0;
  character.down = false;
  character.dead = false;
  character.dying = 0;
  character.usedOnce = new Set();
  character.refusedDown = false;
  character.burstUsed = false;
  character.resourceMax = resourceCeiling(character);
  character.resource = character.resourceMax;
  character.plates = 2 + (character.effects.extraPlates ?? 0) + character.professions.reduce((sum, p) => sum + (p.effects.extraPlates ?? 0), 0);
  const ammoMultiplier = (character.effects.ammo ?? 0) + character.professions.reduce((sum, p) => sum + ((p.effects.ammoMultiplier ?? 1) - 1), 0);
  character.ammo = Math.round(30 * (1 + ammoMultiplier));
}

/** What one attack costs after talents and a fitted rig both take their cut. */
function costOf(character: SimCharacter, attack: AttackProfile): number {
  const relief = character.professions.reduce((sum, p) => sum + (p.effects.castCostRelief ?? 0), 0);
  return Math.max(1, Math.round(attack.cost * (character.effects.castCost ?? 1) * Math.max(0.5, 1 - relief)));
}

function affordable(character: SimCharacter, attack: AttackProfile): boolean {
  if (attack.onceOnly && character.usedOnce.has(attack.name)) return false;
  const cost = costOf(character, attack);
  if (attack.costs === "pool" || attack.costs === "charges") return character.resource >= cost;
  if (attack.costs === "ammo") return character.ammo >= cost;
  return true;
}

function spend(character: SimCharacter, attack: AttackProfile) {
  const cost = costOf(character, attack);
  if (attack.costs === "pool" || attack.costs === "charges") character.resource -= cost;
  else if (attack.costs === "ammo") character.ammo -= cost;
  if (attack.onceOnly) character.usedOnce.add(attack.name);
}

/** The best thing this character can still do, or null when dry. */
export function chooseAttack(character: SimCharacter): AttackProfile | null {
  const usable = character.attacks.filter((attack) => affordable(character, attack));
  if (!usable.length) return null;
  return usable.reduce((best, attack) => (attack.wounds > best.wounds ? attack : best), usable[0]);
}

/**
 * One attack resolved. Returns the wounds that actually landed.
 *
 * The damage-type table is canon's: a plate stops one hit and is gone; FIRE
 * ignores half a plate; ELECTRICAL goes through to whatever conducts, which
 * only matters to somebody carrying chrome; ARCANE ignores the plate
 * entirely; TOXIC does not care about the plate and is resisted by the body.
 */
export function resolveAttack(attacker: SimCharacter, defender: SimCharacter, attack: AttackProfile, rng: () => number): number {
  // Concealment is not only about who gets picked: a person you cannot hold
  // in your eye is a person you shoot worse at, even when they are the only
  // one in the room. Detection reads back through it.
  const unseen = Math.max(0, (defender.effects.concealment ?? 0) - (attacker.effects.detection ?? 0));
  const evasion = (defender.attributes.coordination + defender.attributes.acuity) / 2;
  const aim = attacker.attributes.coordination + (attacker.effects.accuracy ?? 0) * 10;
  const chance = Math.max(0.1, Math.min(0.94, attack.accuracy + (aim - evasion) * 0.035 - unseen * 0.55));
  if (rng() > chance) return 0;

  let wounds = attack.wounds + (attacker.effects.damageBonus ?? 0);
  if (attack.type === "TOXIC" && rng() < defender.attributes.resilience * 0.06) return 0;

  const platesMatter = !attack.ignoresPlates && attack.type !== "ARCANE" && attack.type !== "TOXIC";
  if (platesMatter && defender.plates > 0) {
    const stopped = attack.type === "FIRE" ? rng() < 0.5 : attack.type === "ELECTRICAL" ? !defender.effects.chrome || Boolean(defender.effects.hardenedChrome) : true;
    if (stopped) { defender.plates -= 1; return 0; }
  }
  if (attack.type === "ELECTRICAL" && defender.effects.chrome && !defender.effects.hardenedChrome) {
    wounds += 1; // vented chrome is a limb that does not answer
  }

  // Talents first, then the ground somebody built to stand on.
  const prepared = defender.professions.reduce((sum, p) => sum + (p.effects.damageReduction ?? 0), 0);
  wounds = Math.max(0, wounds * (defender.effects.incoming ?? 1) * Math.max(0.5, 1 - prepared));
  defender.wounds += wounds;
  if (attack.bleeds) defender.bleeding += 1;
  return wounds;
}

/**
 * One integrator tick of continuous state: bleeds seep, self-repair mends,
 * and the Dying clock runs down in real seconds. Per-beat probabilities are
 * converted through perTick() so the expected rates are identical no matter
 * the step size.
 *
 * The Down TRANSITION is the caller's business when `checkDown` is false:
 * fight() grants a body past its threshold the rest of its current exchange
 * (it fires the shot it was already committing, then drops). Damage in this
 * model travels in whole-exchange packets, and letting death interrupt
 * mid-packet silently hands every duel to whoever fires first — which is
 * not what the wound model says.
 */
export function tickState(character: SimCharacter, rng: () => number, checkDown = true) {
  if (character.dead) return;
  if (character.bleeding > 0 && rng() < perTick(0.5)) character.wounds += 0.5 * character.bleeding;
  if ((character.effects.selfRepair ?? 0) > 0 && rng() < perTick(character.effects.selfRepair ?? 0)) {
    character.wounds = Math.max(0, character.wounds - 1);
    character.bleeding = Math.max(0, character.bleeding - 1);
  }
  if (checkDown && !character.down && character.wounds >= hitsBeforeDown(character)) {
    if (character.effects.refuseDown && !character.refusedDown) {
      character.refusedDown = true;
      character.wounds = hitsBeforeDown(character) - 1;
    } else {
      character.down = true;
      // The Dying clock, in seconds: canon's base window plus what the body,
      // the talents and the party's trades add to it.
      character.dying = (3 + Math.floor(character.attributes.resilience / 3)) * BEAT_SECONDS
        + (character.effects.dyingClock ?? 0)
        + character.professions.reduce((sum, p) => sum + (p.effects.partyDyingClock ?? 0), 0);
    }
  }
  if (character.down) {
    character.dying -= TICK_SECONDS;
    if (character.dying <= 0) character.dead = true;
  }
}

/**
 * What a night's rest and a working party do between two fights.
 *
 * This is where canon's two casting economies finally differ: a born
 * caster's pool comes back from sleep and a real meal, and an infused
 * caster's charges come back only from the next dose  which is a finite
 * number carried into the day. A Returnee mends at half pace, which no
 * single fight can show.
 */
export function recover(character: SimCharacter, hoursOfCare = 1) {
  if (character.dead) return;
  const trades = character.professions.reduce((sum, p) => sum + (p.effects.partyRecovery ?? 0), 0);
  // Hours between engagements, not a night's sleep: most of a body back,
  // and a Returnee gets half of what everyone else does. At Turning nobody
  // billets with you, and care that will not touch you is half care.
  const billeted = character.phase >= 6 ? 0.5 : 1;
  const care = (hitsBeforeDown(character) * 0.45 + trades) * character.species.mendPace * billeted * hoursOfCare;
  character.wounds = Math.max(0, character.wounds - care);
  character.bleeding = 0;
  character.down = false;
  character.dying = 0;
  character.usedOnce = new Set();
  character.refusedDown = false;
  character.plates = Math.min(character.plates + 1, 2 + (character.effects.extraPlates ?? 0) + character.professions.reduce((sum, p) => sum + (p.effects.extraPlates ?? 0), 0));
  const ammoMultiplier = (character.effects.ammo ?? 0) + character.professions.reduce((sum, p) => sum + ((p.effects.ammoMultiplier ?? 1) - 1), 0);
  character.ammo = Math.min(Math.round(30 * (1 + ammoMultiplier)), character.ammo + Math.round(12 * (1 + ammoMultiplier)));
  // A cook's real meal and a chemist's tonic are the two things in the world
  // that put a pool back faster than rest does.
  const poured = character.professions.reduce((sum, p) => sum + (p.effects.poolRestore ?? 0), 0);
  if (character.origin.economy === "pool") {
    // Sleep is full; a real meal is a quarter. A fight-to-fight lull is neither.
    character.resource = Math.min(character.resourceMax, character.resource + character.resourceMax * (0.45 + poured));
  } else if (character.origin.economy === "charges" && poured > 0) {
    // Charges do not come back on their own — but a tonic is not a charge,
    // and an infused caster can drink one like anybody else.
    character.resource = Math.min(character.resourceMax, character.resource + character.resourceMax * poured);
  }
  // Otherwise charges do not come back. Only the next dose does, and the
  // doses were counted into the ceiling when the day started.
}

export type FightResult = {
  winner: "a" | "b" | "draw";
  /** Wall-clock length of the engagement, in seconds. */
  seconds: number;
  aDry: boolean; bDry: boolean;
  /** Second at which side A's first body hit the floor, or null. */
  aDownAt: number | null;
  /** Attacks side A committed with a worse weapon than their best, because
   * the better one was unaffordable — canon's person with a rifle. */
  aDegraded: number;
  /** Total attacks side A committed. */
  aActions: number;
};

/**
 * One engagement between two sides on a continuous clock. A side is one or
 * more characters; `fresh` false continues a day already in progress.
 *
 * No rounds: every fighter runs their own attack timer. The base cadence is
 * one committed attack per BEAT_SECONDS, sped up by action tempo; readiness
 * (initiative) decides how soon the first shot comes. Bonded bodies fight
 * on their own timers at their own strength. State — bleeds, repair, the
 * Dying clock — integrates every TICK_SECONDS, the way a server ticks.
 */
export function fight(sideA: SimCharacter[], sideB: SimCharacter[], rng: () => number, maxSeconds = 75, fresh = true): FightResult {
  for (const character of [...sideA, ...sideB]) if (fresh || character.classSlug === "enemy") reset(character);
  let aDry = false, bDry = false, aDownAt: number | null = null, aDegraded = 0, aActions = 0;

  const standing = (side: SimCharacter[]) => side.filter((c) => !c.down && !c.dead);

  // Readiness: the better-drilled side clears leather sooner. The gap in
  // coordination-plus-readiness converts to a head start in fractions of a
  // beat, capped at half a beat — worth what shooting first used to be.
  const readiness = (side: SimCharacter[]) => side.reduce((sum, c) => sum + c.attributes.coordination + (c.effects.initiative ?? 0) * 10, 0) / side.length;
  const halfBeat = BEAT_SECONDS / 2;
  const READY_SCALE = 0.05;
  const readyGap = Math.max(-halfBeat, Math.min(halfBeat, (readiness(sideB) - readiness(sideA)) * READY_SCALE));
  const firstShotDelay = (side: "a" | "b") => 0.5 + Math.max(0, side === "a" ? readyGap : -readyGap);

  type Fighter = { side: "a" | "b"; actor: SimCharacter; nextAttackAt: number; nextMinionAt: number };
  // Bonded bodies are already on the field when it starts — a flock does not
  // wait for its keeper's draw — so their first strike shares the readiness
  // window instead of trailing it.
  const fighters: Fighter[] = [
    ...sideA.map((actor) => ({ side: "a" as const, actor, nextAttackAt: firstShotDelay("a"), nextMinionAt: firstShotDelay("a") })),
    ...sideB.map((actor) => ({ side: "b" as const, actor, nextAttackAt: firstShotDelay("b"), nextMinionAt: firstShotDelay("b") })),
  ];

  const attackPeriod = (actor: SimCharacter) => BEAT_SECONDS / (1 + (actor.effects.extraAction ?? 0));
  /** Fighters past their threshold, and the second their fall completes. */
  const falling = new Map<SimCharacter, number>();

  const commitAttack = (side: "a" | "b", actor: SimCharacter): void => {
    const allies = side === "a" ? sideA : sideB;
    const live = standing(side === "a" ? sideB : sideA);
    if (!live.length) return;

    // A medic pulls somebody off the floor before doing anything else.
    const fallen = allies.find((c) => c.down && !c.dead);
    if (fallen && (actor.effects.partyHeal ?? 0) > 0 && rng() < 0.7) {
      fallen.down = false;
      fallen.wounds = Math.max(0, hitsBeforeDown(fallen) - 1 - (actor.effects.partyHeal ?? 0));
      return;
    }

    // Concealment decides who gets shot at: the unseen are chosen last.
    const visible = live.filter((c) => rng() > (c.effects.concealment ?? 0) - (actor.effects.detection ?? 0));
    const target = (visible.length ? visible : live)[Math.floor(rng() * (visible.length ? visible.length : live.length))];

    if ((actor.effects.control ?? 0) > 0 && rng() < (actor.effects.control ?? 0)) { target.plates = Math.max(0, target.plates - 1); }
    const attack = chooseAttack(actor);
    if (!attack) { if (side === "a") aDry = true; else bDry = true; return; }
    if (side === "a") {
      aActions += 1;
      const best = actor.attacks.reduce((top, candidate) => (candidate.wounds > top.wounds ? candidate : top), actor.attacks[0]);
      if (attack.wounds < best.wounds) aDegraded += 1;
    }
    spend(actor, attack);
    const landed = resolveAttack(actor, target, attack, rng);
    if (landed > 0 && (actor.effects.resourcePerHit ?? 0) > 0) {
      actor.resource = Math.min(actor.resourceMax, actor.resource + (actor.effects.resourcePerHit ?? 0));
    }
  };

  const minionStrike = (side: "a" | "b", actor: SimCharacter): void => {
    // A bonded body: its own claws or bullets, free, and weaker — a drone is
    // a body on the field, never a second copy of the person who built it.
    const live = standing(side === "a" ? sideB : sideA);
    if (!live.length) return;
    const target = live[Math.floor(rng() * live.length)];
    const bite: AttackProfile = { name: "Bonded body", type: "PHYSICAL", wounds: 1, accuracy: 0.55, cost: 0, costs: "none" };
    const minion: SimCharacter = { ...actor, effects: { accuracy: actor.effects.accuracy, damageBonus: (actor.effects.damageBonus ?? 0) * 0.35 } };
    resolveAttack(minion, target, bite, rng);
  };

  for (let now = TICK_SECONDS; now <= maxSeconds; now += TICK_SECONDS) {
    for (const fighter of fighters) {
      const { side, actor } = fighter;
      if (actor.down || actor.dead) continue;
      if (!standing(side === "a" ? sideB : sideA).length) continue;

      if (now >= fighter.nextAttackAt) {
        fighter.nextAttackAt = now + attackPeriod(actor);
        commitAttack(side, actor);
      }
      const minionCount = Math.round(actor.effects.minions ?? 0);
      if (minionCount > 0 && now >= fighter.nextMinionAt) {
        fighter.nextMinionAt = now + BEAT_SECONDS;
        for (let m = 0; m < minionCount; m++) minionStrike(side, actor);
      }
    }

    // Continuous integration every tick; the Down transition is handled
    // here. A body that crosses its threshold is FALLING: it completes the
    // exchange it was already committing — its next queued attack, at most
    // one beat away — and then it drops. Order-independent, so neither side
    // buys kills purely by phase against the clock.
    for (const character of [...sideA, ...sideB]) {
      tickState(character, rng, false);
      const threshold = hitsBeforeDown(character);
      if (!character.down && !character.dead && character.wounds >= threshold) {
        if (!falling.has(character)) {
          const own = fighters.find((f) => f.actor === character);
          falling.set(character, Math.min(own ? own.nextAttackAt : now, now + BEAT_SECONDS));
        }
        if (now >= (falling.get(character) ?? now)) {
          falling.delete(character);
          if (character.effects.refuseDown && !character.refusedDown) {
            character.refusedDown = true;
            character.wounds = threshold - 1;
          } else {
            character.down = true;
            character.dying = (3 + Math.floor(character.attributes.resilience / 3)) * BEAT_SECONDS
              + (character.effects.dyingClock ?? 0)
              + character.professions.reduce((sum, p) => sum + (p.effects.partyDyingClock ?? 0), 0);
            if (sideA.includes(character) && aDownAt === null) aDownAt = now;
          }
        }
      } else if (character.wounds < threshold) {
        falling.delete(character); // mended back over the line mid-fall
      }
      if (character.down && (character.effects.resourcePerWound ?? 0) > 0) character.resource = Math.min(character.resourceMax, character.resource);
    }

    // Victory is declared on beat boundaries only, after every pending fall
    // has matured — otherwise a fraction of a second of head start converts
    // every mutual kill into a clean win for whoever fired first, which the
    // wound model never intended.
    const boundary = Math.round(now / TICK_SECONDS) % Math.round(BEAT_SECONDS / TICK_SECONDS) === 0;
    if (boundary || now >= maxSeconds) {
      if (!standing(sideA).length && !standing(sideB).length) return { winner: "draw", seconds: now, aDry, bDry, aDownAt, aDegraded, aActions };
      if (!standing(sideB).length) return { winner: "a", seconds: now, aDry, bDry, aDownAt, aDegraded, aActions };
      if (!standing(sideA).length) return { winner: "b", seconds: now, aDry, bDry, aDownAt, aDegraded, aActions };
    }
  }
  // A fight nobody can finish is decided by who is closer to the floor.
  const health = (side: SimCharacter[]) => side.reduce((sum, c) => sum + (hitsBeforeDown(c) - c.wounds), 0);
  const gap = health(sideA) - health(sideB);
  return { winner: gap > 0.5 ? "a" : gap < -0.5 ? "b" : "draw", seconds: maxSeconds, aDry, bDry, aDownAt, aDegraded, aActions };
}
