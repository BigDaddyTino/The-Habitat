import { getPrismaClient } from "@habitat/db/client";

const steamIdPattern = /^7656119\d{10}$/;
const attemptedSteamIds = new Set<string>();

export function parseSteamPersonaXml(xml: string): string | null {
  if (xml.length > 262_144) return null;
  const cdata = /<steamID>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/steamID>/i.exec(xml)?.[1];
  const text = cdata ?? /<steamID>\s*([^<]*?)\s*<\/steamID>/i.exec(xml)?.[1];
  if (!text) return null;
  const name = decodeXml(text).trim();
  return isSafePersonaName(name) ? name : null;
}

export async function resolveSteamPersonaName(steamId: string, request: typeof fetch = fetch): Promise<string | null> {
  if (!steamIdPattern.test(steamId)) return null;
  try {
    const response = await request(`https://steamcommunity.com/profiles/${steamId}/?xml=1`, {
      headers: { accept: "application/xml,text/xml;q=0.9", "user-agent": "The-Habitat/0.1 identity-resolver" },
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok || Number(response.headers.get("content-length") ?? 0) > 262_144) return null;
    return parseSteamPersonaXml(await response.text());
  } catch {
    return null;
  }
}

export async function reconcileSteamIdentityNames(request: typeof fetch = fetch): Promise<number> {
  const db = getPrismaClient();
  const identities = await db.playerIdentity.findMany({
    where: { externalProvider: "STEAM", externalAccountId: { not: null } },
    select: { externalAccountId: true, displayName: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const names = new Map<string, string>();
  for (const identity of identities) {
    const steamId = identity.externalAccountId;
    if (!steamId || names.has(steamId) || isFallbackSteamName(identity.displayName, steamId) || !isSafePersonaName(identity.displayName)) continue;
    names.set(steamId, identity.displayName);
  }

  const unresolved = [...new Set(identities.map((identity) => identity.externalAccountId).filter((steamId): steamId is string => Boolean(steamId && !names.has(steamId) && !attemptedSteamIds.has(steamId))))].slice(0, 40);
  unresolved.forEach((steamId) => attemptedSteamIds.add(steamId));
  for (let offset = 0; offset < unresolved.length; offset += 4) {
    const batch = unresolved.slice(offset, offset + 4);
    const resolved = await Promise.all(batch.map(async (steamId) => [steamId, await resolveSteamPersonaName(steamId, request)] as const));
    for (const [steamId, name] of resolved) if (name && !isFallbackSteamName(name, steamId)) names.set(steamId, name);
  }

  let updated = 0;
  for (const [steamId, name] of names) {
    const fallback = fallbackSteamName(steamId);
    const result = await db.$transaction(async (transaction) => {
      const identitiesUpdated = await transaction.playerIdentity.updateMany({
        where: { externalProvider: "STEAM", externalAccountId: steamId, displayName: { in: [fallback, steamId, "Recovered player"] } },
        data: { displayName: name },
      });
      await transaction.serverEvent.updateMany({
        where: { actorText: { in: [fallback, steamId] }, playerIdentity: { is: { externalProvider: "STEAM", externalAccountId: steamId } } },
        data: { actorText: name },
      });
      return identitiesUpdated.count;
    });
    updated += result;
  }
  return updated;
}

function fallbackSteamName(steamId: string) {
  return `Steam ${steamId.slice(-6)}`;
}

function isFallbackSteamName(name: string, steamId: string) {
  return name === fallbackSteamName(steamId) || name === steamId || name === "Recovered player";
}

function isSafePersonaName(value: string) {
  return value.length >= 1 && value.length <= 80 && !/[\u0000-\u001f\u007f]/.test(value);
}

function decodeXml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => decodeCodePoint(code, 16))
    .replace(/&#(\d+);/g, (_, code: string) => decodeCodePoint(code, 10))
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function decodeCodePoint(value: string, radix: number) {
  const code = Number.parseInt(value, radix);
  return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
}
