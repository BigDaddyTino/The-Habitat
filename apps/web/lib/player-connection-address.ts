import { Resolver } from "node:dns/promises";
import { isIPv4 } from "node:net";
import { isPlayerGameSlug, playerGameConnections, type PlayerConnectionDetails, type PlayerGameSlug } from "@habitat/shared";

type Environment = Record<string, string | undefined>;
export type AddressConfiguration = { source: "dns"; hostname: string } | { source: "public-ip" };
export type AddressObservation = { address: string; ttl: number };
type AddressSnapshot = { address: string; resolvedAt: string; expiresAt: string };

export function addressConfiguration(env: Environment): AddressConfiguration | null {
  if (env.HABITAT_PLAYER_CONNECTIONS_ENABLED !== "true") return null;
  if (env.HABITAT_PLAYER_ADDRESS_SOURCE === "public-ip") return { source: "public-ip" };
  if (env.HABITAT_PLAYER_ADDRESS_SOURCE !== "dns") throw new Error("Invalid player address source");
  const hostname = env.HABITAT_PLAYER_HOSTNAME?.trim().toLowerCase();
  if (!hostname || hostname.length > 253 || isIPv4(hostname) || !hostname.includes(".") ||
      !hostname.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    throw new Error("Invalid player hostname");
  }
  return { source: "dns", hostname };
}

export function isPublicPlayerIPv4(address: string): boolean {
  if (!isIPv4(address)) return false;
  const [a, b, c] = address.split(".").map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}

async function observeAddress(configuration: AddressConfiguration): Promise<AddressObservation> {
  if (configuration.source === "public-ip") {
    // Explicitly opted in only when web and game hosts share the same WAN egress.
    const response = await fetch("https://api.ipify.org?format=json", { cache: "no-store", signal: AbortSignal.timeout(2500), redirect: "error" });
    if (!response.ok) throw new Error("Address service unavailable");
    const body = await response.json() as { ip?: unknown };
    if (typeof body.ip !== "string") throw new Error("Invalid address response");
    return { address: body.ip, ttl: 30 };
  }
  const resolver = new Resolver({ timeout: 1500, tries: 1 });
  const timeout = setTimeout(() => resolver.cancel(), 2500);
  try {
    const records = await resolver.resolve4(configuration.hostname, { ttl: true });
    // More than one origin is ambiguous for these single-host game servers.
    if (records.length !== 1) throw new Error("Expected one player address");
    return { address: records[0].address, ttl: records[0].ttl };
  } finally {
    clearTimeout(timeout);
    resolver.cancel();
  }
}

export function createPlayerAddressResolver(observe = observeAddress, now = Date.now) {
  let cached: { key: string; value: AddressSnapshot } | undefined;
  let pending: { key: string; value: Promise<AddressSnapshot> } | undefined;
  return async (configuration: AddressConfiguration): Promise<AddressSnapshot> => {
    const key = JSON.stringify(configuration);
    if (cached?.key === key && Date.parse(cached.value.expiresAt) > now()) return cached.value;
    if (pending?.key === key) return pending.value;
    const value = observe(configuration).then((observation) => {
      if (!isPublicPlayerIPv4(observation.address) || !Number.isFinite(observation.ttl) || observation.ttl < 0) throw new Error("Invalid player address");
      const stamp = now();
      const result = { address: observation.address, resolvedAt: new Date(stamp).toISOString(), expiresAt: new Date(stamp + Math.max(1, Math.min(30, observation.ttl)) * 1000).toISOString() };
      cached = { key, value: result };
      return result;
    }).finally(() => { if (pending?.value === value) pending = undefined; });
    pending = { key, value };
    return value;
  };
}

export const resolvePlayerAddress = createPlayerAddressResolver();

function configuredPort(value: string | undefined, fallback: number): number {
  if (value === undefined || value === "") return fallback;
  if (!/^\d{1,5}$/.test(value) || Number(value) < 1 || Number(value) > 65535) throw new Error("Invalid player port");
  return Number(value);
}

export function playerConnectionDetails(slug: PlayerGameSlug, snapshot: AddressSnapshot, env: Environment): PlayerConnectionDetails {
  if (!isPlayerGameSlug(slug) || !isPublicPlayerIPv4(snapshot.address)) throw new Error("Invalid game connection");
  const game = playerGameConnections[slug];
  const port = configuredPort(env[`HABITAT_PLAYER_${game.portKey}_PORT`], game.port);
  const steamPort = game.steamPort === null ? null : configuredPort(env[`HABITAT_PLAYER_${game.portKey}_STEAM_PORT`], game.steamPort === game.port ? port : game.steamPort);
  const configuration = addressConfiguration(env);
  const hostname = configuration?.source === "dns" ? configuration.hostname : null;
  return { ...snapshot, hostname, port, endpoint: `${hostname ?? snapshot.address}:${port}`, ipEndpoint: `${snapshot.address}:${port}`, steamUri: steamPort === null ? null : `steam://connect/${snapshot.address}:${steamPort}` };
}
