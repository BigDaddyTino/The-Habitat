import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { getPrismaClient } from "@habitat/db/client";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env"), quiet: true });

/**
 * One physical join could historically be imported twice: once from the game's
 * own log (source LEGACY_HISTORY_IMPORT) and once from the HabitatCore
 * chronicle (source HABITAT_NATIVE_HISTORY). Imports now skip the duplicate;
 * this removes chronicle joins already doubled in the database. Dry run by
 * default; pass --apply to delete.
 */
const crossSourceJoinWindowMs = 30_000;

const db = getPrismaClient();

async function main() {
  const apply = process.argv.includes("--apply");
  const chronicleJoins = await db.serverEvent.findMany({
    where: { eventType: "PLAYER_JOINED", source: "HABITAT_NATIVE_HISTORY", playerIdentityId: { not: null } },
    select: { id: true, serverId: true, playerIdentityId: true, occurredAt: true, actorText: true },
    orderBy: { occurredAt: "asc" },
  });
  const duplicates: typeof chronicleJoins = [];
  for (const event of chronicleJoins) {
    const sessionJoin = await db.serverEvent.findFirst({
      where: {
        serverId: event.serverId,
        playerIdentityId: event.playerIdentityId,
        eventType: "PLAYER_JOINED",
        source: "LEGACY_HISTORY_IMPORT",
        occurredAt: {
          gte: new Date(event.occurredAt.getTime() - crossSourceJoinWindowMs),
          lte: new Date(event.occurredAt.getTime() + crossSourceJoinWindowMs),
        },
      },
      select: { id: true },
    });
    if (sessionJoin) duplicates.push(event);
  }
  for (const event of duplicates) {
    console.info(`${apply ? "removing" : "would remove"} duplicate chronicle join ${event.id} (${event.actorText ?? "unnamed"} at ${event.occurredAt.toISOString()})`);
  }
  if (!apply) {
    console.info(`${duplicates.length} duplicate chronicle join(s) found. Re-run with --apply to remove them, then let the worker's next reconciliation pass recompute progression.`);
    return;
  }
  const removed = await db.serverEvent.deleteMany({ where: { id: { in: duplicates.map((event) => event.id) } } });
  console.info(`Removed ${removed.count} duplicate chronicle join(s). Dependent activity projections were removed by cascade; progression reconciles on the worker's next history pass.`);
}

void main()
  .catch((error: unknown) => {
    console.error("Duplicate join cleanup failed:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
