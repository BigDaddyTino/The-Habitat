import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import os from "node:os";
import type { AddressInfo } from "node:net";
import type { AgentHealth, AgentServerStatus, AgentServerSummary } from "@habitat/shared";
import type { AgentConfiguration } from "./config.js";
import { observeServer } from "./observations.js";
import { hasValidAgentToken, normalizeRemoteAddress } from "./security.js";

const version = "0.1.0";

export function createAgentServer(configuration: AgentConfiguration) {
  const server = createServer(async (request, response) => {
    setSecurityHeaders(response);
    if (request.method !== "GET") return sendJson(response, 405, { error: "method_not_allowed" }, { Allow: "GET" });

    const remoteAddress = normalizeRemoteAddress(request.socket.remoteAddress);
    if (!remoteAddress || !configuration.allowedIps.includes(remoteAddress)) return sendJson(response, 403, { error: "forbidden" });
    if (!hasValidAgentToken(request.headers.authorization, configuration.token)) return sendJson(response, 401, { error: "unauthorized" });

    try {
      await handleGetRequest(request, response, configuration);
    } catch {
      sendJson(response, 503, { error: "observation_unavailable" });
    }
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  return server;
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
