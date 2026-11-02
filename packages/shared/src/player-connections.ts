export const playerGameSlugs = ["valheim", "palworld", "enshrouded", "project-zomboid", "7-days-to-die", "dragonwilds"] as const;
export type PlayerGameSlug = (typeof playerGameSlugs)[number];

export type PlayerGameConnection = {
  name: string;
  appId: number;
  port: number;
  steamPort: number | null;
  portKey: string;
  instructions: readonly string[];
};

// Player connection ports, deliberately separate from agent/admin telemetry ports.
export const playerGameConnections: Record<PlayerGameSlug, PlayerGameConnection> = {
  valheim: { name: "Valheim", appId: 892970, port: 2456, steamPort: 2457, portKey: "VALHEIM", instructions: ["Open Join Game, then Add server.", "Paste the full connection address above and select the server.", "Choose your character and enter the server password if asked."] },
  palworld: { name: "Palworld", appId: 1623730, port: 8211, steamPort: null, portKey: "PALWORLD", instructions: ["Open Join Multiplayer Game (Dedicated Server).", "Paste the full connection address into the box below the server list. If the game rejects the server name, use the IP fallback.", "Connect and enter the server password if asked."] },
  enshrouded: { name: "Enshrouded", appId: 1203620, port: 15637, steamPort: 15637, portKey: "ENSHROUDED", instructions: ["In Steam, open View > Game Servers > Favorites, then add a server.", "Paste the full connection address above. If Steam rejects the server name, use the IP fallback. This is the server's query port.", "Open Enshrouded, choose Play > Join, and select the favorited server. If an old favorite stops working, add the current address again."] },
  "project-zomboid": { name: "Project Zomboid", appId: 108600, port: 16261, steamPort: 16261, portKey: "PROJECT_ZOMBOID", instructions: ["Open Join and add a server to Favorites.", "Paste the server address and port into their separate fields. Use the IP fallback if the game rejects the server name.", "Enter your server account details and the server password if required, then join."] },
  "7-days-to-die": { name: "7 Days to Die", appId: 251570, port: 26900, steamPort: 26900, portKey: "SEVEN_DAYS_TO_DIE", instructions: ["Open Join a Game > Connect to IP.", "Paste the server address and port into their separate fields. Use the IP fallback if the game rejects the server name.", "Connect and enter the server password if asked."] },
  dragonwilds: { name: "RuneScape: Dragonwilds", appId: 1374490, port: 7777, steamPort: null, portKey: "DRAGONWILDS", instructions: ["Open Play and select the Direct IP Connection tab.", "Try the server address and port above. If this screen requires a numeric IP, open the IP fallback. For one address box, use the full address.", "Join the world and enter the world password if asked."] },
};

export function isPlayerGameSlug(value: string): value is PlayerGameSlug {
  return Object.hasOwn(playerGameConnections, value);
}

export type PlayerConnectionDetails = {
  // Numeric address remains available for Steam links and IP-only clients.
  address: string;
  hostname: string | null;
  port: number;
  // Preferred copy value uses the configured hostname when DNS is enabled.
  endpoint: string;
  ipEndpoint: string;
  steamUri: string | null;
  resolvedAt: string;
  expiresAt: string;
};

export type PlayerConnectionResult =
  | { status: "ready"; details: PlayerConnectionDetails; state: import("./worlds").ServerState }
  | { status: "unavailable" | "unconfigured" | "unauthorized"; message: string };
