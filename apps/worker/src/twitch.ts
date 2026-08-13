import { getPrismaClient } from "@habitat/db/client";
import {
  resolveTwitchProvider,
  TWITCH_QUERY_BATCH_SIZE,
  TwitchApiError,
  twitchChannelUrl,
  twitchThumbnailUrl,
  type TwitchLiveStreamData,
} from "@habitat/shared";
import { queueDiscordNotification } from "./discord-notifications.js";
import { parseRequestBudget, reserveProviderRequests } from "./provider-budget.js";

/** Helix answers up to 100 ids per request, so one poll is one request. */
const LIVE_POLL_LIMIT = TWITCH_QUERY_BATCH_SIZE;
const THUMBNAIL_WIDTH = 640;
const THUMBNAIL_HEIGHT = 360;
/** Logins, avatars and follower totals move on human timescales, not stream timescales. */
const METADATA_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1_000;
const METADATA_FAILURE_DEFER_MS = 60 * 60 * 1_000;
/** A channel Twitch stops returning (renamed away, deleted, banned) is rechecked daily, never deleted. */
const METADATA_MISSING_DEFER_MS = 24 * 60 * 60 * 1_000;
const METADATA_BATCH_LIMIT = 25;

/**
 * Live status has no per-row scheduling column, so the poll cadence lives here.
 * The worker's provider scan may be configured faster than Twitch should be
 * polled; this keeps the daily request budget honest either way.
 */
let nextLivePollAt = 0;

export type TwitchLiveSummary = { enabled: boolean; polled: number; live: number; started: number; ended: number; failed: number };
export type TwitchMetadataSummary = { enabled: boolean; checked: number; updated: number; failed: number };

export type TwitchChannelLiveState = { twitchUserId: string; isLive: boolean; currentStreamId: string | null };
export type TwitchStreamTransition = "STARTED" | "CONTINUED" | "ENDED" | "STILL_OFFLINE";
export type TwitchTransitionPlan<TChannel extends TwitchChannelLiveState = TwitchChannelLiveState> = {
  channel: TChannel;
  isLive: boolean;
  transition: TwitchStreamTransition;
  stream: TwitchLiveStreamData | null;
  /** True only for the first observation of a broadcast, which is the one announcement. */
  announce: boolean;
};

/**
 * Decides what happened to every polled channel. Helix returns a row only while
 * a channel is broadcasting, so absence from the batch is the authoritative
 * offline signal rather than an unknown.
 */
export function planTwitchTransitions<TChannel extends TwitchChannelLiveState>(
  channels: readonly TChannel[],
  streams: readonly TwitchLiveStreamData[],
): Array<TwitchTransitionPlan<TChannel>> {
  const liveByTwitchUserId = new Map(streams.map((stream) => [stream.twitchUserId, stream] as const));
  return channels.map((channel) => {
    const stream = liveByTwitchUserId.get(channel.twitchUserId) ?? null;
    if (!stream) return { channel, isLive: false, transition: channel.isLive ? "ENDED" : "STILL_OFFLINE", stream: null, announce: false };
    // A different stream id on an already-live channel is a new broadcast: the
    // member ended one stream and started another between two polls.
    const continued = channel.isLive && channel.currentStreamId === stream.providerStreamId;
    return { channel, isLive: true, transition: continued ? "CONTINUED" : "STARTED", stream, announce: !continued };
  });
}

/** Peak viewers is a high-water mark; a missing observation must never erase a recorded one. */
export function mergePeakViewerCount(recorded: number | null, observed: number | null): number | null {
  if (observed === null) return recorded;
  if (recorded === null) return observed;
  return Math.max(recorded, observed);
}

/** Mirrors the Marvel Rivals backoff: exponential with jitter, capped, honouring Retry-After. */
export function twitchFailureState(consecutiveFailures: number, error: unknown, now: Date) {
  const failures = Math.max(0, consecutiveFailures) + 1;
  const retryAfterMs = error instanceof TwitchApiError && error.retryAfterSeconds !== null ? error.retryAfterSeconds * 1_000 : 0;
  const exponentialMs = Math.min(60 * 60 * 1_000, 60 * 1_000 * (2 ** Math.min(failures - 1, 6)));
  const jitterMs = Math.floor(exponentialMs * Math.random() * 0.1);
  return {
    failures,
    nextAttemptAt: new Date(now.getTime() + Math.max(retryAfterMs, exponentialMs + jitterMs)),
    message: (error instanceof TwitchApiError ? error.message : "Twitch did not answer the live poll; cached live state was kept.").slice(0, 180),
  };
}

/**
 * Stream titles are member-authored text that Habitat re-publishes into Discord,
 * where a bare "@everyone" would ping the guild. Mentions are defused and line
 * breaks flattened; nothing else about the member's words is changed.
 */
export function sanitizeBroadcastText(value: string | null, maximumLength: number): string | null {
  if (!value) return null;
  const flattened = value.replaceAll(/[\r\n\t]+/g, " ").replaceAll(/\s{2,}/g, " ").trim();
  if (!flattened) return null;
  // A zero-width space after every "@" leaves the text readable while making
  // "@everyone" inert.
  return flattened.replaceAll("@", "@\u200b").slice(0, maximumLength);
}

/** Composes the single go-live announcement, naming the member, the title and the game. */
export function streamAnnouncementContent(input: { memberName: string | null; displayName: string; login: string; title: string | null; gameName: string | null }): string {
  const name = sanitizeBroadcastText(input.memberName, 80) ?? sanitizeBroadcastText(input.displayName, 80) ?? "A Habitat member";
  const game = sanitizeBroadcastText(input.gameName, 120);
  const title = sanitizeBroadcastText(input.title, 200);
  const lines = [`**${name}** is live on Twitch${game ? ` playing **${game}**` : ""}.`];
  if (title) lines.push(title);
  lines.push(twitchChannelUrl(input.login) ?? `https://www.twitch.tv/${input.login}`);
  return lines.join("\n");
}

function clampColumn(value: string | null, maximumLength: number): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maximumLength) : null;
}

/** The DB CHECK constraint requires every live column to be NULL whenever isLive is false. */
function offlineChannelData(now: Date) {
  return {
    isLive: false,
    liveSince: null,
    currentStreamId: null,
    currentViewerCount: null,
    currentTitle: null,
    currentGameName: null,
    thumbnailUrlTemplate: null,
    syncStatus: "READY" as const,
    syncError: null,
    lastAttemptedAt: now,
    lastSyncedAt: now,
    consecutiveFailures: 0,
  };
}

type PolledChannel = TwitchChannelLiveState & {
  id: string;
  login: string;
  displayName: string;
  consecutiveFailures: number;
  user: { name: string | null };
};

async function recordLiveBroadcast(plan: TwitchTransitionPlan<PolledChannel>, stream: TwitchLiveStreamData, now: Date) {
  const db = getPrismaClient();
  const channel = plan.channel;
  const startedAt = new Date(stream.startedAt);
  const thumbnailUrl = clampColumn(twitchThumbnailUrl(stream.thumbnailUrlTemplate, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT), 500);
  await db.$transaction(async (transaction) => {
    const existing = await transaction.streamSession.findUnique({
      where: { channelId_providerStreamId: { channelId: channel.id, providerStreamId: stream.providerStreamId } },
      select: { id: true, peakViewerCount: true },
    });
    if (existing) {
      await transaction.streamSession.update({
        where: { id: existing.id },
        data: {
          title: stream.title,
          gameName: stream.gameName,
          lastObservedAt: now,
          observationCount: { increment: 1 },
          peakViewerCount: mergePeakViewerCount(existing.peakViewerCount, stream.viewerCount),
          // Helix can drop a stream from one batch and return the same id in the
          // next; the broadcast never actually ended, so reopen the row.
          endedAt: null,
          ...(thumbnailUrl ? { thumbnailUrl } : {}),
        },
      });
    } else {
      await transaction.streamSession.create({
        data: {
          channelId: channel.id,
          providerStreamId: stream.providerStreamId,
          title: stream.title,
          gameName: stream.gameName,
          startedAt,
          lastObservedAt: now,
          peakViewerCount: stream.viewerCount,
          observationCount: 1,
          thumbnailUrl,
        },
      });
    }
    await transaction.twitchChannel.update({
      where: { id: channel.id },
      data: {
        // Twitch owns the login; a member who renames must not leave a dead link.
        login: stream.login.slice(0, 40),
        displayName: stream.displayName.slice(0, 80),
        isLive: true,
        liveSince: startedAt,
        currentStreamId: stream.providerStreamId,
        currentTitle: stream.title,
        currentGameName: stream.gameName,
        currentViewerCount: stream.viewerCount,
        thumbnailUrlTemplate: clampColumn(stream.thumbnailUrlTemplate, 500),
        lastLiveAt: now,
        syncStatus: "READY",
        syncError: null,
        lastAttemptedAt: now,
        lastSyncedAt: now,
        consecutiveFailures: 0,
      },
    });
    if (!plan.announce) return;
    // Queued inside the channel transaction and keyed on the broadcast, so a
    // rolled-back write cannot announce and a re-observed poll cannot repeat.
    await queueDiscordNotification(transaction, {
      evidenceKey: `twitch:${channel.id}:${stream.providerStreamId}`,
      kind: "STREAM_WENT_LIVE",
      content: streamAnnouncementContent({ memberName: channel.user.name, displayName: stream.displayName, login: stream.login, title: stream.title, gameName: stream.gameName }),
    });
  });
}

async function closeBroadcast(channel: PolledChannel, now: Date) {
  const db = getPrismaClient();
  await db.$transaction(async (transaction) => {
    const open = await transaction.streamSession.findMany({ where: { channelId: channel.id, endedAt: null }, select: { id: true, startedAt: true } });
    for (const session of open) {
      // A CHECK constraint forbids ending before starting, so a stream observed
      // with a future start time closes at its own start rather than failing.
      await transaction.streamSession.update({ where: { id: session.id }, data: { endedAt: session.startedAt > now ? session.startedAt : now } });
    }
    await transaction.twitchChannel.update({ where: { id: channel.id }, data: offlineChannelData(now) });
  });
}

/**
 * Polls every showcased channel in one batched Helix request and records what
 * was actually observed: broadcasts opened, updated and closed, plus exactly one
 * Discord announcement per broadcast.
 */
export async function syncTwitchLiveStatus(): Promise<TwitchLiveSummary> {
  const provider = resolveTwitchProvider(process.env);
  if (!provider) return { enabled: false, polled: 0, live: 0, started: 0, ended: 0, failed: 0 };
  const idle: TwitchLiveSummary = { enabled: true, polled: 0, live: 0, started: 0, ended: 0, failed: 0 };
  if (Date.now() < nextLivePollAt) return idle;

  const db = getPrismaClient();
  const channels = await db.twitchChannel.findMany({
    where: { showcaseEnabled: true },
    orderBy: [{ isLive: "desc" }, { lastLiveAt: { sort: "desc", nulls: "last" } }, { connectedAt: "asc" }],
    take: LIVE_POLL_LIMIT,
    select: { id: true, twitchUserId: true, login: true, displayName: true, isLive: true, currentStreamId: true, consecutiveFailures: true, user: { select: { name: true } } },
  });
  nextLivePollAt = Date.now() + provider.livePollIntervalMs;
  if (channels.length === 0) return idle;

  const budget = parseRequestBudget(process.env.TWITCH_DAILY_REQUEST_BUDGET, 5_000);
  const requests = Math.ceil(channels.length / TWITCH_QUERY_BATCH_SIZE);
  if (!await reserveProviderRequests("TWITCH", requests, budget)) return idle;

  const now = new Date();
  let streams: TwitchLiveStreamData[];
  try {
    streams = await provider.fetchLiveStreams(channels.map((channel) => channel.twitchUserId));
  } catch (error) {
    // A failed poll is not evidence that anyone stopped streaming: only the
    // failure columns move, and the next poll is deferred with backoff.
    const failure = twitchFailureState(Math.max(...channels.map((channel) => channel.consecutiveFailures)), error, now);
    nextLivePollAt = Math.max(nextLivePollAt, failure.nextAttemptAt.getTime());
    await db.twitchChannel.updateMany({
      where: { id: { in: channels.map((channel) => channel.id) } },
      data: { syncStatus: "ERROR", syncError: failure.message, lastAttemptedAt: now, consecutiveFailures: { increment: 1 } },
    });
    console.error("[twitch] live poll failed:", failure.message);
    return { enabled: true, polled: channels.length, live: 0, started: 0, ended: 0, failed: channels.length };
  }

  const plans = planTwitchTransitions(channels, streams);
  let live = 0;
  let started = 0;
  let ended = 0;
  let failed = 0;
  for (const plan of plans) {
    try {
      if (plan.stream) {
        await recordLiveBroadcast(plan, plan.stream, now);
        live += 1;
        if (plan.transition === "STARTED") started += 1;
      } else if (plan.transition === "ENDED") {
        await closeBroadcast(plan.channel, now);
        ended += 1;
      }
    } catch (error) {
      failed += 1;
      console.error(`[twitch] live state write failed for channel ${plan.channel.login}:`, error instanceof Error ? error.message : String(error));
    }
  }
  const stillOffline = plans.filter((plan) => plan.transition === "STILL_OFFLINE").map((plan) => plan.channel.id);
  if (stillOffline.length > 0) {
    // One write keeps freshness honest for channels that were already offline
    // and re-asserts the NULL live columns the CHECK constraint requires.
    await db.twitchChannel.updateMany({ where: { id: { in: stillOffline } }, data: offlineChannelData(now) });
  }
  return { enabled: true, polled: channels.length, live, started, ended, failed };
}

/**
 * Slow pass for the parts of a channel that are not live state. A member can
 * rename their Twitch channel at any time, so the login is refreshed here as
 * well as during live polls.
 */
export async function syncTwitchChannelMetadata(): Promise<TwitchMetadataSummary> {
  const provider = resolveTwitchProvider(process.env);
  if (!provider) return { enabled: false, checked: 0, updated: 0, failed: 0 };

  const db = getPrismaClient();
  const now = new Date();
  const channels = await db.twitchChannel.findMany({
    where: { OR: [{ metadataNextAttemptAt: null }, { metadataNextAttemptAt: { lte: now } }] },
    orderBy: [{ metadataNextAttemptAt: { sort: "asc", nulls: "first" } }, { connectedAt: "asc" }],
    take: METADATA_BATCH_LIMIT,
    select: { id: true, twitchUserId: true, login: true },
  });
  if (channels.length === 0) return { enabled: true, checked: 0, updated: 0, failed: 0 };

  const budget = parseRequestBudget(process.env.TWITCH_DAILY_REQUEST_BUDGET, 5_000);
  if (!await reserveProviderRequests("TWITCH", 1, budget)) return { enabled: true, checked: 0, updated: 0, failed: 0 };

  let users: Awaited<ReturnType<typeof provider.fetchUsersById>>;
  try {
    users = await provider.fetchUsersById(channels.map((channel) => channel.twitchUserId));
  } catch (error) {
    // Channel decoration is not live state: a failure only defers the slow pass
    // and never touches syncStatus, which the showcase reads as live health.
    const retryAfterMs = error instanceof TwitchApiError && error.retryAfterSeconds !== null ? error.retryAfterSeconds * 1_000 : 0;
    const deferMs = Math.max(retryAfterMs, METADATA_FAILURE_DEFER_MS);
    await db.twitchChannel.updateMany({ where: { id: { in: channels.map((channel) => channel.id) } }, data: { metadataNextAttemptAt: new Date(now.getTime() + deferMs) } });
    console.error("[twitch] channel metadata refresh failed:", error instanceof TwitchApiError ? error.message : String(error));
    return { enabled: true, checked: channels.length, updated: 0, failed: channels.length };
  }

  const usersById = new Map(users.map((user) => [user.twitchUserId, user] as const));
  let updated = 0;
  let failed = 0;
  for (const channel of channels) {
    const user = usersById.get(channel.twitchUserId);
    try {
      if (!user) {
        await db.twitchChannel.update({ where: { id: channel.id }, data: { metadataNextAttemptAt: new Date(now.getTime() + METADATA_MISSING_DEFER_MS) } });
        failed += 1;
        continue;
      }
      // Follower totals are decoration and cost one request each; skipping them
      // when the budget is spent must not fail the rest of the refresh.
      const followerCount = await reserveProviderRequests("TWITCH", 1, budget) ? await provider.fetchFollowerCount(channel.twitchUserId) : null;
      await db.twitchChannel.update({
        where: { id: channel.id },
        data: {
          login: user.login.slice(0, 40),
          displayName: user.displayName.slice(0, 80),
          profileImageUrl: clampColumn(user.profileImageUrl, 500),
          offlineImageUrl: clampColumn(user.offlineImageUrl, 500),
          broadcasterType: clampColumn(user.broadcasterType, 20),
          channelDescription: clampColumn(user.description, 500),
          ...(followerCount === null ? {} : { followerCount }),
          metadataNextAttemptAt: new Date(now.getTime() + METADATA_REFRESH_INTERVAL_MS),
        },
      });
      updated += 1;
    } catch (error) {
      failed += 1;
      console.error(`[twitch] channel metadata write failed for ${channel.login}:`, error instanceof Error ? error.message : String(error));
    }
  }
  return { enabled: true, checked: channels.length, updated, failed };
}
