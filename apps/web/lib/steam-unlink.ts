import type { Prisma } from "@habitat/db/client";

export type SteamUnlinkConsequences = {
  /** Identities that were attached because they carry this exact SteamID64. */
  attachedIdentityNames: string[];
  /** Identities the member owns whose proof came from somewhere other than Steam. */
  otherIdentityCount: number;
  enrichmentEnabled: boolean;
  cachedLibraryGames: number;
  cachedAchievements: number;
  clubProfileCount: number;
};

/**
 * What a member actually loses by disconnecting Steam.
 *
 * Disconnecting removes the proof, not the history: identities already attached
 * stay attached and keep earning, because ownership was established at the time
 * the proof was valid. Saying so plainly is the point of this summary — the
 * alternative is a member assuming a disconnect will quietly undo their claims.
 */
export async function summarizeSteamUnlink(transaction: Prisma.TransactionClient, userId: string): Promise<SteamUnlinkConsequences | null> {
  const account = await transaction.userSocialAccount.findFirst({
    where: { userId, platform: "STEAM", verifiedAt: { not: null } },
    select: { id: true, providerAccountId: true },
  });
  if (!account) return null;

  const [identities, steamProfile, clubProfileCount] = await Promise.all([
    transaction.playerIdentity.findMany({ where: { userId }, select: { displayName: true, externalProvider: true, externalAccountId: true } }),
    transaction.steamProfile.findUnique({
      where: { socialAccountId: account.id },
      select: { enrichmentEnabledAt: true, _count: { select: { libraryGames: true } } },
    }),
    transaction.clubGameProfile.count({ where: { userId } }),
  ]);

  const matching = account.providerAccountId
    ? identities.filter((identity) => identity.externalProvider === "STEAM" && identity.externalAccountId === account.providerAccountId)
    : [];
  const cachedAchievements = steamProfile ? await transaction.steamUserAchievement.count({ where: { steamProfile: { is: { socialAccountId: account.id } } } }) : 0;

  return {
    attachedIdentityNames: matching.map((identity) => identity.displayName),
    otherIdentityCount: identities.length - matching.length,
    enrichmentEnabled: Boolean(steamProfile?.enrichmentEnabledAt),
    cachedLibraryGames: steamProfile?._count.libraryGames ?? 0,
    cachedAchievements,
    clubProfileCount,
  };
}

/** The consequence lines shown above the disconnect confirmation, in plain language. */
export function describeSteamUnlink(summary: SteamUnlinkConsequences): string[] {
  const lines: string[] = [];
  if (summary.attachedIdentityNames.length > 0) {
    lines.push(`${summary.attachedIdentityNames.length} identity claim${summary.attachedIdentityNames.length === 1 ? "" : "s"} proved by this Steam account stay${summary.attachedIdentityNames.length === 1 ? "s" : ""} attached and keep${summary.attachedIdentityNames.length === 1 ? "s" : ""} earning: ${summary.attachedIdentityNames.join(", ")}. Only an administrator can detach them.`);
  }
  lines.push("New identities carrying this SteamID64 will stop attaching automatically. Future matches would need a reviewed claim instead.");
  if (summary.enrichmentEnabled) {
    lines.push(`Steam enrichment is on. Disconnecting also deletes ${summary.cachedLibraryGames.toLocaleString("en-US")} cached library game${summary.cachedLibraryGames === 1 ? "" : "s"} and ${summary.cachedAchievements.toLocaleString("en-US")} cached achievement row${summary.cachedAchievements === 1 ? "" : "s"}. This cached provider data cannot be recovered without reconnecting Steam and enabling enrichment again.`);
  }
  if (summary.clubProfileCount > 0) {
    lines.push(`${summary.clubProfileCount} club game profile${summary.clubProfileCount === 1 ? "" : "s"} will no longer refresh on Steam presence and will fall back to the slower daily schedule.`);
  }
  lines.push("Your playtime, XP, level, achievements, and titles are unchanged. Disconnecting removes the proof, not the history it already established.");
  return lines;
}
