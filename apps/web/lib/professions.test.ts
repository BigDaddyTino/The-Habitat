import assert from "node:assert/strict";
import test from "node:test";
import { professionEffects, professions, progression, rungOrder, effectsForTrade } from "./professions";

test("nine trades, three rungs each, in order", () => {
  assert.equal(professions.length, 9);
  for (const trade of professions) {
    assert.deepEqual(trade.tiers.map((tier) => tier.rung), rungOrder, `${trade.slug} rungs are wrong or out of order`);
  }
});

test("slugs are unique and url-safe", () => {
  const slugs = professions.map((trade) => trade.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("apprentice is ungated; the two rung-ups both have a gate with a real issuer", () => {
  for (const trade of professions) {
    const [apprentice, licensed, master] = trade.tiers;
    assert.equal(apprentice.gate, undefined, `${trade.slug}: apprentice must be ungated — everyone starts there`);
    for (const tier of [licensed, master]) {
      assert.ok(tier.gate, `${trade.slug}/${tier.rung} has no gate`);
      assert.ok(tier.gate!.licence.length > 0 && tier.gate!.price.length > 0, `${trade.slug}/${tier.rung} gate is incomplete`);
      assert.match(tier.gate!.issuer, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${trade.slug}/${tier.rung} issuer is not a slug`);
    }
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

test("no blueprint speaks in rounds, turns or scenes — this is a live server", () => {
  // Only the TIME senses are banned. "A round" is also ammunition and "turns"
  // is also a verb, so the pattern matches tabletop time units specifically:
  // counted rounds, "per round/turn", turn order, scenes, and dice.
  const banned = /(\b\d+\s*(rounds?|turns?)\b|\b(per|each|every|a|one|next|this|first|second|last|another)\s+(round|turn)\b|\b(round|turn)-based\b|\bturn order\b|\bper scene\b|\bonce per scene\b|\broll(s|ed)? (a|the) (dice|die)\b)/i;
  for (const trade of professions) {
    for (const tier of trade.tiers) {
      for (const blueprint of tier.blueprints) {
        for (const line of blueprint.does) {
          assert.ok(!banned.test(line), `${trade.slug}/${tier.rung}/${blueprint.name}: "${line}" speaks in rounds`);
        }
      }
    }
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

test("a master rung is never worth less in a fight than its own licensed rung", () => {
  // A player who spends a career reaching mastery must never measure worse
  // for it. Every numeric weight is monotone across the ladder.
  for (const trade of professions) {
    const licensed = effectsForTrade(trade.slug, "licensed");
    const master = effectsForTrade(trade.slug, "master");
    for (const [key, value] of Object.entries(licensed)) {
      if (typeof value !== "number") continue;
      const upper = (master as Record<string, number>)[key] ?? 0;
      // corruptionPace is a discount: lower is better, so it inverts.
      if (key === "corruptionPace") assert.ok(upper <= value || upper === 0, `${trade.slug}: master corruption pace is worse than licensed`);
      else assert.ok(upper >= value, `${trade.slug}: master ${key} (${upper}) is below licensed (${value})`);
    }
  }
});

test("the progression law holds: master in exactly one, licences gate the rungs", () => {
  assert.equal(progression.masterLimit, 1);
  assert.ok(progression.jobsToMastery > progression.jobsToLicence);
  assert.ok(progression.rules.length >= 4);
});
