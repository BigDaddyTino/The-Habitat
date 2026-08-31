import assert from "node:assert/strict";
import test from "node:test";
import { effectsForTrade, masterLimitFor, professionEffects, professions, progression, rungOrder, tradeGrounds } from "./professions";

test("nine trades, four rungs each, in order", () => {
  assert.equal(professions.length, 9);
  assert.deepEqual(rungOrder, ["apprentice", "licensed", "journeyman", "master"]);
  for (const trade of professions) {
    assert.deepEqual(trade.tiers.map((tier) => tier.rung), rungOrder, `${trade.slug} rungs are wrong or out of order`);
  }
});

test("slugs are unique and url-safe", () => {
  const slugs = professions.map((trade) => trade.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("apprentice is ungated; every rung-up has a gate with a real issuer", () => {
  for (const trade of professions) {
    const [apprentice, ...gated] = trade.tiers;
    assert.equal(apprentice.gate, undefined, `${trade.slug}: apprentice must be ungated — everyone starts there`);
    for (const tier of gated) {
      assert.ok(tier.gate, `${trade.slug}/${tier.rung} has no gate — nothing in a trade is handed out`);
      assert.ok(tier.gate!.licence.length > 0 && tier.gate!.price.length > 0, `${trade.slug}/${tier.rung} gate is incomplete`);
      assert.match(tier.gate!.issuer, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${trade.slug}/${tier.rung} issuer is not a slug`);
    }
  }
});

test("the journeyman gate carries the wander-years — three grounds' books, in words", () => {
  for (const trade of professions) {
    const journeyman = trade.tiers.find((tier) => tier.rung === "journeyman")!;
    assert.match(journeyman.gate!.price, /[Tt]hree grounds/, `${trade.slug}: the journeyman gate does not demand the journey`);
  }
});

test("every rung makes something, and every blueprint says what it changes", () => {
  for (const trade of professions) {
    for (const tier of trade.tiers) {
      assert.ok(tier.blueprints.length > 0, `${trade.slug}/${tier.rung} unlocks nothing`);
      for (const blueprint of tier.blueprints) {
        assert.ok(blueprint.name.length > 0, `${trade.slug}/${tier.rung} has an unnamed blueprint`);
        assert.ok(blueprint.does.length > 0, `${trade.slug}/${tier.rung}/${blueprint.name} does nothing`);
      }
    }
  }
});

test("every trade has a proving — mastery is never just a count", () => {
  for (const trade of professions) {
    assert.ok(trade.proving.length > 20, `${trade.slug} has no real proving`);
  }
});

test("no blueprint speaks in rounds, turns or scenes — this is a live server", () => {
  // Only the TIME senses are banned. "A round" is also ammunition and "turns"
  // is also a verb, so the pattern matches tabletop time units specifically.
  const banned = /(\b\d+\s*(rounds?|turns?)\b|\b(per|each|every|a|one|next|this|first|second|last|another)\s+(round|turn)\b|\b(round|turn)-based\b|\bturn order\b|\bper scene\b|\bonce per scene\b|\broll(s|ed)? (a|the) (dice|die)\b)/i;
  for (const trade of professions) {
    for (const tier of trade.tiers) {
      for (const blueprint of tier.blueprints) {
        for (const line of blueprint.does) {
          assert.ok(!banned.test(line), `${trade.slug}/${tier.rung}/${blueprint.name}: "${line}" speaks in rounds`);
        }
      }
    }
    for (const seat of trade.seats) {
      for (const line of seat.teaches.does) {
        assert.ok(!banned.test(line), `${trade.slug} seat ${seat.ground}: "${line}" speaks in rounds`);
      }
    }
  }
});

test("seats: every trade sits on real grounds, spread across the world", () => {
  const grounds = new Set(tradeGrounds.map((ground) => ground.slug));
  for (const trade of professions) {
    assert.ok(trade.seats.length >= 3, `${trade.slug} has ${trade.seats.length} seats — the trade has not pushed out`);
    const seatGrounds = trade.seats.map((seat) => seat.ground);
    assert.equal(new Set(seatGrounds).size, seatGrounds.length, `${trade.slug} sits twice on one ground`);
    for (const seat of trade.seats) {
      assert.ok(grounds.has(seat.ground), `${trade.slug} sits on unknown ground "${seat.ground}"`);
      assert.ok(seat.keeper.length > 0 && seat.teaches.name.length > 0, `${trade.slug}/${seat.ground} seat is incomplete`);
    }
  }
});

test("every trade reserves at least one seat on unwritten ground — placeholders, not gaps", () => {
  const unwritten = new Set(tradeGrounds.filter((ground) => ground.unwritten).map((ground) => ground.slug));
  for (const trade of professions) {
    assert.ok(trade.seats.some((seat) => unwritten.has(seat.ground)), `${trade.slug} scopes itself to written ground only`);
  }
});

test("no seat on Ignit Island — the island burns", () => {
  for (const ground of tradeGrounds) {
    assert.ok(!/ignit|starting-island/i.test(ground.slug + ground.name), `the trades took root on ${ground.name}`);
  }
  for (const trade of professions) {
    for (const seat of trade.seats) {
      assert.ok(!/ignit|starting-island/i.test(seat.ground), `${trade.slug} has a seat on the island that burns`);
    }
  }
});

test("every ground hosts at least two trades — no ghost geography", () => {
  const hosts = new Map<string, number>();
  for (const trade of professions) for (const seat of trade.seats) hosts.set(seat.ground, (hosts.get(seat.ground) ?? 0) + 1);
  for (const ground of tradeGrounds) {
    assert.ok((hosts.get(ground.slug) ?? 0) >= 2, `${ground.name} hosts ${hosts.get(ground.slug) ?? 0} trades — it is on the map for nothing`);
  }
});

test("every effect key points at a real trade and rung", () => {
  const real = new Set(professions.flatMap((trade) => rungOrder.map((rung) => `${trade.slug}/${rung}`)));
  for (const key of Object.keys(professionEffects)) {
    assert.ok(real.has(key), `${key} carries weights but no such trade rung exists`);
  }
  for (const key of real) {
    assert.ok(key in professionEffects, `${key} has no weights — the sim would score it as nothing`);
  }
});

test("every ladder is monotone: no rung ever measures worse than the rung below it", () => {
  // A player who grinds a rung-up must never be punished by the arithmetic
  // for it, at any step — not only licensed-to-master.
  for (const trade of professions) {
    for (let step = 1; step < rungOrder.length; step++) {
      const lower = effectsForTrade(trade.slug, rungOrder[step - 1]);
      const upper = effectsForTrade(trade.slug, rungOrder[step]);
      for (const [key, value] of Object.entries(lower)) {
        if (typeof value !== "number") continue;
        const above = (upper as Record<string, number>)[key] ?? 0;
        // corruptionPace is a discount: lower is better, so it inverts.
        if (key === "corruptionPace") assert.ok(above <= value || above === 0, `${trade.slug}: ${rungOrder[step]} corruption pace is worse than ${rungOrder[step - 1]}`);
        else assert.ok(above >= value, `${trade.slug}: ${rungOrder[step]} ${key} (${above}) is below ${rungOrder[step - 1]} (${value})`);
      }
    }
  }
});

test("the grind law holds: rising counts, the wander, and the Second Seal", () => {
  assert.ok(progression.jobsToLicence < progression.jobsToJourneyman);
  assert.ok(progression.jobsToJourneyman < progression.jobsToMastery);
  assert.equal(progression.wanderGrounds, 3);
  assert.equal(progression.masterLimit, 1);
  assert.equal(progression.procuratorMasterLimit, 2);
  assert.equal(masterLimitFor("procurator"), 2, "the Procurator carries the Second Seal");
  for (const other of ["bastion", "spector", "conduit", "surger", "archon", "cypherist", "maverick", "anything-else"]) {
    assert.equal(masterLimitFor(other), 1, `${other} must master exactly one trade, ever`);
  }
  assert.ok(progression.rules.length >= 6);
});
