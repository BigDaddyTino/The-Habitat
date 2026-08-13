import { getPrismaClient } from "@habitat/db/client";
import { resolveTwitchProvider, twitchChannelUrl, twitchEmbedUrl, twitchThumbnailUrl } from "@habitat/shared";
import { publicOrigin } from "@/lib/public-url";

const db = getPrismaClient();

export type ShowcaseMember = {
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
};

/**
 * A Discord broadcasting hint. Discord tells us a member is streaming and hands
 * us a URL their own client reported, which is untrusted text — so the link is
 * only ever offered when it resolves to that member's own verified channel.
 */
export type ShowcaseDiscordSignal = {
  kind: "PRESENCE_ACTIVITY" | "VOICE_GO_LIVE";
  activityName: string | null;
  channelName: string | null;
  observedAt: Date;
  startedAt: Date | null;
  /** Non-null only when the self-reported URL matches the member's verified channel. */
  corroboratedUrl: string | null;
  /** True when Discord reported a URL that does not match their verified channel. */
  hasUnverifiedDestination: boolean;
};

export type ShowcaseChannel = {
  id: string;
  login: string;
  displayName: string;
  channelUrl: string | null;
  profileImageUrl: string | null;
  offlineImageUrl: string | null;
  broadcasterType: string | null;
  description: string | null;
  followerCount: number | null;
  isLive: boolean;
  liveSince: Date | null;
  title: string | null;
  gameName: string | null;
  viewerCount: number | null;
  thumbnailUrl: string | null;
  lastLiveAt: Date | null;
  member: ShowcaseMember;
  discord: ShowcaseDiscordSignal | null;
};

export type ShowcaseSession = {
  id: string;
  title: string | null;
  gameName: string | null;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  peakViewerCount: number | null;
  channelDisplayName: string;
  channelLogin: string;
  memberUsername: string | null;
};

export type StreamShowcase = {
  /** False when no Twitch credentials are configured, so live state is unknown rather than empty. */
  integrationReady: boolean;
  live: ShowcaseChannel[];
  featured: ShowcaseChannel | null;
  offline: ShowcaseChannel[];
  recentSessions: ShowcaseSession[];
  /** Members Discord says are broadcasting who have no verified Twitch channel live. */
  discordOnly: Array<{ member: ShowcaseMember; signal: ShowcaseDiscordSignal }>;
  embedParentHosts: string[];
  totalViewers: number | null;
};

/**
 * Only a twitch.tv URL pointing at the member's own verified channel may become a
 * link. Anything else — another channel, another site, a malformed string — is
 * reported as an unverified destination instead, so a self-reported Discord field
 * can never turn the showcase into an outbound link to somewhere unvetted.
 */
export function corroborateDiscordStreamUrl(rawUrl: string | null, verifiedLogin: string | null): { corroboratedUrl: string | null; hasUnverifiedDestination: boolean } {
  const value = rawUrl?.trim();
  if (!value) return { corroboratedUrl: null, hasUnverifiedDestination: false };
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { corroboratedUrl: null, hasUnverifiedDestination: true };
  }
  const host = parsed.hostname.toLowerCase();
  const isTwitchHost = host === "twitch.tv" || host === "www.twitch.tv" || host === "m.twitch.tv";
  const pathLogin = parsed.pathname.replace(/^\/+/, "").split("/")[0]?.toLowerCase() ?? "";
  if (parsed.protocol !== "https:" || !isTwitchHost || !verifiedLogin || pathLogin !== verifiedLogin.toLowerCase()) {
    return { corroboratedUrl: null, hasUnverifiedDestination: true };
  }
  return { corroboratedUrl: twitchChannelUrl(verifiedLogin), hasUnverifiedDestination: false };
}

/** Formats an elapsed broadcast as a compact, honest uptime string. */
export function formatUptime(startedAt: Date, now: Date = new Date()): string | null {
  const seconds = Math.floor((now.getTime() - startedAt.getTime()) / 1_000);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function formatViewerCount(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value < 0) return "—";
  return value >= 10_000 ? `${(value / 1_000).toFixed(1)}k` : value.toLocaleString("en-US");
}

export function formatSessionDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "—";
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/**
 * The featured slot goes to the biggest live audience, falling back to the
 * longest-running broadcast when nobody has a reported viewer count.
 */
export function selectFeaturedChannel(live: ShowcaseChannel[]): ShowcaseChannel | null {
  if (live.length === 0) return null;
  return [...live].sort((left, right) => {
    const viewers = (right.viewerCount ?? -1) - (left.viewerCount ?? -1);
    if (viewers !== 0) return viewers;
    const leftStart = left.liveSince?.getTime() ?? Number.POSITIVE_INFINITY;
    const rightStart = right.liveSince?.getTime() ?? Number.POSITIVE_INFINITY;
    return leftStart - rightStart;
  })[0] ?? null;
}

export function showcaseEmbedUrl(login: string, parentHosts: string[]): string | null {
  return twitchEmbedUrl(login, parentHosts, { autoplay: false, muted: true });
}

function embedParentHosts(): string[] {
  try {
    return [publicOrigin().hostname];
  } catch {
    // The showcase still renders without a configured public origin; the embed
    // simply cannot be framed, so links are offered instead.
    return [];
  }
}

function memberOf(user: { username: string | null; displayName: string | null; name: string | null; image: string | null }, fallbackName: string): ShowcaseMember {
  return { username: user.username, displayName: user.displayName ?? user.name ?? fallbackName, avatarUrl: user.image };
}

function signalOf(
  signal: { kind: "PRESENCE_ACTIVITY" | "VOICE_GO_LIVE"; streaming: boolean; streamUrl: string | null; activityName: string | null; channelName: string | null; observedAt: Date; startedAt: Date | null } | null | undefined,
  verifiedLogin: string | null,
): ShowcaseDiscordSignal | null {
  if (!signal?.streaming) return null;
  const { corroboratedUrl, hasUnverifiedDestination } = corroborateDiscordStreamUrl(signal.streamUrl, verifiedLogin);
  return {
    kind: signal.kind,
    activityName: signal.activityName,
    channelName: signal.channelName,
    observedAt: signal.observedAt,
    startedAt: signal.startedAt,
    corroboratedUrl,
    hasUnverifiedDestination,
  };
}

export async function getStreamShowcase(): Promise<StreamShowcase> {
  const parentHosts = embedParentHosts();
  const channelSelect = {
    id: true, login: true, displayName: true, profileImageUrl: true, offlineImageUrl: true, broadcasterType: true,
    channelDescription: true, followerCount: true, isLive: true, liveSince: true, currentTitle: true,
    currentGameName: true, currentViewerCount: true, thumbnailUrlTemplate: true, lastLiveAt: true,
    user: { select: { username: true, displayName: true, name: true, image: true, discordStreamSignal: { select: { kind: true, streaming: true, streamUrl: true, activityName: true, channelName: true, observedAt: true, startedAt: true } } } },
  } as const;

  const [liveRows, offlineRows, sessionRows, discordRows] = await Promise.all([
    db.twitchChannel.findMany({
      where: { showcaseEnabled: true, isLive: true },
      orderBy: [{ currentViewerCount: { sort: "desc", nulls: "last" } }, { liveSince: "asc" }],
      take: 24,
      select: channelSelect,
    }),
    db.twitchChannel.findMany({
      where: { showcaseEnabled: true, isLive: false },
      orderBy: [{ lastLiveAt: { sort: "desc", nulls: "last" } }, { displayName: "asc" }],
      take: 24,
      select: channelSelect,
    }),
    db.streamSession.findMany({
      where: { endedAt: { not: null }, channel: { is: { showcaseEnabled: true } } },
      orderBy: [{ endedAt: "desc" }],
      take: 8,
      select: {
        id: true, title: true, gameName: true, startedAt: true, endedAt: true, peakViewerCount: true,
        channel: { select: { displayName: true, login: true, user: { select: { username: true } } } },
      },
    }),
    // Members Discord reports as broadcasting. Those with a live verified channel
    // are already represented above, so only the remainder surface separately.
    db.discordStreamSignal.findMany({
      where: { streaming: true },
      orderBy: [{ observedAt: "desc" }],
      take: 12,
      select: {
        kind: true, streaming: true, streamUrl: true, activityName: true, channelName: true, observedAt: true, startedAt: true,
        user: { select: { username: true, displayName: true, name: true, image: true, twitchChannel: { select: { login: true, isLive: true, showcaseEnabled: true } } } },
      },
    }),
  ]);

  const toChannel = (row: typeof liveRows[number]): ShowcaseChannel => ({
    id: row.id,
    login: row.login,
    displayName: row.displayName,
    channelUrl: twitchChannelUrl(row.login),
    profileImageUrl: row.profileImageUrl,
    offlineImageUrl: row.offlineImageUrl,
    broadcasterType: row.broadcasterType,
    description: row.channelDescription,
    followerCount: row.followerCount,
    isLive: row.isLive,
    liveSince: row.liveSince,
    title: row.currentTitle,
    gameName: row.currentGameName,
    viewerCount: row.currentViewerCount,
    thumbnailUrl: twitchThumbnailUrl(row.thumbnailUrlTemplate, 640, 360),
    lastLiveAt: row.lastLiveAt,
    member: memberOf(row.user, row.displayName),
    discord: signalOf(row.user.discordStreamSignal, row.login),
  });

  const live = liveRows.map(toChannel);
  const liveLogins = new Set(live.map((channel) => channel.login));
  const viewerCounts = live.map((channel) => channel.viewerCount).filter((count): count is number => count !== null);

  return {
    integrationReady: Boolean(resolveTwitchProvider(process.env)),
    live,
    featured: selectFeaturedChannel(live),
    offline: offlineRows.map(toChannel),
    recentSessions: sessionRows.map((session) => ({
      id: session.id,
      title: session.title,
      gameName: session.gameName,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationSeconds: session.endedAt ? Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1_000) : null,
      peakViewerCount: session.peakViewerCount,
      channelDisplayName: session.channel.displayName,
      channelLogin: session.channel.login,
      memberUsername: session.channel.user.username,
    })),
    discordOnly: discordRows.flatMap((row) => {
      const verifiedLogin = row.user.twitchChannel?.login ?? null;
      const alreadyShown = Boolean(verifiedLogin && liveLogins.has(verifiedLogin));
      const signal = signalOf(row, verifiedLogin);
      return !alreadyShown && signal ? [{ member: memberOf(row.user, "Habitat member"), signal }] : [];
    }),
    embedParentHosts: parentHosts,
    totalViewers: viewerCounts.length > 0 ? viewerCounts.reduce((total, count) => total + count, 0) : null,
  };
}

/** Minimal live count for the header and Great Hall, kept cheap on purpose. */
export async function getLiveStreamSummary(): Promise<{ liveCount: number; topLogin: string | null; topDisplayName: string | null }> {
  const [liveCount, top] = await Promise.all([
    db.twitchChannel.count({ where: { showcaseEnabled: true, isLive: true } }),
    db.twitchChannel.findFirst({
      where: { showcaseEnabled: true, isLive: true },
      orderBy: [{ currentViewerCount: { sort: "desc", nulls: "last" } }, { liveSince: "asc" }],
      select: { login: true, displayName: true },
    }),
  ]);
  return { liveCount, topLogin: top?.login ?? null, topDisplayName: top?.displayName ?? null };
}
