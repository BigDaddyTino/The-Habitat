import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import os from "node:os";
import type { AddressInfo } from "node:net";
import type { AgentHealth, AgentServerAction, AgentServerStatus, AgentServerSummary } from "@habitat/shared";
import type { AgentConfiguration } from "./config.js";
import { readLegacyHistory } from "./history.js";
import { observeServer } from "./observations.js";
import { hasValidAgentToken, normalizeRemoteAddress } from "./security.js";
import { ServiceControlError, WindowsServiceController } from "./service-control.js";

const version = "0.1.0";
const agentServerActions = ["start", "stop", "restart", "update"] as const;

export function createAgentServer(configuration: AgentConfiguration) {
  const serviceController = new WindowsServiceController();
  const server = createServer(async (request, response) => {
    setSecurityHeaders(response);
    if (request.method !== "GET" && request.method !== "POST") return sendJson(response, 405, { error: "method_not_allowed" }, { Allow: "GET, POST" });

    const remoteAddress = normalizeRemoteAddress(request.socket.remoteAddress);
    if (!remoteAddress || !configuration.allowedIps.includes(remoteAddress)) return sendJson(response, 403, { error: "forbidden" });
    if (!hasValidAgentToken(request.headers.authorization, configuration.token)) return sendJson(response, 401, { error: "unauthorized" });

    try {
      if (request.method === "GET") await handleGetRequest(request, response, configuration);
      else await handlePostRequest(request, response, configuration, serviceController);
    } catch (error) {
      if (error instanceof InvalidRequestBodyError) return sendJson(response, 400, { error: "invalid_request_body" });
      if (error instanceof ServiceControlError) {
        const status = error.code === "control_not_configured" ? 404 : error.code === "service_stop_incomplete" ? 409 : error.code === "service_timeout" ? 504 : 503;
        return sendJson(response, status, { error: error.code });
      }
      sendJson(response, 503, { error: "observation_unavailable" });
    }
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  return server;
}

async function handlePostRequest(request: IncomingMessage, response: ServerResponse, configuration: AgentConfiguration, serviceController: WindowsServiceController): Promise<void> {
  const pathname = new URL(request.url ?? "/", "http://agent.local").pathname;
  const actionMatch = /^\/v1\/servers\/([a-z0-9][a-z0-9-]{0,62})\/actions\/(start|stop|restart|update)$/.exec(pathname);
  if (!actionMatch) return sendJson(response, 404, { error: "not_found" });
  await assertEmptyJsonBody(request);
  const configuredServer = configuration.servers.find((server) => server.key === actionMatch[1]);
  if (!configuredServer) return sendJson(response, 404, { error: "not_found" });
  const action = actionMatch[2] as AgentServerAction;
  if (!agentServerActions.includes(action)) return sendJson(response, 404, { error: "not_found" });
  const result = await serviceController.perform(configuredServer, action);
  return sendJson(response, result.accepted ? 202 : 409, result);
}

export async function startAgentServer(configuration: AgentConfiguration) {
  const server = createAgentServer(configuration);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(configuration.port, configuration.bindHost, () => {
      server.off("error", reject);
      resolve();
    });
  });
  return server;
}

export function getBoundAddress(server: ReturnType<typeof createAgentServer>): AddressInfo {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Agent did not bind to a TCP address.");
  return address;
}

async function handleGetRequest(request: IncomingMessage, response: ServerResponse, configuration: AgentConfiguration): Promise<void> {
  const pathname = new URL(request.url ?? "/", "http://agent.local").pathname;
  if (pathname === "/health") return sendJson(response, 200, getHealth());
  if (pathname === "/v1/servers") return sendJson(response, 200, getServers(configuration));

  const historyMatch = /^\/v1\/servers\/([a-z0-9][a-z0-9-]{0,62})\/history$/.exec(pathname);
  if (historyMatch) {
    const configuredServer = configuration.servers.find((server) => server.key === historyMatch[1]);
    if (!configuredServer) return sendJson(response, 404, { error: "not_found" });
    return sendJson(response, 200, await readLegacyHistory(configuredServer));
  }

  const statusMatch = /^\/v1\/servers\/([a-z0-9][a-z0-9-]{0,62})\/status$/.exec(pathname);
  if (!statusMatch) return sendJson(response, 404, { error: "not_found" });
  const configuredServer = configuration.servers.find((server) => server.key === statusMatch[1]);
  if (!configuredServer) return sendJson(response, 404, { error: "not_found" });

  const observed = await observeServer(configuredServer);
  const status: AgentServerStatus = { key: configuredServer.key, observedAt: new Date().toISOString(), ...observed };
  return sendJson(response, 200, status);
}

function getHealth(): AgentHealth {
  return { service: "habitat-agent", status: "ok", observedAt: new Date().toISOString(), hostname: os.hostname(), uptimeSeconds: Math.floor(os.uptime()), version };
}

function getServers(configuration: AgentConfiguration): AgentServerSummary[] {
  return configuration.servers.map(({ key, displayName }) => ({ key, displayName }));
}

function setSecurityHeaders(response: ServerResponse): void {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
}

function sendJson(response: ServerResponse, status: number, body: unknown, headers?: Record<string, string>): void {
  if (headers) for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
  response.writeHead(status);
  response.end(JSON.stringify(body));
}

class InvalidRequestBodyError extends Error {
  constructor() {
    super("invalid_request_body");
  }
}

async function assertEmptyJsonBody(request: IncomingMessage): Promise<void> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 1_024) throw new InvalidRequestBodyError();
    chunks.push(buffer);
  }
  if (size === 0) return;
  let parsed: unknown;
  try { parsed = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new InvalidRequestBodyError(); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || Object.keys(parsed).length !== 0) throw new InvalidRequestBodyError();
}
