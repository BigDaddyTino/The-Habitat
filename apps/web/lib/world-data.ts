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
  if (adapterType === "palworld-rest") return "Agent process observation is live; LAN-only REST remains planned.";
  if (adapterType === "gamedig") return "Agent process observation is live; game query support remains planned.";
  if (adapterType === "dragonwilds") return "Agent and log adapter planned.";
  return "Game query adapter planned.";
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
