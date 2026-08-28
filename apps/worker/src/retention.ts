import { getPrismaClient } from "@habitat/db/client";

/**
 * Bounded history for the one table that had none.
 *
 * `ServerMetricSample` is written by the agent on every monitoring cycle and
 * was never pruned: 609,931 rows across eighteen days when this was written,
 * 129 MB — larger than every other table in the database put together, and on
 * course for about 2.5 GB a year. The only thing that reads it is the world
 * page, which asks for the newest 48 samples per server. Everything older than
 * that existed to be backed up and paged past.
 *
 * A window rather than a downsample, because there is no reader to preserve
 * resolution for. If one is ever written — a season-long player-count chart,
 * say — the honest change is to roll old samples up to hourly here rather than
 * to widen the window and hope.
 *
 * The floor is deliberate. Unbounded growth was the bug; a window short enough
 * to lose the current view would be a different bug, so the minimum keeps well
 * more history than any surface asks for.
 */

export const metricRetentionBounds = { minimumDays: 7, defaultDays: 30, maximumDays: 3650 } as const;

export function parseMetricRetentionDays(value: string | undefined): number {
  if (value === undefined || value.trim() === "") return metricRetentionBounds.defaultDays;
  const days = Number(value);
  if (!Number.isSafeInteger(days) || days < metricRetentionBounds.minimumDays || days > metricRetentionBounds.maximumDays) {
    throw new Error(`HABITAT_METRIC_RETENTION_DAYS must be an integer from ${metricRetentionBounds.minimumDays} through ${metricRetentionBounds.maximumDays}.`);
  }
  return days;
}

export function metricRetentionCutoff(keepDays: number, now: Date): Date {
  return new Date(now.getTime() - keepDays * 86_400_000);
}

export type MetricPruneResult = {
  cutoff: Date;
  deleted: number;
  /** True when the batch ceiling stopped it early and there is more to take. */
  more: boolean;
};

/**
 * Deletes in batches with a ceiling per run.
 *
 * The first prune on an installation that has never had one can face hundreds
 * of thousands of rows, and a single unbounded DELETE would hold locks on a
 * table the monitoring cycle writes to every fifteen seconds. Taking a bounded
 * bite and returning `more` lets the next scheduled run continue instead,
 * which is slower and never blocks a write.
 */
export async function pruneServerMetrics(
  keepDays: number,
  now = new Date(),
  { batchSize = 5_000, maxBatches = 20 }: { batchSize?: number; maxBatches?: number } = {},
): Promise<MetricPruneResult> {
  const database = getPrismaClient();
  const cutoff = metricRetentionCutoff(keepDays, now);
  let deleted = 0;

  for (let batch = 0; batch < maxBatches; batch += 1) {
    // Selecting ids first keeps each delete to a known set of rows rather than
    // whatever a range predicate matches while the agent is still writing.
    const doomed = await database.serverMetricSample.findMany({
      where: { observedAt: { lt: cutoff } },
      orderBy: { observedAt: "asc" },
      select: { id: true },
      take: batchSize,
    });
    if (doomed.length === 0) return { cutoff, deleted, more: false };
    const result = await database.serverMetricSample.deleteMany({ where: { id: { in: doomed.map((row) => row.id) } } });
    deleted += result.count;
    if (doomed.length < batchSize) return { cutoff, deleted, more: false };
  }

  return { cutoff, deleted, more: true };
}
