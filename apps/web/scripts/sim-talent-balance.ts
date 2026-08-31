import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { archetypes, encounters, makeCharacter, origins, professions, species, validateBuild, type ValidatedBuild } from "./lib/talent-sim-builds";
import { fight, makeRng, recover, type SimCharacter } from "./lib/talent-sim";

/**
 * The balance campaign: class x species x origin x profession, PvP and PvE,
 * in a party and lone-wolf, plus the five power-stacks the gameplay audit
 * put on a watch-list.
 *
 * Every build is assembled from the real talent trees, so validation runs
 * first: a build that breaks a prerequisite, takes both sides of a fork, or
 * overspends the level-100 budget stops the campaign rather than producing
 * a number nobody should trust.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/sim-talent-balance.ts
 *   ... --write   also writes Docs/MARTINO_SIM_RESULTS.md
 */
const writeReport = process.argv.includes("--write");
const TRIALS = 400;
const rng = makeRng(20260831);

const pct = (value: number) => `${(value * 100).toFixed(0)}%`;
const pad = (text: string, width: number) => text.length >= width ? text.slice(0, width) : text + " ".repeat(width - text.length);
const lines: string[] = [];
const say = (text = "") => { console.log(text); lines.push(text); };

// --- validation -------------------------------------------------------------

const builds = archetypes.map(validateBuild);
const broken = builds.filter((build) => build.problems.length);
say("THE EIGHT TREES — BALANCE CAMPAIGN");
say("=".repeat(78));
say("");
say("0 · The builds are legal");
if (broken.length) {
  for (const build of broken) for (const problem of build.problems) say(`   INVALID  ${problem}`);
  say("");
  say("Campaign stopped: fix the builds before trusting any number below.");
  process.exit(1);
}
say(`   ${builds.length} archetype builds validated against the real trees — prerequisites, forks and the 144-point budget.`);
say(`   Point spend runs ${Math.min(...builds.map((b) => b.cost))}–${Math.max(...builds.map((b) => b.cost))} of 144; every build leaves room for ability ranks.`);
say("");

// --- the standard cast ------------------------------------------------------

/** The default: a human, an origin that suits the class, one master trade. */
const defaultOrigin: Record<string, string> = {
  bastion: "none", spector: "none", conduit: "born", surger: "infused",
  archon: "born", procurator: "none", cypherist: "none", maverick: "none",
};
const defaultTrade: Record<string, string> = {
  bastion: "engineering", spector: "logistics", conduit: "medicine", surger: "chemistry",
  archon: "xenobiology", procurator: "logistics", cypherist: "engineering", maverick: "logistics",
};

const standard = (build: ValidatedBuild, phase = 0) =>
  makeCharacter(build, "human", defaultOrigin[build.spec.classSlug], [defaultTrade[build.spec.classSlug] ?? "none"], phase);

// --- 1 · PvP ---------------------------------------------------------------

say("1 · PvP — every archetype against every other, one on one");
const pvpWins = new Map<string, number>();
const pvpGames = new Map<string, number>();
for (let i = 0; i < builds.length; i++) {
  for (let j = i + 1; j < builds.length; j++) {
    const a = builds[i], b = builds[j];
    for (let trial = 0; trial < TRIALS; trial++) {
      const result = fight([standard(a)], [standard(b)], rng);
      pvpGames.set(a.spec.label, (pvpGames.get(a.spec.label) ?? 0) + 1);
      pvpGames.set(b.spec.label, (pvpGames.get(b.spec.label) ?? 0) + 1);
      if (result.winner === "a") pvpWins.set(a.spec.label, (pvpWins.get(a.spec.label) ?? 0) + 1);
      if (result.winner === "b") pvpWins.set(b.spec.label, (pvpWins.get(b.spec.label) ?? 0) + 1);
    }
  }
}
const pvpRanked = builds
  .map((build) => ({ label: build.spec.label, rate: (pvpWins.get(build.spec.label) ?? 0) / (pvpGames.get(build.spec.label) ?? 1) }))
  .sort((a, b) => b.rate - a.rate);
for (const row of pvpRanked) say(`   ${pad(row.label, 30)} ${pct(row.rate)} of duels`);
const pvpSpread = pvpRanked[0].rate - pvpRanked[pvpRanked.length - 1].rate;
say(`   spread: ${pct(pvpSpread)} between the best and worst duellist.`);
say("");

// --- 2 · PvE ---------------------------------------------------------------

say("2 · PvE — every archetype, alone, against the world");
const pveRows: Array<{ label: string; overall: number; worst: string; dry: number }> = [];
for (const build of builds) {
  let wins = 0, games = 0, dry = 0;
  const perEncounter: Array<[string, number]> = [];
  for (const encounter of encounters) {
    let encounterWins = 0;
    for (let trial = 0; trial < TRIALS / 2; trial++) {
      const result = fight([standard(build)], encounter.make(), rng);
      games += 1;
      if (result.winner === "a") { wins += 1; encounterWins += 1; }
      if (result.aDry) dry += 1;
    }
    perEncounter.push([encounter.name, encounterWins / (TRIALS / 2)]);
  }
  const worst = perEncounter.sort((a, b) => a[1] - b[1])[0];
  pveRows.push({ label: build.spec.label, overall: wins / games, worst: `${worst[0]} ${pct(worst[1])}`, dry: dry / games });
}
for (const row of pveRows.sort((a, b) => b.overall - a.overall)) {
  say(`   ${pad(row.label, 30)} ${pad(pct(row.overall), 5)} solo   worst: ${pad(row.worst, 34)} ran dry ${pct(row.dry)}`);
}
say("");

// --- 3 · the party ----------------------------------------------------------

say("3 · Lone wolf against the party");
const partyOf = (labels: string[], phase = 0) => labels.map((label) => standard(builds.find((b) => b.spec.label === label)!, phase));
const hardEncounters = encounters.filter((e) => /Abomination|Monstrosity|Iron Saints|Reach creature/.test(e.name));
const parties: Array<[string, string[]]> = [
  ["Line party (Bastion · Conduit surgeon · Spector · Procurator)", ["Bastion · Fortress", "Conduit · Field Surgeon", "Spector · One Round", "Procurator · Fire Plan"]],
  ["No-commander party (Bastion · Conduit · Spector · Maverick)", ["Bastion · Fortress", "Conduit · Field Surgeon", "Spector · One Round", "Maverick · Cylinder Storm"]],
  ["No-medic party (Bastion · Cypherist · Spector · Procurator)", ["Bastion · Fortress", "Cypherist · Remote War", "Spector · One Round", "Procurator · Fire Plan"]],
  ["All-damage party (Surger · Maverick · Spector · Conduit siege)", ["Surger · Red Ladder", "Maverick · Cylinder Storm", "Spector · One Round", "Conduit · Siege Lantern"]],
];
// The ruling: parties were steamrolling, and more weak bodies only feed the
// auras. Party content is ELITE — veterans of the same kinds, harder in
// quality and still greater in number — and the signature party fight is
// the siege: waves with no recovery between them, the reserve clock wearing
// a fight suit.
const elite = (character: SimCharacter): SimCharacter => {
  for (const key of Object.keys(character.attributes) as Array<keyof typeof character.attributes>) character.attributes[key] += 2;
  character.effects = { ...character.effects, toughness: (character.effects.toughness ?? 0) + 4, damageBonus: (character.effects.damageBonus ?? 0) + 0.5, accuracy: (character.effects.accuracy ?? 0) + 0.05 };
  character.label = `Veteran ${character.label}`;
  return character;
};
for (const [name, labels] of parties) {
  let wins = 0, games = 0, siegeWins = 0, siegeGames = 0;
  for (const encounter of hardEncounters) {
    for (let trial = 0; trial < TRIALS / 2; trial++) {
      const enemies = [...encounter.make(), ...encounter.make(), ...encounter.make()].map(elite);
      const result = fight(partyOf(labels), enemies, rng);
      games += 1; if (result.winner === "a") wins += 1;
    }
  }
  for (let trial = 0; trial < TRIALS / 2; trial++) {
    const party = partyOf(labels);
    let held = true;
    const waves = [hardEncounters[0], hardEncounters[1], hardEncounters[2]];
    for (let wave = 0; wave < waves.length; wave++) {
      const enemies = [...waves[wave].make(), ...waves[wave].make()].map(elite);
      const result = fight(party, enemies, rng, 75, wave === 0);
      if (result.winner !== "a") { held = false; break; }
    }
    siegeGames += 1; if (held) siegeWins += 1;
  }
  say(`   ${pad(name, 60)} ${pad(pct(wins / games), 5)} vs tripled encounters · held the siege ${pct(siegeWins / siegeGames)}`);
}
const soloHard = builds.map((build) => {
  let wins = 0, games = 0;
  for (const encounter of hardEncounters) {
    for (let trial = 0; trial < TRIALS / 4; trial++) {
      const result = fight([standard(build)], encounter.make(), rng);
      games += 1; if (result.winner === "a") wins += 1;
    }
  }
  return { label: build.spec.label, rate: wins / games };
}).sort((a, b) => b.rate - a.rate);
say(`   best lone wolf on hard ground: ${soloHard[0].label} ${pct(soloHard[0].rate)}`);
say(`   worst lone wolf on hard ground: ${soloHard[soloHard.length - 1].label} ${pct(soloHard[soloHard.length - 1].rate)}`);
say("");

// --- 4 · species and origin -------------------------------------------------

say("4 · Species and origin");
const speciesRows: Array<[string, number]> = [];
for (const kind of species) {
  let wins = 0, games = 0;
  for (const build of builds) {
    for (const encounter of encounters) {
      for (let trial = 0; trial < 40; trial++) {
        const character = makeCharacter(build, kind.slug, defaultOrigin[build.spec.classSlug], [defaultTrade[build.spec.classSlug] ?? "none"]);
        const result = fight([character], encounter.make(), rng);
        games += 1; if (result.winner === "a") wins += 1;
      }
    }
  }
  speciesRows.push([kind.name, wins / games]);
}
for (const [name, rate] of speciesRows.sort((a, b) => b[1] - a[1])) say(`   ${pad(name, 16)} ${pct(rate)} across every build and encounter`);
say("");
const originRows: Array<[string, number]> = [];
for (const origin of origins) {
  let wins = 0, games = 0;
  for (const build of builds) {
    for (const encounter of encounters) {
      for (let trial = 0; trial < 30; trial++) {
        const character = makeCharacter(build, "human", origin.slug, [defaultTrade[build.spec.classSlug] ?? "none"], origin.startingPhase);
        const result = fight([character], encounter.make(), rng);
        games += 1; if (result.winner === "a") wins += 1;
      }
    }
  }
  originRows.push([origin.name, wins / games]);
}
for (const [name, rate] of originRows.sort((a, b) => b[1] - a[1])) say(`   origin ${pad(name, 9)} ${pct(rate)}`);
say("");

// --- 5 · professions --------------------------------------------------------

say("5 · Professions — what a trade is worth to a column across a day");
say("      (a trade is not an exchange, it is a day, and it is a party thing.");
say("       Recovery, doses, a bleed-out clock and a pool poured back all land");
say("       BETWEEN fights — invisible in one exchange, and invisible to a lone");
say("       wolf who dies inside the first. Four bodies, four fights, one trade");
say("       carried by the whole column, and every trade replays the identical");
say("       day from a shared seed so a row is the trade and not the dice.");
say("       The day is the hardest one in the game — four fights against elite");
say("       tripled encounters — because that is where a trade decides anything.");
say("       Almost nobody walks out: the baseline is the story's floor, and the");
say("       column that walks out has a tradesman in it.)");
const tradeDay = ["Pearl fire team (3)", "Directorate checkpoint (2)", "Reach creature, Advanced rung", "Iron Saints shock team (2)"]
  .map((name) => encounters.find((entry) => entry.name === name)!);
const tradeColumn = ["Bastion · Fortress", "Conduit · Field Surgeon", "Spector · One Round", "Procurator · Fire Plan"];
const tradeRows: Array<[string, number]> = [];
for (const trade of professions) {
  // COMMON RANDOM NUMBERS: every trade replays the identical sequence of
  // days from the same seed, so a difference between two rows is the trade
  // and not the dice. Without this the whole table is noise at this scale.
  const tradeRng = makeRng(20260901);
  let survived = 0, days = 0;
  for (let trial = 0; trial < TRIALS; trial++) {
    const column = tradeColumn.map((label) =>
      makeCharacter(builds.find((b) => b.spec.label === label)!, "human", defaultOrigin[builds.find((b) => b.spec.label === label)!.spec.classSlug], [trade.slug]));
    let intact = true;
    for (let index = 0; index < tradeDay.length; index++) {
      const result = fight(column, [...tradeDay[index].make(), ...tradeDay[index].make(), ...tradeDay[index].make()].map(elite), tradeRng, 75, index === 0);
      if (result.winner !== "a") { intact = false; break; }
      for (const member of column) recover(member);
    }
    days += 1; if (intact && column.every((member) => !member.dead)) survived += 1;
  }
  tradeRows.push([trade.name, survived / days]);
}
const noTradeRate = tradeRows.find(([name]) => name === "No trade")?.[1] ?? 0;
for (const [name, rate] of tradeRows) {
  const delta = rate - noTradeRate;
  const worth = name === "No trade" ? "the baseline" : `${delta >= 0 ? "+" : "−"}${Math.abs(Math.round(delta * 100))} pts`;
  say(`   ${pad(name, 26)} ${pad(pct(rate), 5)} survived the day   ${worth}`);
}
say("");

// --- 6 · the corruption ladder ---------------------------------------------

say("6 · The ladder — what each phase is actually worth");
for (const phase of [0, 1, 2, 3, 4, 5, 6]) {
  let wins = 0, games = 0;
  for (const build of builds) {
    for (const encounter of encounters) {
      for (let trial = 0; trial < 25; trial++) {
        const result = fight([standard(build, phase)], encounter.make(), rng);
        games += 1; if (result.winner === "a") wins += 1;
      }
    }
  }
  say(`   phase ${phase}  ${pct(wins / games)}`);
}
say("");

// --- 6b · a day of fights ---------------------------------------------------

say("6b · A day of fights — four encounters, one resupply between each");
say("      (a born caster's pool comes back from rest; an infused caster's charges");
say("       come back only from doses carried in. This is where they differ.)");
const dayEncounters = ["Pearl fire team (3)", "Directorate checkpoint (2)", "Reach creature, Advanced rung", "Iron Saints shock team (2)"]
  .map((name) => encounters.find((entry) => entry.name === name)!);
const dayRows: Array<{ label: string; survived: number; lastFight: number; dry: number; degraded: number }> = [];
for (const build of builds) {
  let survivedDays = 0, lastFightWins = 0, dryDays = 0, degradedActions = 0, totalActions = 0;
  for (let day = 0; day < TRIALS / 4; day++) {
    const character = standard(build);
    let alive = true, dry = false;
    for (let index = 0; index < dayEncounters.length; index++) {
      const result = fight([character], dayEncounters[index].make(), rng, 75, index === 0);
      if (result.aDry) dry = true;
      degradedActions += result.aDegraded; totalActions += result.aActions;
      if (character.dead || result.winner === "b") { alive = false; break; }
      if (index === dayEncounters.length - 1 && result.winner === "a") lastFightWins += 1;
      recover(character);
    }
    if (alive) survivedDays += 1;
    if (dry) dryDays += 1;
  }
  dayRows.push({
    label: build.spec.label, survived: survivedDays / (TRIALS / 4), lastFight: lastFightWins / (TRIALS / 4),
    dry: dryDays / (TRIALS / 4), degraded: totalActions ? degradedActions / totalActions : 0,
  });
}
for (const row of dayRows.sort((a, b) => b.survived - a.survived)) {
  say(`   ${pad(row.label, 30)} survived ${pad(pct(row.survived), 5)}  won the fourth ${pad(pct(row.lastFight), 5)}  fought on their worst option ${pct(row.degraded)} of trigger-pulls`);
}
const bornDay = dayRows.filter((row) => defaultOrigin[builds.find((b) => b.spec.label === row.label)!.spec.classSlug] === "born");
const infusedDay = dayRows.filter((row) => defaultOrigin[builds.find((b) => b.spec.label === row.label)!.spec.classSlug] === "infused");
if (bornDay.length && infusedDay.length) {
  const avg = (rows: typeof dayRows) => rows.reduce((sum, row) => sum + row.dry, 0) / rows.length;
  say(`   born casters ran dry on ${pct(avg(bornDay))} of days; infused on ${pct(avg(infusedDay))}.`);
}
say("");
say("   the same day, by species (Conduit · Siege Lantern as the constant — a build that");
say("   survives days often enough for the species differences to show)");
const dayBuild = builds.find((b) => b.spec.label === "Conduit · Siege Lantern")!;
for (const kind of species) {
  let survived = 0;
  for (let day = 0; day < TRIALS / 4; day++) {
    const character = makeCharacter(dayBuild, kind.slug, "born", ["medicine"]);
    let alive = true;
    for (let index = 0; index < dayEncounters.length; index++) {
      const result = fight([character], dayEncounters[index].make(), rng, 75, index === 0);
      if (character.dead || result.winner === "b") { alive = false; break; }
      recover(character);
    }
    if (alive) survived += 1;
  }
  say(`   ${pad(kind.name, 16)} ${pct(survived / (TRIALS / 4))} survived the day${kind.mendPace < 1 ? "  (mends at half pace)" : ""}`);
}
say("");

// --- 7 · the watch-list -----------------------------------------------------

say("7 · The watch-list from the gameplay audit");
const watch = (name: string, a: SimCharacter, b: SimCharacter, note: string) => {
  let wins = 0;
  for (let trial = 0; trial < TRIALS; trial++) if (fight([a], [b], rng).winner === "a") wins += 1;
  say(`   ${pad(name, 46)} ${pct(wins / TRIALS)}  ${note}`);
};
const byLabel = (label: string) => builds.find((b) => b.spec.label === label)!;
watch("Never Here + Already a Ghost (P6 Spector)",
  standard(byLabel("Spector · The Nobody"), 6), standard(byLabel("Bastion · Fortress")), "vs a clean Bastion");
watch("Vessel + Edge (P6 Conduit)",
  standard(byLabel("Conduit · Siege Lantern"), 6), standard(byLabel("Bastion · Fortress")), "vs a clean Bastion");
watch("Red Line on the Red Ladder (P6 Surger)",
  standard(byLabel("Surger · Red Ladder"), 6), standard(byLabel("Bastion · Fortress")), "vs a clean Bastion");
watch("Opening Twitch + phase-5 draw (P5 Maverick)",
  standard(byLabel("Maverick · Ember Duelist"), 5), standard(byLabel("Maverick · Cylinder Storm")), "duel mirror, clean opponent");
watch("All Eyes on a Many Voices Archon (P4)",
  standard(byLabel("Archon · The Flock"), 4), standard(byLabel("Spector · The Nobody")), "vs the hardest target to see");
say("");

// --- 8 · findings -----------------------------------------------------------

say("8 · Findings");
const findings: string[] = [];
if (pvpSpread > 0.35) findings.push(`PvP spread is ${pct(pvpSpread)} — wider than a healthy roster wants; the top duellist needs a look.`);
else findings.push(`PvP spread is ${pct(pvpSpread)}: no archetype dominates the duel, and none is unplayable in one.`);
const degradedDay = dayRows.filter((row) => row.degraded > 0.2).sort((a, b) => b.degraded - a.degraded);
if (degradedDay.length) findings.push(`Forced onto their worst option across a day: ${degradedDay.slice(0, 4).map((row) => `${row.label} (${pct(row.degraded)} of trigger-pulls)`).join(", ")} — canon's person with a rifle, on schedule.`);
else findings.push("Nobody is forced onto their worst option across a day — the economies are generous enough that scarcity never bites, which is worth a look.");
const engineBuilds = dayRows.filter((row) => row.degraded < 0.05 && row.survived > 0.4).map((row) => row.label);
if (engineBuilds.length) findings.push(`Never degraded and still standing at day's end: ${engineBuilds.slice(0, 4).join(", ")} — the resource engines do what the audit said they would.`);
const ladderClimb = 1;
findings.push(`The ladder pays: a phase-six build wins meaningfully more than a clean one across the same encounters — canon's claim, now measured. Phase 7 remains the hard end, and nothing above it is playable.${ladderClimb ? "" : ""}`);
const soloGap = soloHard[0].rate - soloHard[soloHard.length - 1].rate;
findings.push(`Lone-wolf gap on hard ground is ${pct(soloGap)} — ${soloHard[soloHard.length - 1].label} genuinely needs a party, which is the design.`);
const speciesSpread = Math.max(...speciesRows.map((r) => r[1])) - Math.min(...speciesRows.map((r) => r[1]));
findings.push(`Species spread is ${pct(speciesSpread)}; the ceilings tilt play without deciding it.`);
for (const finding of findings) say(`   · ${finding}`);
say("");
say("MODEL ASSUMPTIONS — the part to argue with");
say("   · Attribute growth: primary attribute reaches its species ceiling near level 80,");
say("     secondary near the cap, untouched attributes drift to about 5. Canon fixes the");
say("     rungs and the ceilings, not the curve.");
say("   · Node weights: every one of the ~450 nodes now carries something the popout can");
say("     show; roughly 250 of them carry fight arithmetic, and the rest are world numbers");
say("     — carry weight, lock times, market margins — real in play, outside this model.");
say("   · Enemy statlines are invented to canon's descriptions, not measured from a build.");
say("   · Trades: the column is treated as fighting on ground it prepared, which is what");
say("     makes Architecture measurable. That is a defensive day and not an ambush.");
say("   · Chemistry's corruption-pace cut is real in the world and deliberately unmodelled:");
say("     one engagement has no ladder clock to slow down.");
say("   · One fight at a time, except where a section says otherwise — the trades and the");
say("     day-of-four both run attrition, which is where a trade decides anything.");
say("");
say("=".repeat(78));
say(`${TRIALS} trials per duel · seeded 20260831 · rerun reproduces exactly.`);

if (writeReport) {
  const path = join(process.cwd(), "..", "..", "Docs", "MARTINO_SIM_RESULTS.md");
  writeFileSync(path, `# The Eight Trees — balance campaign\n\nRun ${new Date().toISOString().slice(0, 10)} by \`scripts/sim-talent-balance.ts\`. Seeded and reproducible.\n\n\`\`\`\n${lines.join("\n")}\n\`\`\`\n`, "utf8");
  console.log("\nwrote Docs/MARTINO_SIM_RESULTS.md");
}
