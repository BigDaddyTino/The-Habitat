import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";

const db = getPrismaClient();

/**
 * The web build can be staged ahead of its migration, so code may know an event
 * type the database has not installed yet. Naming an absent enum value in a
 * query is a hard Postgres error, which would turn a staged rollout into a
 * failing endpoint, so callers narrow their allow-lists through this first.
 *
 * The set only changes when a migration runs, so it is cached briefly rather
 * than re-read on every poll; the TTL is what lets an already-running server
 * notice a freshly applied migration without a restart.
 */
const installedTypesTtlMs = 60_000;
let cached: { types: ReadonlySet<string>; readAt: number } | null = null;

export async function getInstalledServerEventTypes(now = Date.now()): Promise<ReadonlySet<string>> {
  if (cached && now - cached.readAt < installedTypesTtlMs) return cached.types;
  const rows = await db.$queryRaw<Array<{ value: string }>>`
    SELECT enumlabel AS value
    FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = 'ServerEventType'
  `;
  const types: ReadonlySet<string> = new Set(rows.map((row) => row.value));
  cached = { types, readAt: now };
  return types;
}

export function resetInstalledServerEventTypeCache() {
  cached = null;
}

export async function filterToInstalledServerEventTypes<T extends string>(candidates: ReadonlyArray<T>): Promise<T[]> {
  const installed = await getInstalledServerEventTypes();
  return candidates.filter((candidate) => installed.has(candidate));
}
