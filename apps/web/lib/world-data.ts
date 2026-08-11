import "@/lib/environment";
import { getPrismaClient } from "@habitat/db/client";
import type { ServerState } from "@habitat/shared";

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
  lastFire: string;
  ping: number | null;
  accent: "ember" | "moss" | "gold" | "sky" | "rose" | "violet";
  description: string;
  capabilityNote: string;
  enabled: boolean;
};

export type ChronicleEventView = { id: string; occurredAt: Date; world: string; worldSlug: string; text: string };

export const chronicleGameTypes = ["VALHEIM", "PALWORLD", "ENSHROUDED", "SEVEN_DAYS_TO_DIE", "DRAGONWILDS", "PROJECT_ZOMBOID"] as const;
export const chronicleEventTypes = ["SERVER_STARTED", "SERVER_STOPPED", "SERVER_SLEEPING", "SERVER_CRASHED", "SERVER_UPDATED", "PLAYER_JOINED", "PLAYER_LEFT", "ACHIEVEMENT_EARNED", "RECORD_BROKEN", "WAKE_REQUESTED", "WAKE_APPROVED", "WORLD_SAVED"] as const;
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

export async function getChronicleEvents({ limit = 50, gameType, eventType, playerIdentityId }: ChronicleQuery = {}): Promise<ChronicleEventView[]> {
  const events = await db.serverEvent.findMany({
    where: { ...(gameType ? { gameType } : {}), ...(eventType ? { eventType } : {}), ...(playerIdentityId ? { playerIdentityId } : {}) },
    include: { server: { select: { displayName: true, slug: true } } },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    take: Math.min(Math.max(limit, 1), 100),
  });
  return events.map(toChronicleEventView);
}

export async function getChronicleEvent(eventId: string, viewerUserId?: string): Promise<ChronicleEventDetailView | null> {
  const event = await db.serverEvent.findUnique({ where: { id: eventId }, include: { server: { select: { displayName: true, slug: true } }, reactions: { select: { reactionType: true, userId: true } } } });
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

function toChronicleEventView(event: { id: string; occurredAt: Date; eventType: string; actorText: string | null; valueText: string | null; server: { displayName: string; slug: string } }): ChronicleEventView {
  return { id: event.id, occurredAt: event.occurredAt, world: event.server.displayName, worldSlug: event.server.slug, text: chronicleText(event.eventType, event.server.displayName, event.actorText, event.valueText) };
}

function chronicleText(eventType: string, world: string, actorText: string | null, valueText: string | null) {
  if (eventType === "SERVER_STARTED") return `${world} came online.`;
  if (eventType === "SERVER_SLEEPING") return `${world} entered intentional rest.`;
  if (eventType === "SERVER_UPDATED") return `${world} entered an update cycle.`;
  if (eventType === "SERVER_CRASHED") return `${world} stopped unexpectedly.`;
  if (eventType === "PLAYER_JOINED" && actorText) return `${actorText} joined ${world}.`;
  if (eventType === "PLAYER_LEFT" && actorText) return `${actorText} left ${world}.`;
  if (eventType === "ACHIEVEMENT_EARNED" && actorText && valueText) return `${actorText} earned ${valueText}.`;
  if (eventType === "RECORD_BROKEN" && actorText && valueText) return `${actorText} set a new record: ${valueText}.`;
  if (eventType === "WAKE_REQUESTED" && actorText) return `${actorText} asked to light ${world}.`;
  if (eventType === "WAKE_APPROVED") return `${world} received an approved wake request.`;
  if (eventType === "WORLD_SAVED") return `${world} completed a verified world save.`;
  return `${world} recorded a verified event.`;
}
