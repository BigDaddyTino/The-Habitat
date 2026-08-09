export const serverStates = [
  "ONLINE",
  "STARTING",
  "STOPPING",
  "SLEEPING",
  "UPDATING",
  "DEGRADED",
  "DOWN_UNEXPECTEDLY",
  "UNKNOWN",
] as const;

export type ServerState = (typeof serverStates)[number];

export type World = {
  slug: string;
  game: string;
  worldName: string;
  state: ServerState;
  players: number | null;
  capacity: number | null;
  version: string;
  lastFire: string;
  ping: number | null;
  accent: "ember" | "moss" | "gold" | "sky" | "rose" | "violet";
  description: string;
  capabilityNote: string;
};

export const worlds: World[] = [
  {
    slug: "valheim",
    game: "Valheim",
    worldName: "Habitat Valhalla",
    state: "ONLINE",
    players: 4,
    capacity: 10,
    version: "0.221.9",
    lastFire: "Now",
    ping: 34,
    accent: "ember",
    description: "A quiet coast, an unreasonable number of portals, and one tree with a grudge.",
    capabilityNote: "Public-mode query expected; crossplay player count is treated as unsupported.",
  },
  {
    slug: "project-zomboid",
    game: "Project Zomboid",
    worldName: "Knox Country",
    state: "ONLINE",
    players: 3,
    capacity: 16,
    version: "42.12",
    lastFire: "Now",
    ping: 42,
    accent: "moss",
    description: "The neighborhood watch has become a little too hands-on.",
    capabilityNote: "Valve query and logs are planned as the initial data sources.",
  },
  {
    slug: "palworld",
    game: "Palworld",
    worldName: "Habitat Preserve",
    state: "SLEEPING",
    players: null,
    capacity: 32,
    version: "v0.7.1",
    lastFire: "Yesterday, 1:18 AM",
    ping: null,
    accent: "gold",
    description: "The pals are resting. Management is pretending this is humane.",
    capabilityNote: "LAN-only official REST API; no management API is exposed publicly.",
  },
  {
    slug: "enshrouded",
    game: "Enshrouded",
    worldName: "The Embervale",
    state: "SLEEPING",
    players: null,
    capacity: 16,
    version: "1.7.2",
    lastFire: "Friday, 11:02 PM",
    ping: null,
    accent: "sky",
    description: "A little smoke in the air never hurt anyone. Probably.",
    capabilityNote: "Basic query, process state, and stable logs are the initial scope.",
  },
  {
    slug: "7-days-to-die",
    game: "7 Days to Die",
    worldName: "Navezgane After Hours",
    state: "UPDATING",
    players: null,
    capacity: 12,
    version: "2.4",
    lastFire: "18 minutes ago",
    ping: null,
    accent: "rose",
    description: "The blood moon has been rescheduled for maintenance.",
    capabilityNote: "Status comes first; richer Telnet data remains private and optional.",
  },
  {
    slug: "dragonwilds",
    game: "RuneScape: Dragonwilds",
    worldName: "The Wild Country",
    state: "SLEEPING",
    players: null,
    capacity: 6,
    version: "0.11",
    lastFire: "Thursday, 12:41 AM",
    ping: null,
    accent: "violet",
    description: "Surveying dangerous wildlife with almost no paperwork.",
    capabilityNote: "Starts with agent process state and official log output.",
  },
];

export const chronicle = [
  { time: "22:41", kind: "death", text: "Torstein met a falling tree in Valheim." },
  { time: "22:42", kind: "achievement", text: "Torstein earned Forestry Victim." },
  { time: "22:48", kind: "join", text: "Gunnar joined Habitat Valhalla." },
  { time: "23:03", kind: "record", text: "Valheim population reached four." },
  { time: "23:57", kind: "server", text: "Palworld settled in for the night." },
];
