import fs from "node:fs";
import path from "node:path";
import { computePoints, makeWorld, MACHINE_UPKEEP, reserveForDays, rng, runSiege, tick, type PowerId } from "./lib/nation-sim";

/**
 * Nation Management balance sims — "Holding Ground" spec.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/sim-nation-balance.ts
 *
 * Reproducible: base seed 20260901. Comparisons reseed per row (common random
 * numbers — the lesson from the talent sims). Results are written to
 * Docs/sims/MARTINO_NM_SIM_RESULTS.md; the hand-written findings live in
 * Docs/sims/MARTINO_NM_SIM_FINDINGS.md.
 */

const BASE_SEED = 20260901;
const GREATS: PowerId[] = ["ndd", "aegis", "pearl", "floating", "ossuary"];
const out: string[] = [];
const say = (s: string) => { out.push(s); console.log(s); };

const pct = (x: number) => `${Math.round(x * 100)}%`;
const f1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1);

// ── Experiment A: the race — equal start, divergence, snowball, upsets ──────
function experimentA(coalition: boolean, seeds: number, days: number) {
  const wins = new Map<PowerId, number>(GREATS.map((g) => [g, 0]));
  let eliminations = 0;
  let leaderChanges = 0;
  let freeBlocIntact = 0;
  let institutionSeizures = 0;
  const spreadAt = { early: [] as number[], mid: [] as number[], late: [] as number[] };

  for (let s = 0; s < seeds; s++) {
    const world = makeWorld(BASE_SEED + s, { coalitionRule: coalition });
    const rand = rng(BASE_SEED + 7919 * (s + 1));
    let lastLeader: PowerId | null = null;
    for (let d = 0; d < days; d++) {
      tick(world, rand);
      if (d === Math.floor(days * 0.25) || d === Math.floor(days * 0.5) || d === days - 1) {
        const totals = GREATS.map((g) => computePoints(world, g).total);
        const spread = Math.max(...totals) / Math.max(1, Math.min(...totals));
        if (d === Math.floor(days * 0.25)) spreadAt.early.push(spread);
        else if (d === Math.floor(days * 0.5)) spreadAt.mid.push(spread);
        else spreadAt.late.push(spread);
      }
      if (d % 30 === 0) {
        const leader = GREATS.map((g) => [g, computePoints(world, g).total] as const).sort((a, b) => b[1] - a[1])[0]![0];
        if (lastLeader && leader !== lastLeader) leaderChanges += 1;
        lastLeader = leader;
      }
    }
    const finals = GREATS.map((g) => [g, computePoints(world, g).total] as const).sort((a, b) => b[1] - a[1]);
    wins.set(finals[0]![0], (wins.get(finals[0]![0]) ?? 0) + 1);
    eliminations += [...world.powers.values()].filter((p) => p.eliminated).length;
    const freeSites = [...world.sites.values()].filter((s2) => s2.owner === "free").length;
    if (freeSites === 6) freeBlocIntact += 1;
    institutionSeizures += [...world.sites.values()].filter((s2) => s2.institutionSeat && s2.owner !== "institution").length;
  }
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  say(`  coalition=${coalition ? "ON " : "OFF"} | winrates: ${GREATS.map((g) => `${g} ${pct((wins.get(g) ?? 0) / seeds)}`).join(" · ")}`);
  say(`    spread max/min: day${Math.floor(days * 0.25)} ${f1(avg(spreadAt.early))}x · day${Math.floor(days * 0.5)} ${f1(avg(spreadAt.mid))}x · day${days} ${f1(avg(spreadAt.late))}x`);
  say(`    leader changes/run ${f1(leaderChanges / seeds)} · eliminations/run ${f1(eliminations / seeds)} · free bloc intact ${pct(freeBlocIntact / seeds)} · institution seats held by powers ${f1(institutionSeizures / seeds)}/4`);
}

// ── Experiment B: sieges as Forge clocks ────────────────────────────────────
function experimentB() {
  say(`  STORM vs WAIT (owner ruling): reserve in sustained-days × posture, garrison 160 @ walls 1.5, attacker 260:`);
  for (const reserveDays of [2, 6, 12]) {
    const row: string[] = [];
    for (const posture of ["storm", "wait"] as const) {
      const runs = Array.from({ length: 40 }, (_, i) => runSiege(reserveDays, 160, 10, 1.5, 260, BASE_SEED + i, posture));
      const fell = runs.filter((r) => r.result === "fell-intact" || r.result === "fell-stormed");
      const intact = runs.filter((r) => r.result === "fell-intact").length;
      const broken = runs.filter((r) => r.result === "broken").length + runs.filter((r) => r.result === "stalemate").length;
      const days = fell.length ? fell.reduce((s, r) => s + r.days, 0) / fell.length : NaN;
      const supply = fell.length ? fell.reduce((s, r) => s + r.supply, 0) / fell.length : NaN;
      row.push(`${posture}: ${fell.length ? `${f1(days)}d, supply ${Math.round(supply)}` : "fails"} (${pct(intact / 40)} intact, ${pct(broken / 40)} no-fall)`);
    }
    say(`    clock ${String(reserveDays).padStart(2)}d: ${row.join("  |  ")}`);
  }
  say(`  HYBRID WALLS (owner ruling: soulless machines — daily Essence sip, no reclamation, destroyed is destroyed):`);
  say(`  fixed 160 total defense on a 6-day clock, attacker 260 — living/machine mix:`);
  for (const machines of [0, 50, 100]) {
    const living = 160 - machines;
    const row: string[] = [];
    for (const posture of ["storm", "wait"] as const) {
      const runs = Array.from({ length: 40 }, (_, i) => runSiege(6, living, 10, 1.5, 260, BASE_SEED + i, posture, machines));
      const fell = runs.filter((r) => r.result === "fell-intact" || r.result === "fell-stormed");
      const days = fell.length ? fell.reduce((s, r) => s + r.days, 0) / fell.length : NaN;
      const reserveLeft = runs.reduce((s, r) => s + r.reserveLeft, 0) / runs.length;
      row.push(`${posture}: ${fell.length ? `${f1(days)}d` : "holds"} (${pct(runs.filter((r) => r.result === "fell-intact").length / 40)} intact, reserve left ${Math.round(reserveLeft)})`);
    }
    say(`    living ${String(living).padStart(3)} + machines ${String(machines).padStart(3)}: ${row.join("  |  ")}`);
  }
  const clockCost = reserveForDays(6, 10);
  say(`  the economics of the sip vs the gulp: one full 6-day-clock siege burns ~${clockCost} Essence in reclamations;`);
  for (const m of [50, 100, 400]) say(`    ${String(m).padStart(3)} machines idle cost ${f1(m * MACHINE_UPKEEP)} Essence/day — the siege's burn equals ${Math.round(clockCost / (m * MACHINE_UPKEEP))} days of upkeep (${f1(clockCost / (m * MACHINE_UPKEEP) / 30)} months)`);
  say(`    (a destroyed machine is replaced with coin and materials, never Essence — the Forge never held it)`);

  say(`  garrison LEVEL vs the clock (6-day clock, garrison 160, wait posture):`);
  for (const level of [4, 10, 20, 30]) {
    const runs = Array.from({ length: 40 }, (_, i) => runSiege(6, 160, level, 1.5, 260, BASE_SEED + i, "wait"));
    const fell = runs.filter((r) => r.result === "fell-intact" || r.result === "fell-stormed");
    const days = fell.length ? fell.reduce((s, r) => s + r.days, 0) / fell.length : NaN;
    say(`    level ${String(level).padStart(2)} (reclaim ${Math.round(35 + 11.7 * level)}/body): falls in ${fell.length ? f1(days) + "d" : "never"} (${pct(runs.filter((r) => r.result === "fell-intact").length / 40)} intact)`);
  }
}

// ── Experiment C: faith, morale, and the secular crown ──────────────────────
function experimentC(days: number) {
  say(`  one realm (ossuary home cluster), crown choice held ${days} days (${f1(days / 30)} months):`);
  for (const crown of ["rites", "secular", "forgefaith"] as const) {
    const world = makeWorld(BASE_SEED, { coalitionRule: false });
    const p = world.powers.get("ossuary")!;
    p.faith = crown;
    p.aggression = 0; // hold still; watch the parish
    for (const g of GREATS) if (g !== "ossuary") world.powers.get(g)!.aggression = 0;
    const rand = rng(BASE_SEED + 31);
    const own = () => [...world.sites.values()].filter((s) => s.owner === "ossuary");
    const share = () => own().reduce((s, x) => s + x.faith[crown === "secular" ? "secular" : crown], 0) / own().length;
    const morale = () => own().reduce((s, x) => s + x.morale, 0) / own().length;
    const m0 = morale(); const s0 = share();
    for (let d = 0; d < days; d++) tick(world, rand);
    say(`    crown=${crown.padEnd(10)} pop-share ${pct(s0)} → ${pct(share())} · morale ${f1(m0 * 100)} → ${f1(morale() * 100)}`);
  }
  // Conversion half-life at the default rate.
  const world = makeWorld(BASE_SEED, { coalitionRule: false });
  for (const g of GREATS) world.powers.get(g)!.aggression = 0;
  const p = world.powers.get("aegis")!; p.faith = "forgefaith";
  const rand = rng(BASE_SEED + 77);
  const own = () => [...world.sites.values()].filter((s) => s.owner === "aegis");
  const start = own().reduce((s, x) => s + x.faith.forgefaith, 0) / own().length;
  const target = 0.5 * (1 + start);
  let halfLife = -1;
  for (let d = 0; d < 3000; d++) {
    tick(world, rand);
    const now = own().reduce((s, x) => s + x.faith.forgefaith, 0) / own().length;
    if (halfLife < 0 && now >= target) { halfLife = d; break; }
  }
  say(`    conversion pace: a crown pushing a new faith moves its people halfway to majority in ~${halfLife} days (${f1(halfLife / 30)} months / ${f1(halfLife * 96 / 60 / 24)} real days of server time)`);
}

// ── Experiment D: Court Day and absence; leveling pace ──────────────────────
function experimentD(seeds: number, days: number) {
  // Modeled outside the world loop: the deck's EV under three attendance modes.
  // Present: best of the docket (players pick well). Governor: trait-weighted.
  // Auto-doctrine: the raw deck.
  const draws = Math.floor(days / 30);
  const modes = { present: 0, governorGood: 0, governorPoor: 0, auto: 0 };
  for (let s = 0; s < seeds; s++) {
    const rand = rng(BASE_SEED + s * 13);
    for (let m = 0; m < draws; m++) {
      const roll = rand();
      const outcomes = roll < 0.25 ? { gain: 140, loss: 0 } : roll < 0.45 ? { gain: 0, loss: 110 } : roll < 0.55 ? { gain: 10, loss: 10 } : { gain: 60, loss: 0 };
      modes.present += outcomes.gain - outcomes.loss * 0.4;      // a present ruler blunts disasters and squeezes windfalls
      modes.governorGood += outcomes.gain * 0.85 - outcomes.loss * 0.7;
      modes.governorPoor += outcomes.gain * 0.6 - outcomes.loss * 1.1;
      modes.auto += outcomes.gain * 0.7 - outcomes.loss;
    }
  }
  const norm = (x: number) => Math.round(x / seeds);
  say(`  Court Day over ${draws} months (coin EV per realm): present ${norm(modes.present)} · good governor ${norm(modes.governorGood)} · poor governor ${norm(modes.governorPoor)} · auto-doctrine ${norm(modes.auto)}`);
  say(`    the gap between present and auto is the attendance incentive: ~${norm(modes.present - modes.auto)} coin/${draws} months (${Math.round(norm(modes.present - modes.auto) / draws)}/month)`);

  // Leveling pace inside the real loop.
  const world = makeWorld(BASE_SEED, { coalitionRule: true });
  const rand = rng(BASE_SEED + 3);
  const firstCeiling = new Map<PowerId, number>();
  for (let d = 0; d < days; d++) {
    tick(world, rand);
    for (const g of GREATS) {
      const p = world.powers.get(g)!;
      if (p.ceilingsBroken > 0 && !firstCeiling.has(g)) firstCeiling.set(g, d);
    }
  }
  const levels = GREATS.map((g) => `${g} L${world.powers.get(g)!.level}(${world.powers.get(g)!.ceilingsBroken}c)`).join(" · ");
  say(`  leveling over ${days} days: ${levels}`);
  say(`    first ceiling broken: ${GREATS.map((g) => `${g} d${firstCeiling.get(g) ?? "—"}`).join(" · ")}`);
}

function main() {
  say(`# Nation Management — sim results (seed ${BASE_SEED}, ${new Date().toISOString().slice(0, 10)})`);
  say(``);
  say(`## A · The race — equal start, 420 world-days, 48 seeds`);
  experimentA(true, 48, 420);
  experimentA(false, 48, 420);
  say(``);
  say(`## B · Sieges as Forge clocks`);
  experimentB();
  say(``);
  say(`## C · Faith, morale, and the secular crown`);
  experimentC(720);
  say(``);
  say(`## D · Court Day, absence, and leveling pace (420 days)`);
  experimentD(200, 420);

  const doc = path.resolve(process.cwd(), "..", "..", "Docs", "sims", "MARTINO_NM_SIM_RESULTS.md");
  fs.writeFileSync(doc, out.join("\n") + "\n", "utf8");
  console.log(`\nwritten: ${doc}`);
}

main();
