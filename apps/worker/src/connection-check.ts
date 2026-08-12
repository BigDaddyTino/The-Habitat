import { getPrismaClient } from "@habitat/db/client";
import { resolveMarvelRivalsProvider } from "@habitat/shared";
import { checkAgentHealth } from "./agent-health.js";
import { loadWorkerConfiguration } from "./config.js";

type CheckState = "PASS" | "FAIL" | "SKIP";
type CheckResult = { name: string; state: CheckState; detail: string };

const db = getPrismaClient();
const results: CheckResult[] = [];

async function check(name: string, action: () => Promise<string>) {
  try {
    results.push({ name, state: "PASS", detail: await action() });
  } catch (error) {
    results.push({ name, state: "FAIL", detail: error instanceof Error ? error.message : "Unexpected check failure." });
  }
}

function skip(name: string, detail: string) {
  results.push({ name, state: "SKIP", detail });
}

function configuredPublicOrigin() {
  const raw = process.env.AUTH_URL?.trim();
  if (!raw) throw new Error("AUTH_URL is not configured.");
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("AUTH_URL must be a bare public HTTPS origin.");
  }
  return new URL(url.origin);
}

function timeoutSignal() {
  return AbortSignal.timeout(10_000);
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

async function main() {
  await check("Database", async () => {
    await db.$queryRaw`SELECT 1`;
    const [discordAccounts, verifiedSteamAccounts, steamProfiles, clubProfiles] = await Promise.all([
      db.account.count({ where: { provider: "discord" } }),
      db.userSocialAccount.count({ where: { platform: "STEAM", verifiedAt: { not: null }, providerAccountId: { not: null } } }),
      db.steamProfile.count(),
      db.clubGameProfile.count(),
    ]);
    return `reachable; ${discordAccounts} Discord account(s), ${verifiedSteamAccounts} verified Steam link(s), ${steamProfiles} Steam enrichment profile(s), ${clubProfiles} club profile(s)`;
  });

  let workerConfiguration: ReturnType<typeof loadWorkerConfiguration> | null = null;
  await check("Worker configuration", async () => {
    workerConfiguration = loadWorkerConfiguration();
    return "private agent URL, token, and polling intervals passed validation";
  });
  if (workerConfiguration) {
    await check("Private game agent", async () => {
      const health = await checkAgentHealth(workerConfiguration!.agentUrl.toString(), workerConfiguration!.agentToken);
      if (!health.healthy) throw new Error(`authenticated health probe failed (${health.reason})`);
      return `authenticated health probe passed; agent version ${health.health.version}`;
    });
  } else {
    skip("Private game agent", "worker configuration is invalid");
  }

  let origin: URL | null = null;
  await check("Public application origin", async () => {
    origin = configuredPublicOrigin();
    const response = await fetch(origin, { redirect: "error", signal: timeoutSignal() });
    if (!response.ok) throw new Error(`public site returned HTTP ${response.status}`);
    return `${origin.origin} is reachable over HTTPS`;
  });

  if (origin) {
    await check("Discord web authentication", async () => {
      if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
      if (!process.env.AUTH_DISCORD_ID?.trim() || !process.env.AUTH_DISCORD_SECRET?.trim()) throw new Error("Discord OAuth credentials are incomplete.");
      const response = await fetch(new URL("/api/auth/providers", origin!), { redirect: "error", signal: timeoutSignal() });
      if (!response.ok) throw new Error(`Auth.js provider discovery returned HTTP ${response.status}`);
      const providers = record(await response.json());
      const discord = record(providers?.discord);
      const expectedCallback = new URL("/api/auth/callback/discord", origin!).toString();
      if (discord?.callbackUrl !== expectedCallback) throw new Error("Auth.js did not publish the configured public Discord callback.");
      return `Auth.js publishes ${expectedCallback}`;
    });

    await check("Steam OpenID callback", async () => {
      const callback = new URL("/api/steam/callback", origin!);
      const realm = `${origin!.origin}/`;
      if (callback.protocol !== "https:" || callback.hostname === "localhost" || callback.hostname === "127.0.0.1") throw new Error("Steam callback still resolves to a local address.");
      return `realm ${realm} and return URL ${callback} are public`;
    });
  } else {
    skip("Discord web authentication", "public application origin is invalid");
    skip("Steam OpenID callback", "public application origin is invalid");
  }

  const steamKey = process.env.STEAM_WEB_API_KEY?.trim();
  if (!steamKey) {
    skip("Steam Web API", "STEAM_WEB_API_KEY is intentionally not configured");
  } else {
    await check("Steam Web API", async () => {
      if (!process.env.STEAM_DATA_STORAGE_COUNTRY?.trim()) throw new Error("STEAM_DATA_STORAGE_COUNTRY is required while Steam enrichment is enabled.");
      const target = new URL("https://api.steampowered.com/ISteamWebAPIUtil/GetSupportedAPIList/v1/");
      target.searchParams.set("key", steamKey);
      const response = await fetch(target, { redirect: "error", signal: timeoutSignal() });
      if (!response.ok) throw new Error(`credential check returned HTTP ${response.status}`);
      const body = record(await response.json());
      const apiList = record(body?.apilist);
      if (!Array.isArray(apiList?.interfaces)) throw new Error("credential check returned an invalid response");
      return `credential accepted; storage country is ${process.env.STEAM_DATA_STORAGE_COUNTRY.trim()}`;
    });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
  const applicationId = process.env.DISCORD_APPLICATION_ID?.trim();
  if (!botToken || !applicationId) {
    skip("Discord bot and guilds", "bot token or application ID is intentionally not configured");
  } else {
    await check("Discord bot and guilds", async () => {
      const headers = { authorization: `Bot ${botToken}`, accept: "application/json" };
      const applicationResponse = await fetch("https://discord.com/api/v10/oauth2/applications/@me", { headers, redirect: "error", signal: timeoutSignal() });
      if (!applicationResponse.ok) throw new Error(`application credential check returned HTTP ${applicationResponse.status}`);
      const application = record(await applicationResponse.json());
      if (application?.id !== applicationId) throw new Error("DISCORD_APPLICATION_ID does not belong to DISCORD_BOT_TOKEN.");
      if (process.env.AUTH_DISCORD_ID?.trim() === applicationId && origin) {
        const redirects = application.redirect_uris;
        const expectedCallback = new URL("/api/auth/callback/discord", origin).toString();
        if (!Array.isArray(redirects) || !redirects.includes(expectedCallback)) throw new Error("the public Discord OAuth callback is not registered on the Discord application");
      }
      const guilds = await db.discordGuildConfig.findMany({ select: { guildId: true } });
      for (const guild of guilds) {
        const guildResponse = await fetch(`https://discord.com/api/v10/guilds/${guild.guildId}`, { headers, redirect: "error", signal: timeoutSignal() });
        if (!guildResponse.ok) throw new Error(`bot cannot access one configured guild (HTTP ${guildResponse.status})`);
      }
      const callbackState = process.env.AUTH_DISCORD_ID?.trim() === applicationId ? "OAuth callback registered" : "OAuth uses a separate Discord application";
      return `token and application match; ${callbackState}; ${guilds.length} configured guild(s) reachable`;
    });
  }

  await check("Marvel Rivals provider", async () => {
    const provider = resolveMarvelRivalsProvider(process.env);
    if (!provider) return "intentionally disabled";
    const profiles = await db.clubGameProfile.findMany({ where: { gameType: "MARVEL_RIVALS" }, select: { syncStatus: true, lastSyncedAt: true } });
    const synchronized = profiles.filter((profile) => profile.lastSyncedAt !== null).length;
    return `${provider.source} selected; ${synchronized}/${profiles.length} linked profile(s) have a successful sync`;
  });

  for (const result of results) console.info(`${result.state.padEnd(4)} ${result.name}: ${result.detail}`);
  if (results.some((result) => result.state === "FAIL")) process.exitCode = 1;
}

void main()
  .catch((error: unknown) => {
    console.error("FAIL Connection audit:", error instanceof Error ? error.message : "Unexpected audit failure.");
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
