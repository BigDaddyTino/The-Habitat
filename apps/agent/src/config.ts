import dotenv from "dotenv";
import { isIP } from "node:net";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { z } from "zod";

dotenv.config({ path: path.resolve(import.meta.dirname, "../.env"), quiet: true });

const serverKey = z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/);
const processName = z.string().regex(/^[A-Za-z0-9_.-]+$/);
const windowsServiceName = z.string().regex(/^[A-Za-z0-9_.-]{1,120}$/);
const privateIpv4 = z.string().refine(isPrivateIpv4, "must be a private IPv4 address");
const localQueryHost = z.string().refine(isLocalQueryHost, "must be loopback or a private IPv4 address");
const localLogPath = z.string().trim().min(3).max(500).refine(isLocalLogPath, "must be an absolute local Windows path");
const historySourceSchema = z.object({
  kind: z.enum(["VALHEIM_LOG", "STEAM_PLATFORM_LOG", "HABITAT_SESSION_JSONL"]),
  label: z.string().trim().min(1).max(80),
  path: localLogPath,
  maxBytes: z.number().int().min(1_024).max(67_108_864).default(33_554_432),
}).strict();
const queryBaseSchema = z.object({
  host: localQueryHost.default("127.0.0.1"),
  port: z.number().int().min(1).max(65535).optional(),
  timeoutMs: z.number().int().min(500).max(10_000).default(3_000),
  playerCountSupported: z.boolean().default(true),
}).strict();
const querySchema = z.union([
  queryBaseSchema.extend({ type: z.literal("palworld"), passwordEnv: z.literal("HABITAT_PALWORLD_ADMIN_PASSWORD").default("HABITAT_PALWORLD_ADMIN_PASSWORD") }),
  queryBaseSchema.extend({ type: z.string().trim().min(1).max(60).refine((value) => value !== "palworld", "Palworld queries must use the Palworld REST configuration") }),
]);

const serverConfigurationSchema = z.object({
  key: serverKey,
  displayName: z.string().trim().min(1).max(80),
  processName,
  processCommandLineIncludes: z.string().trim().min(1).max(200).refine((value) => !/[\r\n]/.test(value), "must not contain line breaks").optional(),
  executablePath: z.string().trim().min(1).max(500).optional(),
  installPath: z.string().trim().min(1).max(500).optional(),
  log: z.object({ type: z.literal("dragonwilds"), path: localLogPath }).strict().optional(),
  history: z.array(historySourceSchema).max(16).optional(),
  query: querySchema.optional(),
  control: z.object({
    serviceName: windowsServiceName,
    updateServiceName: windowsServiceName,
    timeoutMs: z.number().int().min(5_000).max(300_000).default(60_000),
  }).strict().optional(),
}).strict();

const configurationFileSchema = z.object({
  servers: z.array(serverConfigurationSchema).max(64).superRefine((servers, context) => {
    const keys = new Set<string>();
    for (const [index, server] of servers.entries()) {
      if (keys.has(server.key)) {
        context.addIssue({ code: "custom", message: `duplicate server key: ${server.key}`, path: [index, "key"] });
      }
      keys.add(server.key);
    }
  }),
}).strict();

export type AgentServerConfiguration = z.infer<typeof serverConfigurationSchema>;

export type AgentConfiguration = {
  bindHost: string;
  port: number;
  allowedIps: string[];
  token: string;
  servers: AgentServerConfiguration[];
};

export async function loadAgentConfiguration(environment = process.env): Promise<AgentConfiguration> {
  const token = environment.HABITAT_AGENT_TOKEN?.trim() ?? "";
  if (token.length < 32 || /[\r\n]/.test(token)) {
    throw new Error("HABITAT_AGENT_TOKEN must be at least 32 characters and contain no line breaks.");
  }

  const bindHost = environment.HABITAT_AGENT_BIND_HOST?.trim() ?? "";
  if (!isPrivateIpv4(bindHost) && bindHost !== "127.0.0.1") {
    throw new Error("HABITAT_AGENT_BIND_HOST must be one explicit private IPv4 address or 127.0.0.1.");
  }

  const allowedIps = (environment.HABITAT_AGENT_ALLOWED_IPS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (allowedIps.length === 0 || allowedIps.some((address) => !isAllowedClientAddress(address))) {
    throw new Error("HABITAT_AGENT_ALLOWED_IPS must list explicit private IPv4 addresses or loopback addresses.");
  }

  const port = Number(environment.HABITAT_AGENT_PORT ?? "4317");
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("HABITAT_AGENT_PORT must be a valid TCP port.");
  }

  const configurationPath = path.resolve(environment.HABITAT_AGENT_CONFIG_PATH ?? path.resolve(process.cwd(), "agent.config.json"));
  const rawConfiguration = await readFile(configurationPath, "utf8");
  const parsedConfiguration = configurationFileSchema.safeParse(JSON.parse(rawConfiguration.replace(/^\uFEFF/, "")));
  if (!parsedConfiguration.success) {
    throw new Error(`Invalid agent configuration: ${parsedConfiguration.error.issues.map((issue) => issue.message).join("; ")}`);
  }

  for (const server of parsedConfiguration.data.servers) {
    if (server.query?.type === "palworld" && !isUsableSecret(environment.HABITAT_PALWORLD_ADMIN_PASSWORD)) {
      throw new Error("HABITAT_PALWORLD_ADMIN_PASSWORD must be set when the Palworld REST query is configured.");
    }
  }

  return { bindHost, port, allowedIps, token, servers: parsedConfiguration.data.servers };
}

export function isPrivateIpv4(value: string): boolean {
  if (isIP(value) !== 4) return false;
  const [first, second] = value.split(".").map(Number);
  return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

function isAllowedClientAddress(value: string): boolean {
  return value === "127.0.0.1" || value === "::1" || isPrivateIpv4(value);
}

function isLocalQueryHost(value: string): boolean {
  return value === "127.0.0.1" || value === "::1" || isPrivateIpv4(value);
}

function isLocalLogPath(value: string): boolean {
  return /^[A-Za-z]:\\/.test(value) && !value.includes("..") && !value.startsWith("\\\\");
}

function isUsableSecret(value: string | undefined): boolean {
  return Boolean(value?.trim()) && !/[\r\n]/.test(value ?? "");
}
