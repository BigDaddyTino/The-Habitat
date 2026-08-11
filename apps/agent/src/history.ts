import { createHash } from "node:crypto";
import { open, readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { AgentLegacyHistory, AgentLegacyHistorySource, AgentLegacyPlayerEvidence } from "@habitat/shared";
import type { AgentServerConfiguration } from "./config.js";

const steamIdPattern = /\b(?:steam[_ :])?(7656119\d{10})\b/i;
const relevantSteamLine = /\b(join(?:ed|ing)?|connect(?:ed|ion|ing)?|login|log in|authenticated|player[ _-]?id)\b/i;
const valheimJoin = /\bGot connection SteamID\s+(7656119\d{10})\b/i;
const valheimLeave = /\bClosing socket\s+(7656119\d{10})\b/i;

export async function readLegacyHistory(server: AgentServerConfiguration): Promise<AgentLegacyHistory> {
  const sources = await Promise.all((server.history ?? []).map(readSource));
  return { key: server.key, scannedAt: new Date().toISOString(), sources };
}

async function readSource(configuration: NonNullable<AgentServerConfiguration["history"]>[number]): Promise<AgentLegacyHistorySource> {
  try {
    const files = await resolveSourceFiles(configuration.path);
    let remainingBytes = configuration.maxBytes;
    let truncated = files.length > 100;
    const evidence: AgentLegacyPlayerEvidence[] = [];
    let filesScanned = 0;
    for (const file of files.slice(0, 100)) {
      if (remainingBytes <= 0) { truncated = true; break; }
      const fileStats = await stat(file);
      const bytesToRead = Math.min(fileStats.size, remainingBytes);
      if (bytesToRead < fileStats.size) truncated = true;
      const handle = await open(file, "r");
      const buffer = Buffer.alloc(bytesToRead);
      try { await handle.read(buffer, 0, bytesToRead, 0); } finally { await handle.close(); }
      const contents = buffer.toString("utf8");
      remainingBytes -= bytesToRead;
      filesScanned += 1;
      evidence.push(...parseSource(configuration.kind, contents));
      if (evidence.length >= 5_000) { truncated = true; break; }
    }
    return { kind: configuration.kind, label: configuration.label, available: true, truncated, filesScanned, evidence: dedupeEvidence(evidence).slice(0, 5_000) };
  } catch {
    return { kind: configuration.kind, label: configuration.label, available: false, truncated: false, filesScanned: 0, evidence: [] };
  }
}

async function resolveSourceFiles(configuredPath: string): Promise<string[]> {
  const sourceStats = await stat(configuredPath);
  if (sourceStats.isFile()) return [configuredPath];
  if (!sourceStats.isDirectory()) return [];
  const entries = await readdir(configuredPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(?:log|txt|jsonl)$/i.test(entry.name))
    .map((entry) => path.join(configuredPath, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

export function parseLegacyHistory(kind: AgentLegacyHistorySource["kind"], contents: string): AgentLegacyPlayerEvidence[] {
  return dedupeEvidence(parseSource(kind, contents));
}

function parseSource(kind: AgentLegacyHistorySource["kind"], contents: string): AgentLegacyPlayerEvidence[] {
  if (kind === "VALHEIM_LOG") return parseValheimLog(contents);
  if (kind === "HABITAT_SESSION_JSONL") return parseSessionJsonl(contents);
  return parseSteamPlatformLog(contents);
}

function parseValheimLog(contents: string): AgentLegacyPlayerEvidence[] {
  const evidence: AgentLegacyPlayerEvidence[] = [];
  const openSessions = new Map<string, Array<{ occurredAt: string; record: string }>>();
  for (const line of contents.split(/\r?\n/)) {
    const occurredAt = parseLineTimestamp(line);
    if (!occurredAt) continue;
    const joined = valheimJoin.exec(line);
    if (joined?.[1]) {
      const pending = openSessions.get(joined[1]) ?? [];
      pending.push({ occurredAt, record: line });
      openSessions.set(joined[1], pending);
      continue;
    }
    const left = valheimLeave.exec(line);
    if (!left?.[1]) continue;
    const pending = openSessions.get(left[1]);
    const joinedSession = pending?.shift();
    if (!joinedSession) continue;
    const durationSeconds = Math.floor((new Date(occurredAt).getTime() - new Date(joinedSession.occurredAt).getTime()) / 1_000);
    if (durationSeconds < 0 || durationSeconds > 7 * 24 * 60 * 60) continue;
    evidence.push(makeEvidence("SESSION", left[1], joinedSession.occurredAt, occurredAt, durationSeconds, `${joinedSession.record}\n${line}`));
  }
  for (const [steamId, pending] of openSessions) {
    for (const session of pending) evidence.push(makeEvidence("PARTICIPATION", steamId, session.occurredAt, null, null, session.record));
  }
  return evidence;
}

function parseSteamPlatformLog(contents: string): AgentLegacyPlayerEvidence[] {
  const evidence: AgentLegacyPlayerEvidence[] = [];
  for (const line of contents.split(/\r?\n/)) {
    if (!relevantSteamLine.test(line)) continue;
    const steamId = steamIdPattern.exec(line)?.[1];
    const occurredAt = parseLineTimestamp(line);
    if (steamId && occurredAt) evidence.push(makeEvidence("PARTICIPATION", steamId, occurredAt, null, null, line));
  }
  return evidence;
}

function parseSessionJsonl(contents: string): AgentLegacyPlayerEvidence[] {
  const evidence: AgentLegacyPlayerEvidence[] = [];
  for (const line of contents.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let value: unknown;
    try { value = JSON.parse(line); } catch { continue; }
    if (!isRecord(value) || value.externalProvider !== "STEAM" || typeof value.externalAccountId !== "string" || !/^7656119\d{10}$/.test(value.externalAccountId)) continue;
    if (typeof value.occurredAt !== "string" || !isIsoDate(value.occurredAt)) continue;
    const displayName = typeof value.displayName === "string" && value.displayName.trim().length <= 80 ? value.displayName.trim() || null : null;
    if (typeof value.endedAt === "string" && isIsoDate(value.endedAt)) {
      const durationSeconds = Math.floor((new Date(value.endedAt).getTime() - new Date(value.occurredAt).getTime()) / 1_000);
      if (durationSeconds >= 0 && durationSeconds <= 7 * 24 * 60 * 60) evidence.push({ ...makeEvidence("SESSION", value.externalAccountId, value.occurredAt, value.endedAt, durationSeconds, line), displayName });
    } else {
      evidence.push({ ...makeEvidence("PARTICIPATION", value.externalAccountId, value.occurredAt, null, null, line), displayName });
    }
  }
  return evidence;
}

function makeEvidence(kind: AgentLegacyPlayerEvidence["kind"], steamId: string, occurredAt: string, endedAt: string | null, durationSeconds: number | null, record: string): AgentLegacyPlayerEvidence {
  return {
    kind,
    providerKey: steamId,
    displayName: null,
    externalProvider: "STEAM",
    externalAccountId: steamId,
    occurredAt,
    endedAt,
    durationSeconds,
    sourceRecordHash: createHash("sha256").update(record).digest("hex"),
  };
}

function parseLineTimestamp(line: string): string | null {
  const iso = /\b(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)\b/.exec(line)?.[1];
  if (iso && isIsoDate(iso)) return new Date(iso).toISOString();
  const unreal = /^\[(\d{4})\.(\d{2})\.(\d{2})-(\d{2})\.(\d{2})\.(\d{2}):(\d{3})]/.exec(line);
  if (unreal) return new Date(Date.UTC(Number(unreal[1]), Number(unreal[2]) - 1, Number(unreal[3]), Number(unreal[4]), Number(unreal[5]), Number(unreal[6]), Number(unreal[7]))).toISOString();
  const local = /\b(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\b/.exec(line);
  if (!local) return null;
  const parsed = new Date(Number(local[3]), Number(local[1]) - 1, Number(local[2]), Number(local[4]), Number(local[5]), Number(local[6]));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function dedupeEvidence(evidence: AgentLegacyPlayerEvidence[]) {
  return [...new Map(evidence.map((item) => [item.sourceRecordHash, item])).values()].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
}

function isIsoDate(value: string) {
  return !Number.isNaN(new Date(value).getTime()) && new Date(value).toISOString() === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
