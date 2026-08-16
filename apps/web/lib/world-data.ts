import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import type { ServerState } from "@habitat/shared";
import { filterToInstalledServerEventTypes } from "@/lib/server-event-types";

const db = getPrismaClient();

export type WorldView = {
  id: string;
  slug: string;
  game: string;
  worldName: string;
  state: ServerState;
  desiredState: ServerState;
  players: number | null;
  capacity: number | null;
  version: string | null;
  observedAt: Date | null;
  lastFire: string;
  ping: number | null;
  accent: "ember" | "moss" | "gold" | "sky" | "rose" | "violet";
  description: string;
  capabilityNote: string;
  enabled: boolean;
};

export const chronicleMomentKinds = ["arrival", "departure", "achievement", "record", "gathering", "rest", "danger", "world", "activity"] as const;
export type ChronicleMomentKind = (typeof chronicleMomentKinds)[number];
export type ChronicleEventView = {
  id: string;
  occurredAt: Date;
  world: string;
  worldSlug: string;
  text: string;
  sourceHref: string;
  permalinkHref: string;
  kind: ChronicleMomentKind;
  actor?: string;
  actorHref?: string;
};

export const chronicleGameTypes = ["VALHEIM", "PALWORLD", "ENSHROUDED", "SEVEN_DAYS_TO_DIE", "DRAGONWILDS", "PROJECT_ZOMBOID"] as const;
export const chronicleEventTypes = ["SERVER_STARTED", "SERVER_STOPPED", "SERVER_SLEEPING", "SERVER_CRASHED", "SERVER_UPDATED", "PLAYER_JOINED", "PLAYER_LEFT", "BOSS_KILLED", "WORLD_GATHERING", "ACHIEVEMENT_EARNED", "RECORD_BROKEN", "WAKE_REQUESTED", "WAKE_APPROVED", "WORLD_SAVED"] as const;
export const chronicleReactionTypes = ["SKULL", "FIRE", "FACEPALM", "CROWN", "SKILL_ISSUE"] as const;

export type ChronicleGameType = (typeof chronicleGameTypes)[number];
export type ChronicleEventType = (typeof chronicleEventTypes)[number];
export type ChronicleReactionType = (typeof chronicleReactionTypes)[number];
export type ChronicleQuery = { limit?: number; gameType?: ChronicleGameType; eventType?: ChronicleEventType; playerIdentityId?: string };
export type ChronicleReactionView = { reactionType: ChronicleReactionType; count: number; reacted: boolean };
export type ChronicleEventDetailView = ChronicleEventView & { reactions: ChronicleReactionView[] };

export const chronicleGameLabels: Record<ChronicleGameType, string> = {
  VALHEIM: "Valheim",
  PALWORLD: "Palworld",
  ENSHROUDED: "Enshrouded",
  SEVEN_DAYS_TO_DIE: "7 Days to Die",
  DRAGONWILDS: "RuneScape: Dragonwilds",
  PROJECT_ZOMBOID: "Project Zomboid",
};

export const chronicleEventLabels: Record<ChronicleEventType, string> = {
  SERVER_STARTED: "Server online",
  SERVER_STOPPED: "Server stopped",
  SERVER_SLEEPING: "Intentional rest",
  SERVER_CRASHED: "Unexpected stop",
  SERVER_UPDATED: "Update cycle",
  PLAYER_JOINED: "Player joined",
  PLAYER_LEFT: "Player left",
  BOSS_KILLED: "Boss defeated",
  WORLD_GATHERING: "World gathering",
  ACHIEVEMENT_EARNED: "Achievement earned",
  RECORD_BROKEN: "Record broken",
  WAKE_REQUESTED: "Wake requested",
  WAKE_APPROVED: "Wake approved",
  WORLD_SAVED: "World save",
};

const accents: Record<string, WorldView["accent"]> = {
  SEVEN_DAYS_TO_DIE: "rose",
  PROJECT_ZOMBOID: "moss",
  DRAGONWILDS: "violet",
  ENSHROUDED: "sky",
  PALWORLD: "gold",
  VALHEIM: "ember",
};

function formatLastFire(lastOnlineAt: Date | null) {
  if (!lastOnlineAt) return "No verified fire";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(lastOnlineAt);
}

function adapterNote(adapterType: string) {
  if (adapterType === "palworld-rest") return "Verified local authenticated REST query reports process state, capacity, player count, and version.";
  if (adapterType === "gamedig") return "Verified local game query reports process state, ping, capacity, and supported player counts.";
  if (adapterType === "dragonwilds") return "Verified process telemetry and lifecycle log heartbeats are live; player counts remain unavailable until a successful-join signal is proven.";
  return "Verified process telemetry is live; game query support is not configured.";
}

function toWorldView(server: Awaited<ReturnType<typeof getServerRecord>>): WorldView {
  const runtime = server.runtimeState;
  return {
    id: server.id,
    slug: server.slug,
    game: server.displayName,
    worldName: server.worldName,
    state: (runtime?.state ?? server.actualState) as ServerState,
    desiredState: server.desiredState as ServerState,
    players: runtime?.playerCount ?? null,
    capacity: runtime?.maxPlayers ?? server.maxPlayers,
    version: runtime?.version ?? server.currentVersion,
    observedAt: runtime?.observedAt ?? null,
    lastFire: formatLastFire(server.lastOnlineAt),
    ping: runtime?.pingMs ?? null,
    accent: accents[server.gameType] ?? "moss",
    description: server.description ?? "No public notes have been recorded for this world.",
    capabilityNote: adapterNote(server.adapterType),
    enabled: server.enabled,
  };
}

async function getServerRecord(slug: string) {
  return db.gameServer.findUniqueOrThrow({
    where: { slug },
    include: { runtimeState: true },
  });
}

export async function getWorlds() {
  const servers = await db.gameServer.findMany({
    include: { runtimeState: true },
    orderBy: { displayName: "asc" },
  });
  return servers.map((server) => toWorldView(server));
}

export async function getWorldBySlug(slug: string) {
  try {
    return toWorldView(await getServerRecord(slug));
  } catch {
    return null;
  }
}

export function isChronicleGameType(value: string | undefined): value is ChronicleGameType {
  return Boolean(value && chronicleGameTypes.includes(value as ChronicleGameType));
}

export function isChronicleEventType(value: string | undefined): value is ChronicleEventType {
  return Boolean(value && chronicleEventTypes.includes(value as ChronicleEventType));
}

/** Keeps a staged web rollout compatible until the additive enum migration lands. */
export async function getAvailableChronicleEventTypes(): Promise<ReadonlyArray<ChronicleEventType>> {
  return filterToInstalledServerEventTypes(chronicleEventTypes);
}

export async function getChronicleEvents({ limit = 50, gameType, eventType, playerIdentityId }: ChronicleQuery = {}): Promise<ChronicleEventView[]> {
  const take = Math.min(Math.max(limit, 1), 100);
  const includeActivities = !gameType && !playerIdentityId;
  const publicActivity = { OR: [{ sourceServerEventId: { not: null } }, { sourceClubMatchParticipant: { is: { clubGameProfile: { is: { displayPublic: true } } } } }] };
  const [events, awards, histories, promoted] = await Promise.all([
    db.serverEvent.findMany({ where: { ...(gameType ? { gameType } : {}), ...(eventType ? { eventType } : {}), ...(playerIdentityId ? { playerIdentityId } : {}) }, include: { server: { select: { displayName: true, slug: true } }, playerIdentity: { select: { id: true, userId: true, verifiedAt: true } } }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take }),
    includeActivities && (!eventType || eventType === "ACHIEVEMENT_EARNED") ? db.playerAchievement.findMany({ where: { sourceActivity: { is: publicActivity } }, include: { achievement: { select: { name: true } }, user: { select: { displayName: true, name: true, username: true } }, sourceActivity: { select: { id: true, gameKey: true } } }, orderBy: [{ awardedAt: "desc" }, { id: "desc" }], take }) : Promise.resolve([]),
    includeActivities && (!eventType || eventType === "RECORD_BROKEN") ? db.recordHistory.findMany({ where: { sourceActivity: { is: publicActivity } }, include: { definition: { select: { title: true } }, user: { select: { username: true } }, sourceActivity: { select: { id: true, gameKey: true } } }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take }) : Promise.resolve([]),
    includeActivities && !eventType ? db.gameActivity.findMany({ where: { chroniclePromotedAt: { not: null }, ...publicActivity }, include: { user: { select: { displayName: true, name: true, username: true } } }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take }) : Promise.resolve([]),
  ]);
  const activityAwards: ChronicleEventView[] = awards.flatMap((award) => award.sourceActivity ? [{ id: `award-${award.id}`, occurredAt: award.awardedAt, world: gameLabel(award.sourceActivity.gameKey), worldSlug: "marvel-rivals", text: `${memberName(award.user)} earned ${award.achievement.name}.`, sourceHref: gameHref(award.sourceActivity.gameKey), permalinkHref: `/chronicle/activity/${award.sourceActivity.id}`, kind: "achievement", actor: memberName(award.user), actorHref: award.user.username ? `/members/${award.user.username}` : undefined }] : []);
  const activityRecords: ChronicleEventView[] = histories.flatMap((history) => history.sourceActivity ? [{ id: `record-${history.id}`, occurredAt: history.occurredAt, world: gameLabel(history.sourceActivity.gameKey), worldSlug: "marvel-rivals", text: `${history.holderName} set a new record: ${history.definition.title}.`, sourceHref: gameHref(history.sourceActivity.gameKey), permalinkHref: `/chronicle/activity/${history.sourceActivity.id}`, kind: "record", actor: history.holderName, actorHref: history.user.username ? `/members/${history.user.username}` : undefined }] : []);
  const promotedActivities: ChronicleEventView[] = promoted.map((activity) => ({ id: `activity-${activity.id}`, occurredAt: activity.occurredAt, world: gameLabel(activity.gameKey), worldSlug: "marvel-rivals", text: activity.chronicleHeadline ?? `${memberName(activity.user)} recorded a verified ${activity.activityType.toLowerCase().replaceAll("_", " ")}.`, sourceHref: gameHref(activity.gameKey), permalinkHref: `/chronicle/activity/${activity.id}`, kind: "activity", actor: memberName(activity.user), actorHref: activity.user.username ? `/members/${activity.user.username}` : undefined }));
  return [...events.map(toChronicleEventView), ...activityAwards, ...activityRecords, ...promotedActivities].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime() || right.id.localeCompare(left.id)).slice(0, take);
}

export async function getChronicleEvent(eventId: string, viewerUserId?: string): Promise<ChronicleEventDetailView | null> {
  const event = await db.serverEvent.findUnique({ where: { id: eventId }, include: { server: { select: { displayName: true, slug: true } }, playerIdentity: { select: { id: true, userId: true, verifiedAt: true } }, reactions: { select: { reactionType: true, userId: true } } } });
  if (!event) return null;
  return {
    ...toChronicleEventView(event),
    reactions: chronicleReactionTypes.map((reactionType) => ({
      reactionType,
      count: event.reactions.filter((reaction) => reaction.reactionType === reactionType).length,
      reacted: Boolean(viewerUserId && event.reactions.some((reaction) => reaction.reactionType === reactionType && reaction.userId === viewerUserId)),
    })),
  };
}

function toChronicleEventView(event: { id: string; occurredAt: Date; eventType: string; actorText: string | null; valueText: string | null; playerIdentity?: { id: string; userId: string | null; verifiedAt: Date | null } | null; server: { displayName: string; slug: string } }): ChronicleEventView {
  // /chronicle/identity/[id] only resolves claimed + verified identities, so an unverified
  // sighting stays an unlinked name rather than a dead link that implies proven ownership.
  const identity = event.playerIdentity;
  return {
    id: event.id,
    occurredAt: event.occurredAt,
    world: event.server.displayName,
    worldSlug: event.server.slug,
    text: chronicleText(event.eventType, event.server.displayName, event.actorText, event.valueText),
    sourceHref: `/worlds/${event.server.slug}`,
    permalinkHref: `/chronicle/${event.id}`,
    kind: chronicleMomentKind(event.eventType),
    actor: event.actorText ?? undefined,
    actorHref: identity?.userId && identity.verifiedAt ? `/chronicle/identity/${identity.id}` : undefined,
  };
}

function chronicleMomentKind(eventType: string): ChronicleMomentKind {
  if (eventType === "PLAYER_JOINED") return "arrival";
  if (eventType === "PLAYER_LEFT") return "departure";
  if (eventType === "BOSS_KILLED" || eventType === "ACHIEVEMENT_EARNED") return "achievement";
  if (eventType === "RECORD_BROKEN") return "record";
  if (eventType === "WORLD_GATHERING") return "gathering";
  if (eventType === "SERVER_SLEEPING" || eventType === "SERVER_STOPPED") return "rest";
  if (eventType === "SERVER_CRASHED") return "danger";
  return "world";
}

function memberName(user: { displayName: string | null; name: string | null; username: string | null }) {
  return user.displayName ?? user.name ?? user.username ?? "A Habitat member";
}

function gameLabel(gameKey: string) {
  return gameKey === "MARVEL_RIVALS" ? "Marvel Rivals" : gameKey.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function gameHref(gameKey: string) {
  return gameKey === "MARVEL_RIVALS" ? "/club-games/marvel-rivals" : "/worlds";
}

function chronicleText(eventType: string, world: string, actorText: string | null, valueText: string | null) {
  if (eventType === "SERVER_STARTED") return `${world} came online.`;
  if (eventType === "SERVER_SLEEPING") return `${world} entered intentional rest.`;
  if (eventType === "SERVER_UPDATED") return `${world} entered an update cycle.`;
  if (eventType === "SERVER_CRASHED") return `${world} stopped unexpectedly.`;
  if (eventType === "PLAYER_JOINED" && actorText) return `${actorText} joined ${world}.`;
  if (eventType === "PLAYER_LEFT" && actorText) return `${actorText} left ${world}.`;
  if (eventType === "BOSS_KILLED") return `${actorText ? `${actorText} helped defeat` : "The server defeated"} a boss in ${world}${valueText ? `: ${valueText}` : ""}.`;
  if (eventType === "WORLD_GATHERING") return `Five or more players gathered in ${world}.`;
  if (eventType === "ACHIEVEMENT_EARNED" && actorText && valueText) return `${actorText} earned ${valueText}.`;
  if (eventType === "RECORD_BROKEN" && actorText && valueText) return `${actorText} set a new record: ${valueText}.`;
  if (eventType === "WAKE_REQUESTED" && actorText) return `${actorText} asked to light ${world}.`;
  if (eventType === "WAKE_APPROVED") return `${world} received an approved wake request.`;
  if (eventType === "WORLD_SAVED") return `${world} completed a verified world save.`;
  return `${world} recorded a verified event.`;
}
