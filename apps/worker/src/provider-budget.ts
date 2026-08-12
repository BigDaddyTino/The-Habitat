import { getPrismaClient } from "@habitat/db/client";

export function utcUsageDay(value = new Date()) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function parseRequestBudget(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 100_000 ? parsed : fallback;
}

/** Single-worker request reservation. Add row claiming/advisory locking before running multiple worker replicas. */
export async function reserveProviderRequests(provider: string, amount: number, dailyLimit: number) {
  if (!/^[A-Z0-9_]{2,40}$/.test(provider) || !Number.isSafeInteger(amount) || amount < 1 || !Number.isSafeInteger(dailyLimit) || dailyLimit < amount) return false;
  const db = getPrismaClient();
  const usageDay = utcUsageDay();
  return db.$transaction(async (transaction) => {
    const usage = await transaction.providerRequestUsage.upsert({
      where: { provider_usageDay: { provider, usageDay } },
      create: { provider, usageDay, requestCount: 0 },
      update: {},
      select: { id: true, requestCount: true },
    });
    if (usage.requestCount + amount > dailyLimit) return false;
    await transaction.providerRequestUsage.update({ where: { id: usage.id }, data: { requestCount: { increment: amount } } });
    return true;
  });
}
