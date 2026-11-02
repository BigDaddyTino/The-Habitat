import { randomUUID } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import type { AgentUpdateStatus } from "@habitat/shared";
import { isAgentUpdateStatus } from "./shared/agent.js";
import type { AgentServerConfiguration } from "./config.js";

export async function readUpdateStatus(server: AgentServerConfiguration): Promise<AgentUpdateStatus | null> {
  const statusPath = server.control?.updateStatusPath;
  if (!statusPath) return null;
  try {
    const contents = await readFile(statusPath, "utf8");
    if (contents.length > 4096) throw new Error("Invalid update status");
    const status: unknown = JSON.parse(contents.replace(/^\uFEFF/, ""));
    if (!isAgentUpdateStatus(status)) throw new Error("Invalid update status");
    return status;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error("Update status is unavailable");
  }
}

export async function queueUpdate(server: AgentServerConfiguration): Promise<AgentUpdateStatus> {
  const statusPath = server.control?.updateStatusPath;
  if (!statusPath) throw new Error("Update status is not configured");
  const stamp = new Date().toISOString();
  const status: AgentUpdateStatus = { operationId: randomUUID(), phase: "QUEUED", startedAt: stamp, updatedAt: stamp, errorCode: null };
  // Only paths from the private allow-list are used; callers cannot supply one.
  const temporary = `${statusPath}.${status.operationId}.tmp`;
  await writeFile(temporary, JSON.stringify(status), { encoding: "utf8", flag: "wx" });
  await rename(temporary, statusPath);
  return status;
}
