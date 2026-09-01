import "../lib/environment";
import { getPrismaClient, type Prisma } from "@habitat/db/client";

/**
 * Owner ruling 2026-09-01: the world clock changes.
 *
 * OLD: a full day runs one real hour — forty-five minutes of daylight, fifteen of night.
 * NEW: a full day runs ninety-six real minutes — one in-game hour per four real
 * minutes, in four six-hour quarters: morning from 04:00, noon from 10:00,
 * evening from 16:00, and night from 22:00 to 04:00. Eighteen in-game hours of
 * daylight (72 real minutes), six of night (24 real minutes).
 *
 * Touches exactly two entries (the-sun-and-moon, the-solar-eclipse) by exact
 * string replacement — refuses to run if any expected string is missing, so a
 * hand-edited body stops the script instead of being mangled.
 *
 *   pnpm --filter @habitat/web exec tsx scripts/author-day-cycle-change.ts [--apply]
 */

const db = getPrismaClient();

const sunSummary =
  "The day-night cycle: a ninety-six-minute day in four quarters — morning, noon, evening, and a twenty-four-minute night — and a sky that sometimes does something it shouldn't.";

const sunReplacements: Array<[string, string]> = [
  [
    "The clock of the world, inside [[environment]]: a full day runs one real hour — forty-five minutes of daylight, fifteen of night.",
    "The clock of the world, inside [[environment]]: a full day runs ninety-six real minutes — one in-game hour to every four real minutes. The day walks four quarters of six in-game hours each: morning from four, noon from ten, evening from four in the afternoon, and night from ten until four in the morning — eighteen hours of daylight, six of dark, twenty-four real minutes of night.",
  ],
  [
    "For writers: the short night is scarcity — fifteen minutes is a raid window, not an evening, so night content must earn its darkness fast.",
    "For writers: the short night is scarcity — twenty-four real minutes is a raid, not an evening, so night content must earn its darkness fast. The quarters give scenes a vocabulary: a morning departure, a noon siege, an evening market, and whatever the six dark hours are for.",
  ],
];

const sunPillars = [
  "A ninety-six-minute day in four six-hour quarters; night gets twenty-four real minutes",
  "Night is a different game",
  "The cycle never pauses",
];

const sunOpenQuestions = [
  "Do interiors and dungeons obey the surface clock?",
  "Is the twenty-four-minute night global, or does latitude bend it?",
];

const eclipseReplacements: Array<[string, string]> = [
  [
    "the careful arithmetic of the forty-five-minute day breaks down exactly when everyone trusted it.",
    "the careful arithmetic of the ninety-six-minute day breaks down exactly when everyone trusted it.",
  ],
  [
    "supply runs, harvests, sieges are all planned around the safe forty-five — so the eclipse betrays plans, not just people.",
    "supply runs, harvests, sieges are all planned around the long safe daylight — so the eclipse betrays plans, not just people.",
  ],
];

async function main() {
  const apply = process.argv.includes("--apply");
  const identity = await db.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  const actor = await db.user.findFirstOrThrow({ where: { role: "ADMIN", isActive: true }, orderBy: { id: "asc" }, select: { id: true } });
  const plan: string[] = [];
  const problems: string[] = [];

  const sun = await db.storyEntry.findUniqueOrThrow({ where: { slug: "the-sun-and-moon" } });
  let sunBody = sun.body ?? "";
  const sunDone = sunBody.includes("ninety-six real minutes");
  if (!sunDone) {
    for (const [from, to] of sunReplacements) {
      if (!sunBody.includes(from)) problems.push(`the-sun-and-moon: expected string missing: "${from.slice(0, 60)}..."`);
      else sunBody = sunBody.replace(from, to);
    }
  }
  const eclipse = await db.storyEntry.findUniqueOrThrow({ where: { slug: "the-solar-eclipse" } });
  let eclipseBody = eclipse.body ?? "";
  const eclipseDone = eclipseBody.includes("ninety-six-minute day");
  if (!eclipseDone) {
    for (const [from, to] of eclipseReplacements) {
      if (!eclipseBody.includes(from)) problems.push(`the-solar-eclipse: expected string missing: "${from.slice(0, 60)}..."`);
      else eclipseBody = eclipseBody.replace(from, to);
    }
  }
  if (problems.length) {
    console.error(JSON.stringify({ database: identity[0]?.database, FAILED: problems }, null, 2));
    process.exitCode = 1;
    return;
  }

  if (!sunDone) {
    plan.push("update the-sun-and-moon (body, summary, pillars, open questions)");
    if (apply) {
      const meta = { ...(sun.meta as Record<string, unknown>), pillars: sunPillars, openQuestions: sunOpenQuestions };
      await db.storyEntry.update({ where: { id: sun.id }, data: {
        body: sunBody, summary: sunSummary, meta: meta as Prisma.InputJsonValue,
        version: { increment: 1 }, updatedByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        entityType: "ENTRY", entityId: sun.id, action: "UPDATED", actorUserId: actor.id,
        summary: "Owner ruling: the world day is now ninety-six real minutes in four six-hour quarters (18h day / 6h night); was 45/15.",
      } });
    }
  }
  if (!eclipseDone) {
    plan.push("update the-solar-eclipse (two figures in body)");
    if (apply) {
      await db.storyEntry.update({ where: { id: eclipse.id }, data: {
        body: eclipseBody, version: { increment: 1 }, updatedByUserId: actor.id,
      } });
      await db.storyRevision.create({ data: {
        entityType: "ENTRY", entityId: eclipse.id, action: "UPDATED", actorUserId: actor.id,
        summary: "Owner ruling: day-cycle figures updated to the ninety-six-minute day.",
      } });
    }
  }

  console.log(JSON.stringify({ database: identity[0]?.database, mode: apply ? "APPLY" : "PREVIEW", plan: plan.length ? plan : ["nothing to do"] }, null, 2));
}

main().finally(() => db.$disconnect());
