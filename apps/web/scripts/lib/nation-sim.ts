/**
 * The Nation Management balance model — "Holding Ground" spec, sim pass 1.
 *
 * A deliberately small world-game: five Great Powers with equal starting
 * totals and different shapes, a neutral belt of claimable sites, institution
 * seats that auction influence, a Free Powers bloc that only defends, sacred
 * sites that can be held but never owned, sieges resolved as Forge clocks,
 * faith pressure and morale, monthly Court Day events, and nation XP with
 * ceiling gates.
 *
 * Everything is a knob on purpose; canon constants are marked CANON.
 * Time is simulated per world-day (the 96-minute day); a month is 30 days.
 */

export type Axis = "military" | "tech" | "magic" | "wealth" | "resources" | "territory";
export const AXES: Axis[] = ["military", "tech", "magic", "wealth", "resources", "territory"];

export type Faith = "first-gift" | "rites" | "forgefaith" | "old-roads" | "communion" | "secular";
export const FAITHS: Faith[] = ["first-gift", "rites", "forgefaith", "old-roads", "communion", "secular"];

export type PowerId = "ndd" | "aegis" | "pearl" | "floating" | "ossuary" | "player";

/** mulberry32 — deterministic, per-seed. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// CANON: reclamation cost = 35 to build a body + 11.7 per level (early ~47, developed ~386).
export const reclaimCost = (level: number) => 35 + 11.7 * level;

/** Machine upkeep: Essence per machine per day, just to run. "Very very small
 *  unless you have a huge robot army just sitting around" (owner). */
export const MACHINE_UPKEEP = 0.05;

export interface Site {
  id: string;
  owner: PowerId | "neutral" | "free" | "institution";
  tier: 1 | 2 | 3 | 4 | 5;            // rung: homestead..city
  yields: Partial<Record<Axis, number>>; // points/day contribution by axis
  income: number;                       // coin/day
  essence: number;                      // essence/day toward the forge reserve
  forgeReserve: number;
  forgeCap: number;
  garrison: number;                     // living bodies (reclaim on death — the Forge clock)
  garrisonLevel: number;                // avg level (reclaim cost driver)
  /** Owner ruling: soulless machines. No Forge, no reclamation — destroyed is
   *  destroyed. Instead they SIP the same Essence daily as upkeep to run. */
  machines: number;
  walls: number;                        // attrition shield
  sacred: boolean;
  shielded: boolean;                    // hard story shield
  institutionSeat: string | null;
  faith: Record<Faith, number>;         // population shares, sum 1
  morale: number;                       // 0..1 multiplier on yields
  grievance: number;                    // accumulates while sacred+held by a power
  homeOf: PowerId | null;
}

export interface Campaign {
  attacker: PowerId;
  siteId: string;
  army: number;
  armyLevel: number;
  supplySpent: number;
  days: number;
  /** Owner ruling (sim decision 2): STORM is fast with burn risk; WAIT starves
   *  the Forge clock for the intact prize. */
  posture: "storm" | "wait";
}

export interface Power {
  id: PowerId;
  shape: Record<Axis, number>;          // identity weights (sum 1)
  aggression: number;                   // 0..1 launch appetite
  focus: "expand" | "consolidate" | "trade";
  faith: Faith;
  coin: number;
  essencePool: number;
  campaigns: Campaign[];
  pacts: Set<PowerId>;
  grudges: Map<PowerId, number>;
  xp: number;
  level: number;
  ceilingBlocked: boolean;              // waiting on a ceiling quest
  ceilingsBroken: number;
  eliminated: boolean;
}

export interface World {
  day: number;
  sites: Map<string, Site>;
  powers: Map<PowerId, Power>;
  institutionsInfluence: Map<string, PowerId | null>; // seat -> current patron
  log: string[];
  coalitionRule: boolean;               // balance-of-power coalitions vs the leader
  events: { windfalls: number; disasters: number; comedies: number };
}

const POWER_DEFS: Array<{ id: PowerId; faith: Faith; aggression: number; focus: Power["focus"]; shape: Partial<Record<Axis, number>> }> = [
  { id: "ndd", faith: "secular", aggression: 0.62, focus: "expand", shape: { military: 0.4, territory: 0.2, resources: 0.15, wealth: 0.1, tech: 0.1, magic: 0.05 } },
  { id: "aegis", faith: "secular", aggression: 0.45, focus: "consolidate", shape: { resources: 0.3, magic: 0.2, tech: 0.15, wealth: 0.2, military: 0.1, territory: 0.05 } },
  { id: "pearl", faith: "old-roads", aggression: 0.5, focus: "trade", shape: { wealth: 0.4, military: 0.15, tech: 0.1, resources: 0.15, territory: 0.1, magic: 0.1 } },
  { id: "floating", faith: "forgefaith", aggression: 0.35, focus: "consolidate", shape: { tech: 0.4, wealth: 0.2, magic: 0.15, military: 0.1, resources: 0.1, territory: 0.05 } },
  { id: "ossuary", faith: "rites", aggression: 0.48, focus: "expand", shape: { magic: 0.3, wealth: 0.25, military: 0.15, territory: 0.15, resources: 0.1, tech: 0.05 } },
];

const FAITH_PERK: Record<Faith, { moraleBonus: number; note: string }> = {
  "first-gift": { moraleBonus: 0.05, note: "gifted thrive; harvest restricted (essence income -20%)" },
  rites: { moraleBonus: 0.0, note: "the dead work (+garrison), growth slow" },
  forgefaith: { moraleBonus: 0.05, note: "cheap reclamation; forge loss catastrophic" },
  "old-roads": { moraleBonus: 0.04, note: "routes blessed (+coin); customs bind" },
  communion: { moraleBonus: -0.02, note: "blood pays now; debt compounds" },
  secular: { moraleBonus: 0.0, note: "no price, no perk; devout pops chafe" },
};

/** Owner ruling (sim decision 2): reserves are sized in SUSTAINED-DAYS — how
 *  long the Forge can pay full siege casualties — so the clock is the dial. */
export function reserveForDays(days: number, garrisonLevel: number) {
  const dailyBodies = 13; // typical full-siege casualty rate in this model
  return Math.round(days * dailyBodies * reclaimCost(garrisonLevel));
}

function makeSite(id: string, partial: Partial<Site>): Site {
  return {
    id,
    owner: "neutral",
    tier: 2,
    yields: {},
    income: 4,
    essence: 2,
    forgeReserve: reserveForDays(4, 8),
    forgeCap: reserveForDays(6, 8),
    garrison: 60,
    garrisonLevel: 8,
    machines: 0,
    walls: 1,
    sacred: false,
    shielded: false,
    institutionSeat: null,
    faith: { "first-gift": 0.1, rites: 0.15, forgefaith: 0.3, "old-roads": 0.25, communion: 0.02, secular: 0.18 },
    morale: 1,
    grievance: 0,
    homeOf: null,
    ...partial,
  };
}

/** Build a world. Each Great Power's home cluster is shaped by its identity,
 *  then every power's total points are normalized to exactly the same start. */
export function makeWorld(seed: number, opts?: { coalitionRule?: boolean; withPlayer?: boolean }): World {
  const rand = rng(seed);
  const sites = new Map<string, Site>();
  const powers = new Map<PowerId, Power>();

  for (const def of POWER_DEFS) {
    const shape = Object.fromEntries(AXES.map((a) => [a, def.shape[a] ?? 0])) as Record<Axis, number>;
    powers.set(def.id, {
      id: def.id, shape, aggression: def.aggression, focus: def.focus, faith: def.faith,
      coin: 300, essencePool: 300, campaigns: [], pacts: new Set(), grudges: new Map(),
      xp: 0, level: 1, ceilingBlocked: false, ceilingsBroken: 0, eliminated: false,
    });
    // Home cluster: capital(t4) + 2 towns + 2 forts. Yields lean into the shape.
    const lean = (axis: Axis, base: number) => base * (0.5 + 2.5 * shape[axis]);
    for (let i = 0; i < 5; i++) {
      const tier = (i === 0 ? 4 : i < 3 ? 3 : 2) as Site["tier"];
      sites.set(`${def.id}-h${i}`, makeSite(`${def.id}-h${i}`, {
        owner: def.id, tier, homeOf: def.id,
        yields: Object.fromEntries(AXES.map((a) => [a, lean(a, tier * 1.2)])),
        income: tier * 4, essence: tier * 1.6,
        forgeReserve: reserveForDays(tier * 2.5, 8 + tier * 2), forgeCap: reserveForDays(tier * 3.5, 8 + tier * 2),
        garrison: 70 * tier, garrisonLevel: 8 + tier * 2, walls: tier * 0.9,
        shielded: i === 0, // capitals are story-shielded in this pass
        faith: homeFaith(def.faith),
      }));
    }
  }

  // Neutral belt: 14 claimable sites, mixed value.
  for (let i = 0; i < 14; i++) {
    const tier = (1 + Math.floor(rand() * 3)) as Site["tier"];
    sites.set(`belt-${i}`, makeSite(`belt-${i}`, {
      tier, yields: Object.fromEntries(AXES.map((a) => [a, (0.6 + rand()) * tier])),
      income: tier * 3, essence: tier * 1.2, garrison: 35 * tier, garrisonLevel: 6 + tier, walls: tier * 0.6,
    }));
  }

  // Institution seats: courted for influence; conquerable, defended decently.
  for (const seat of ["stormglass", "church", "inst-a", "inst-b"]) {
    sites.set(`seat-${seat}`, makeSite(`seat-${seat}`, {
      owner: "institution", institutionSeat: seat, tier: 3,
      yields: { wealth: 4, tech: 3, magic: 3, resources: 3, military: 2, territory: 2 },
      income: 14, essence: 3, garrison: 220, garrisonLevel: 12, walls: 2.4,
      forgeReserve: reserveForDays(8, 12), forgeCap: reserveForDays(10, 12),
    }));
  }

  // Free Powers bloc: 6 sites; never expands; the whole bloc answers an attack.
  for (let i = 0; i < 6; i++) {
    sites.set(`free-${i}`, makeSite(`free-${i}`, {
      owner: "free", tier: 2, yields: { territory: 4, resources: 3 },
      income: 4, essence: 1.5, garrison: 150, garrisonLevel: 10, walls: 1.4,
      forgeReserve: reserveForDays(8, 10), forgeCap: reserveForDays(10, 10),
      sacred: i === 0, // the Standing Camp analogue
    }));
  }

  const world: World = {
    day: 0, sites, powers,
    institutionsInfluence: new Map([["stormglass", null], ["church", null], ["inst-a", null], ["inst-b", null]]),
    log: [], coalitionRule: opts?.coalitionRule ?? true,
    events: { windfalls: 0, disasters: 0, comedies: 0 },
  };

  // EQUAL START (owner law): scale every power's home yields so totals match.
  const totals = new Map<PowerId, number>();
  for (const p of powers.keys()) totals.set(p, computePoints(world, p).total);
  const target = Math.max(...totals.values());
  for (const [pid, total] of totals) {
    const scale = target / total;
    for (const site of sites.values()) {
      if (site.owner === pid) for (const a of AXES) site.yields[a] = (site.yields[a] ?? 0) * scale;
    }
  }
  return world;
}

function homeFaith(faith: Faith): Record<Faith, number> {
  const base: Record<Faith, number> = { "first-gift": 0.08, rites: 0.1, forgefaith: 0.25, "old-roads": 0.2, communion: 0.02, secular: 0.35 };
  if (faith !== "secular") { base[faith] = Math.min(0.55, base[faith] + 0.3); base.secular = Math.max(0.05, base.secular - 0.3); }
  return normalizeFaith(base);
}
function normalizeFaith(f: Record<Faith, number>): Record<Faith, number> {
  const sum = FAITHS.reduce((s, k) => s + f[k], 0);
  for (const k of FAITHS) f[k] = f[k] / sum;
  return f;
}

/** The scoreboard: points per axis from holdings, morale-scaled. */
export function computePoints(world: World, pid: PowerId) {
  const byAxis = Object.fromEntries(AXES.map((a) => [a, 0])) as Record<Axis, number>;
  for (const site of world.sites.values()) {
    if (site.owner !== pid) continue;
    for (const a of AXES) byAxis[a] += (site.yields[a] ?? 0) * site.morale;
    byAxis.territory += site.tier * 2 * site.morale;
    byAxis.military += site.garrison * 0.05;
  }
  const power = world.powers.get(pid)!;
  byAxis.wealth += power.coin * 0.02;
  byAxis.military += power.campaigns.reduce((s, c) => s + c.army * 0.05, 0);
  const total = AXES.reduce((s, a) => s + byAxis[a], 0);
  return { byAxis, total };
}

/** Faith & morale drift, per day. Conversion is deliberately generational. */
function faithTick(world: World, convertRate: number) {
  for (const site of world.sites.values()) {
    if (site.owner === "neutral" || site.owner === "institution") continue;
    const owner = typeof site.owner === "string" && world.powers.has(site.owner as PowerId) ? world.powers.get(site.owner as PowerId)! : null;
    if (owner) {
      const crown = owner.faith;
      // Crown pressure: slow conversion toward the crown's faith (or secular).
      for (const f of FAITHS) {
        const toward = f === crown ? convertRate : -convertRate * site.faith[f] * 0.2;
        site.faith[f] = Math.max(0, site.faith[f] + (f === crown ? toward * (1 - site.faith[f]) : toward));
      }
      normalizeFaith(site.faith);
      // Morale: devout share that mismatches the crown chafes; secular crown over devout pop chafes most.
      const devoutMismatch = FAITHS.filter((f) => f !== crown && f !== "secular").reduce((s, f) => s + site.faith[f], 0);
      const secularPenalty = crown === "secular" ? (1 - site.faith.secular) * 0.25 : devoutMismatch * 0.15;
      const perk = FAITH_PERK[crown].moraleBonus * (crown === "secular" ? 0 : site.faith[crown]);
      site.morale = clamp(1 - secularPenalty + perk - site.grievance * 0.02, 0.5, 1.15);
      if (site.sacred && site.homeOf !== site.owner) site.grievance += 0.02; // unkeepable law
      else site.grievance = Math.max(0, site.grievance - 0.01);
    }
  }
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** Siege as a Forge clock. Returns true when the site falls. CANON: the
 *  defender stops coming back when the reserve runs dry; a site taken with its
 *  Core intact (fell by reserve-dry) is worth far more than one stormed. */
function siegeTick(world: World, campaign: Campaign, rand: () => number): "ongoing" | "fell-intact" | "fell-stormed" | "broken" {
  const site = world.sites.get(campaign.siteId)!;
  const attacker = world.powers.get(campaign.attacker)!;
  campaign.days += 1;

  // Posture (owner ruling): storm hits harder and bleeds harder; wait blockades
  // the clock — less pressure, fewer losses, cheaper days, longer siege.
  const storm = campaign.posture === "storm";
  const totalDefenders = site.garrison + site.machines;
  const attackPower = campaign.army * (0.8 + rand() * 0.4) * (storm ? 1.6 : 0.75);
  const defensePower = totalDefenders * (1 + site.walls * 0.35) * (0.8 + rand() * 0.4);

  const defLosses = Math.min(totalDefenders, attackPower * 0.05);
  const attLosses = Math.min(campaign.army, defensePower * 0.04 * (storm ? 1.25 : 0.6));
  campaign.army -= attLosses;

  // Losses split across the wall. Machines are destroyed outright — no Forge,
  // no reclamation. The living reclaim while the reserve pays (CANON curve).
  const machineShare = totalDefenders > 0 ? site.machines / totalDefenders : 0;
  const machineDead = defLosses * machineShare;
  site.machines = Math.max(0, site.machines - machineDead);

  const cost = reclaimCost(site.garrisonLevel);
  let dead = defLosses - machineDead;
  while (dead > 1 && site.forgeReserve >= cost) {
    site.forgeReserve -= cost;
    dead -= 1; // this body comes back to the wall
  }
  site.garrison = Math.max(0, site.garrison - dead);

  // The machines sip the same Essence daily, siege or no siege.
  site.forgeReserve = Math.max(0, site.forgeReserve - site.machines * MACHINE_UPKEEP);

  // Supply: sieges eat coin every day; assault logistics cost more.
  const supply = campaign.army * (storm ? 0.08 : 0.05);
  attacker.coin -= supply;
  campaign.supplySpent += supply;

  if (campaign.army < 25 || attacker.coin < 0) return "broken";
  if (site.garrison + site.machines <= 5) {
    // Fell. Intact if the clock (reserve) ran dry; stormed otherwise.
    return site.forgeReserve < cost ? "fell-intact" : "fell-stormed";
  }
  return "ongoing";
}

export interface DayLog { day: number; totals: Record<PowerId, number>; leader: PowerId }

/** One world-day for the whole game. */
export function tick(world: World, rand: () => number, opts?: { convertRate?: number }) {
  world.day += 1;

  // Income + reserve regen.
  for (const site of world.sites.values()) {
    if (typeof site.owner === "string" && world.powers.has(site.owner as PowerId)) {
      const p = world.powers.get(site.owner as PowerId)!;
      p.coin += site.income * site.morale;
      p.essencePool += site.essence * site.morale;
    }
    if (site.forgeReserve < site.forgeCap) {
      const owner = world.powers.get(site.owner as PowerId);
      if (owner && owner.essencePool > 2) { owner.essencePool -= 2; site.forgeReserve = Math.min(site.forgeCap, site.forgeReserve + 2); }
    }
  }

  // Owner ruling (sim decision 3): conversion tuned ~6x faster — half-life
  // lands in the 12–18 world-month band; shrines/tree/suppression multiply it.
  faithTick(world, opts?.convertRate ?? 0.0024);

  // Sieges.
  for (const p of world.powers.values()) {
    if (p.eliminated) continue;
    p.campaigns = p.campaigns.filter((c) => {
      const site = world.sites.get(c.siteId)!;
      const result = siegeTick(world, c, rand);
      if (result === "ongoing") return true;
      if (result === "broken") {
        world.log.push(`d${world.day} ${p.id} broke off siege of ${c.siteId} (${c.days}d)`);
        // Owner ruling (sim decision 4): governance XP is REAL work — a stood siege counts for the defender.
        if (typeof site.owner === "string" && world.powers.has(site.owner as PowerId)) world.powers.get(site.owner as PowerId)!.xp += site.tier * 20;
        return false;
      }
      const priorOwner = site.owner;
      site.owner = p.id;
      site.garrison = Math.max(30, Math.floor(c.army * 0.4));
      site.garrisonLevel = c.armyLevel;
      if (result === "fell-stormed") {
        site.forgeReserve = Math.floor(site.forgeReserve * 0.25);
        for (const a of AXES) site.yields[a] = (site.yields[a] ?? 0) * 0.6; // burned value
        site.morale = 0.6;
      } else {
        site.morale = 0.8;
      }
      p.xp += site.tier * 40;
      if (typeof priorOwner === "string" && world.powers.has(priorOwner as PowerId)) {
        const enemy = world.powers.get(priorOwner as PowerId)!;
        enemy.grudges.set(p.id, (enemy.grudges.get(p.id) ?? 0) + 2);
      }
      if (priorOwner === "free") {
        // The whole desert comes: every free site retaliates as one bloc.
        world.log.push(`d${world.day} ${p.id} seized free-bloc ${c.siteId} — the bloc answers`);
        for (const s of world.sites.values()) if (s.owner === "free") s.garrison += 120;
        p.grudges.set(p.id, 0);
      }
      world.log.push(`d${world.day} ${p.id} took ${c.siteId} (${result}, ${c.days}d, supply ${Math.round(c.supplySpent)})`);
      return false;
    });
  }

  // Decisions every 5 days.
  if (world.day % 5 === 0) {
    const totals = new Map([...world.powers.keys()].map((pid) => [pid, computePoints(world, pid).total]));
    const leader = [...totals.entries()].sort((a, b) => b[1] - a[1])[0]![0];
    for (const p of world.powers.values()) {
      if (p.eliminated || p.campaigns.length >= 2) continue;
      if (p.ceilingBlocked) {
        // A ceiling quest: abstracted as a coin+time payment.
        if (p.coin > 180) { p.coin -= 180; p.ceilingBlocked = false; p.ceilingsBroken += 1; p.level += 1; p.xp = 0; }
        continue;
      }
      // Level & ceilings: XP thresholds; every 3rd level is a ceiling.
      // Owner ruling (sim decision 4): a VERY steep curve — each level costs 1.6x the last.
      const need = Math.round(200 * Math.pow(1.6, p.level - 1));
      if (p.xp >= need) {
        if ((p.level + 1) % 3 === 0) p.ceilingBlocked = true;
        else { p.level += 1; p.xp = 0; }
      }
      // Holdings cap by level (owner law): level 1 → 6 sites, +1 per level.
      const holdings = [...world.sites.values()].filter((s) => s.owner === p.id).length;
      const cap = 5 + p.level;
      if (holdings >= cap) continue;

      // Coalition rule: everyone's aggression tilts toward a runaway leader.
      const myTotal = totals.get(p.id)!;
      const leaderTotal = totals.get(leader)!;
      const runaway = leaderTotal > 1.18 * myTotal && leader !== p.id;

      const appetite = p.aggression + (runaway && world.coalitionRule ? 0.45 : 0) + (p.focus === "expand" ? 0.1 : 0);
      if (rand() > appetite * 0.5) continue;

      // Pick a target: neutral belt first, then the runaway leader's edge, institutions rarely, free bloc almost never.
      const candidates = [...world.sites.values()].filter((s) => {
        if (s.shielded || s.owner === p.id) return false;
        if (s.owner === "free") return rand() < 0.02; // canon: nobody does this casually
        // Owner ruling (sim decision 5): late-game wars swallow the city-states too.
        if (s.owner === "institution") return rand() < (world.day > 250 ? 0.55 : 0.05);
        if (typeof s.owner === "string" && world.powers.has(s.owner as PowerId)) {
          if (p.pacts.has(s.owner as PowerId)) return false;
          return world.coalitionRule && runaway ? s.owner === leader : rand() < 0.35;
        }
        return true; // neutral
      });
      if (!candidates.length || p.coin < 220) continue;
      const target = candidates.sort((a, b) => b.tier - a.tier)[0]!;
      // Armies scale with nation level (owner law: level extends army size).
      const army = Math.min(480, 120 + p.level * 40);
      p.coin -= 120;
      // Posture choice: the impatient and the poor storm; the patient and the rich wait out the clock.
      const posture: Campaign["posture"] = p.aggression > 0.55 || p.coin < 300 ? "storm" : "wait";
      p.campaigns.push({ attacker: p.id, siteId: target.id, army, armyLevel: 9 + p.level, supplySpent: 0, days: 0, posture });
    }

    // Pacts: shared faith + shared threat.
    const ids = [...world.powers.keys()];
    for (const a of ids) for (const b of ids) {
      if (a >= b) continue;
      const pa = world.powers.get(a)!; const pb = world.powers.get(b)!;
      if (pa.faith === pb.faith && rand() < 0.05) { pa.pacts.add(b); pb.pacts.add(a); }
    }

    // Institutions auction influence to the richest bidder — best interest at the time.
    for (const [seat, patron] of world.institutionsInfluence) {
      const bidders = [...world.powers.values()].filter((p) => !p.eliminated && p.coin > 260);
      if (!bidders.length) continue;
      const best = bidders.sort((x, y) => y.coin - x.coin)[0]!;
      if (patron !== best.id && rand() < 0.3) {
        best.coin -= 160;
        world.institutionsInfluence.set(seat, best.id);
        best.xp += 25;
      }
    }
  }

  // Court Day: the first of every month.
  if (world.day % 30 === 1 && world.day > 1) {
    for (const p of world.powers.values()) {
      if (p.eliminated) continue;
      const roll = rand();
      if (roll < 0.25) { p.coin += 140; world.events.windfalls += 1; }        // treasure
      else if (roll < 0.45) { p.coin -= 110; world.events.disasters += 1; }   // disaster
      else if (roll < 0.55) { world.events.comedies += 1; }                    // funny; morale blip
      else { p.xp += 30; }                                                     // petitions handled
    }
  }

  // Elimination: a power with no holdings is out.
  for (const p of world.powers.values()) {
    if (!p.eliminated && ![...world.sites.values()].some((s) => s.owner === p.id)) {
      p.eliminated = true;
      world.log.push(`d${world.day} ${p.id} ELIMINATED`);
    }
  }
}

/** Standalone siege experiment: one site, parametric. Reserve given in
 *  SUSTAINED-DAYS per the owner ruling; posture is the attacker's choice. */
export function runSiege(reserveDays: number, garrison: number, garrisonLevel: number, walls: number, army: number, seed: number, posture: Campaign["posture"], machines = 0) {
  const rand = rng(seed);
  const site = makeSite("s", { forgeReserve: reserveForDays(reserveDays, garrisonLevel), forgeCap: reserveForDays(reserveDays + 2, garrisonLevel), garrison, garrisonLevel, walls, machines });
  const world = { sites: new Map([["s", site]]), powers: new Map(), day: 0, log: [], institutionsInfluence: new Map(), coalitionRule: false, events: { windfalls: 0, disasters: 0, comedies: 0 } } as unknown as World;
  const attacker: Power = { id: "ndd", shape: {} as Record<Axis, number>, aggression: 1, focus: "expand", faith: "secular", coin: 10_000, essencePool: 0, campaigns: [], pacts: new Set(), grudges: new Map(), xp: 0, level: 5, ceilingBlocked: false, ceilingsBroken: 0, eliminated: false };
  (world.powers as Map<PowerId, Power>).set("ndd", attacker);
  const campaign: Campaign = { attacker: "ndd", siteId: "s", army, armyLevel: 12, supplySpent: 0, days: 0, posture };
  for (let d = 0; d < 400; d++) {
    const result = siegeTick(world, campaign, rand);
    if (result !== "ongoing") return { result, days: campaign.days, supply: campaign.supplySpent, reserveLeft: site.forgeReserve };
  }
  return { result: "stalemate" as const, days: 400, supply: campaign.supplySpent, reserveLeft: site.forgeReserve };
}
