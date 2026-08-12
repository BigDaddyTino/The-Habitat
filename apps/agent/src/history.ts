import { createHash } from "node:crypto";
import { open, readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { AgentLegacyHistory, AgentLegacyHistorySource, AgentLegacyPlayerEvent, AgentLegacyPlayerEvidence } from "@habitat/shared";
import type { AgentServerConfiguration } from "./config.js";

const steamIdPattern = /\b(?:steam[_ :])?(7656119\d{10})\b/i;
const relevantSteamLine = /\b(join(?:ed|ing)?|connect(?:ed|ion|ing)?|login|log in|authenticated|player[ _-]?id)\b/i;
const valheimJoin = /\bGot connection SteamID\s+(7656119\d{10})\b/i;
const valheimLeave = /\bClosing socket\s+(7656119\d{10})\b/i;

export async function readLegacyHistory(server: AgentServerConfiguration): Promise<AgentLegacyHistory> {
  const parsedSources = await Promise.all((server.history ?? []).map(readSource));
  const sources = server.key === "valheim" ? correlateValheimSteamIdentities(parsedSources) : parsedSources;
  return { key: server.key, scannedAt: new Date().toISOString(), sources };
}

async function readSource(configuration: NonNullable<AgentServerConfiguration["history"]>[number]): Promise<AgentLegacyHistorySource> {
  try {
    const files = await resolveSourceFiles(configuration.path);
    let remainingBytes = configuration.maxBytes;
    let truncated = files.length > 100;
    const evidence: AgentLegacyPlayerEvidence[] = [];
    const events: AgentLegacyPlayerEvent[] = [];
    let filesScanned = 0;
    for (const file of files.slice(0, 100)) {
      if (remainingBytes <= 0) { truncated = true; break; }
      const bytesToRead = Math.min(file.size, remainingBytes);
      const startOffset = Math.max(0, file.size - bytesToRead);
      if (bytesToRead < file.size) truncated = true;
      const handle = await open(file.path, "r");
      const buffer = Buffer.alloc(bytesToRead);
      try { await handle.read(buffer, 0, bytesToRead, startOffset); } finally { await handle.close(); }
      let contents = buffer.toString("utf8");
      if (startOffset > 0) contents = contents.replace(/^[^\r\n]*(?:\r?\n|$)/, "");
      remainingBytes -= bytesToRead;
      filesScanned += 1;
      const parsed = parseSource(configuration.kind, contents, file.path);
      evidence.push(...parsed.evidence);
      events.push(...parsed.events);
      if (evidence.length >= 5_000 || events.length >= 5_000) { truncated = true; break; }
    }
    return { kind: configuration.kind, label: configuration.label, available: true, truncated, filesScanned, evidence: dedupeEvidence(evidence).slice(0, 5_000), events: dedupeEvents(events).slice(0, 5_000) };
  } catch {
    return { kind: configuration.kind, label: configuration.label, available: false, truncated: false, filesScanned: 0, evidence: [], events: [] };
  }
}

async function resolveSourceFiles(configuredPath: string): Promise<Array<{ path: string; size: number; modifiedAt: number }>> {
  const sourceStats = await stat(configuredPath);
  if (sourceStats.isFile()) return [{ path: configuredPath, size: sourceStats.size, modifiedAt: sourceStats.mtimeMs }];
  if (!sourceStats.isDirectory()) return [];
  const entries = await readdir(configuredPath, { withFileTypes: true });
  const files = await Promise.all(entries
    .filter((entry) => entry.isFile() && /\.(?:log|txt|jsonl)$/i.test(entry.name))
    .map(async (entry) => {
      const filePath = path.join(configuredPath, entry.name);
      const fileStats = await stat(filePath);
      return { path: filePath, size: fileStats.size, modifiedAt: fileStats.mtimeMs };
    }));
  return files.sort((left, right) => right.modifiedAt - left.modifiedAt || right.path.localeCompare(left.path));
}

const valheimCorrelationWindowMs = 30_000;

/**
 * Valheim's server log proves Steam ownership while HabitatCore records the
 * visible character name. Correlate only mutually unique join timestamps, then
 * require a one-to-one SteamID/name mapping across the complete bounded scan.
 */
export function correlateValheimSteamIdentities(sources: AgentLegacyHistorySource[]): AgentLegacyHistorySource[] {
  const steamStarts = sources
    .filter((source) => source.available && source.kind === "VALHEIM_LOG")
    .flatMap((source) => source.evidence)
    .filter((item) => item.externalProvider === "STEAM" && item.externalAccountId)
    .map((item) => ({ steamId: item.externalAccountId!, occurredAt: new Date(item.occurredAt).getTime() }));
  const chronicleJoins = sources
    .filter((source) => source.available && source.kind === "HABITAT_CHRONICLE_LOG")
    .flatMap((source) => source.events)
    .filter((item) => item.eventType === "PLAYER_JOINED")
    .map((item) => ({ displayName: item.displayName, occurredAt: new Date(item.occurredAt).getTime() }));
  if (steamStarts.length === 0 || chronicleJoins.length === 0) return sources;

  const nameToSteamIds = new Map<string, Set<string>>();
  const steamIdToNames = new Map<string, Set<string>>();
  for (const chronicle of chronicleJoins) {
    const steamCandidates = steamStarts.filter((item) => Math.abs(item.occurredAt - chronicle.occurredAt) <= valheimCorrelationWindowMs);
    if (steamCandidates.length !== 1) continue;
    const steam = steamCandidates[0]!;
    const chronicleCandidates = chronicleJoins.filter((item) => Math.abs(item.occurredAt - steam.occurredAt) <= valheimCorrelationWindowMs);
    if (chronicleCandidates.length !== 1) continue;
    const normalizedName = chronicle.displayName.trim().toLocaleLowerCase("en-US");
    const steamIds = nameToSteamIds.get(normalizedName) ?? new Set<string>();
    steamIds.add(steam.steamId);
    nameToSteamIds.set(normalizedName, steamIds);
    const names = steamIdToNames.get(steam.steamId) ?? new Set<string>();
    names.add(normalizedName);
    steamIdToNames.set(steam.steamId, names);
  }

  const verifiedMapping = new Map<string, string>();
  for (const [name, steamIds] of nameToSteamIds) {
    if (steamIds.size !== 1) continue;
    const steamId = [...steamIds][0]!;
    if (steamIdToNames.get(steamId)?.size === 1) verifiedMapping.set(name, steamId);
  }
  if (verifiedMapping.size === 0) return sources;

  const enrich = <T extends AgentLegacyPlayerEvidence | AgentLegacyPlayerEvent>(item: T): T => {
    const normalizedName = item.displayName?.trim().toLocaleLowerCase("en-US");
    const steamId = normalizedName ? verifiedMapping.get(normalizedName) : null;
    return steamId ? { ...item, providerKey: steamId, externalProvider: "STEAM", externalAccountId: steamId } : item;
  };
  return sources.map((source) => source.kind === "HABITAT_CHRONICLE_LOG"
    ? { ...source, evidence: source.evidence.map(enrich), events: source.events.map(enrich) }
    : source);
}

export function parseLegacyHistory(kind: AgentLegacyHistorySource["kind"], contents: string, sourcePath?: string): AgentLegacyPlayerEvidence[] {
  return dedupeEvidence(parseSource(kind, contents, sourcePath).evidence);
}

export function parseLegacyHistoryEvents(kind: AgentLegacyHistorySource["kind"], contents: string, sourcePath?: string): AgentLegacyPlayerEvent[] {
  return dedupeEvents(parseSource(kind, contents, sourcePath).events);
}

function parseSource(kind: AgentLegacyHistorySource["kind"], contents: string, sourcePath?: string): { evidence: AgentLegacyPlayerEvidence[]; events: AgentLegacyPlayerEvent[] } {
  if (kind === "HABITAT_CHRONICLE_LOG") return parseHabitatChronicleLog(contents);
  if (kind === "PROJECT_ZOMBOID_LOG") return parseProjectZomboidLog(contents);
  if (kind === "ENSHROUDED_LOG") return parseEnshroudedLog(contents, sourcePath);
  if (kind === "SEVEN_DAYS_PLAYERS_XML") return parseSevenDaysPlayersXml(contents);
  if (kind === "DRAGONWILDS_LOG") return parseDragonwildsHistoryLog(contents);
  if (kind === "VALHEIM_LOG") return { evidence: parseValheimLog(contents), events: [] };
  if (kind === "HABITAT_SESSION_JSONL") return { evidence: parseSessionJsonl(contents), events: [] };
  return { evidence: parseSteamPlatformLog(contents), events: [] };
}

function parseSevenDaysPlayersXml(contents: string): { evidence: AgentLegacyPlayerEvidence[]; events: AgentLegacyPlayerEvent[] } {
  const evidence: AgentLegacyPlayerEvidence[] = [];
  const events: AgentLegacyPlayerEvent[] = [];
  for (const match of contents.matchAll(/<player\b([^>]*)>/gi)) {
    const attributes = parseXmlAttributes(match[1] ?? "");
    const steamId = attributes.nativeplatform?.toLocaleLowerCase("en-US") === "steam" ? attributes.nativeuserid : null;
    const displayName = attributes.playername?.trim() ?? "";
    const occurredAt = parseLocalDateTime(attributes.lastlogin ?? "");
    if (!steamId || !/^7656119\d{10}$/.test(steamId) || !isSafeDisplayName(displayName) || !occurredAt) continue;
    const record = match[0];
    const sourceRecordHash = hashRecord(record);
    evidence.push({ ...makeEvidence("PARTICIPATION", steamId, occurredAt, null, null, record), displayName });
    events.push({ eventType: "PLAYER_JOINED", providerKey: steamId, displayName, externalProvider: "STEAM", externalAccountId: steamId, occurredAt, valueText: "Recovered last login", sourceRecordHash });
  }
  return { evidence, events };
}

function parseDragonwildsHistoryLog(contents: string): { evidence: AgentLegacyPlayerEvidence[]; events: AgentLegacyPlayerEvent[] } {
  const evidence: AgentLegacyPlayerEvidence[] = [];
  const events: AgentLegacyPlayerEvent[] = [];
  for (const line of contents.split(/\r?\n/)) {
    const occurredAt = parseLineTimestamp(line);
    if (!occurredAt) continue;
    const match = /Player (ADDED to session|Removed from session) \[([^\]]{1,160})]-\[([^\]]{1,80})]/i.exec(line);
    if (!match?.[1] || !match[2] || !match[3]) continue;
    const account = match[2].trim();
    const displayName = match[3].trim();
    if (!account || !isSafeDisplayName(displayName)) continue;
    const providerKey = `dragonwilds:${hashRecord(account).slice(0, 32)}`;
    const sourceRecordHash = hashRecord(line);
    const eventType = match[1].toLocaleLowerCase("en-US").startsWith("added") ? "PLAYER_JOINED" : "PLAYER_LEFT";
    if (eventType === "PLAYER_JOINED") {
      evidence.push({ kind: "PARTICIPATION", providerKey, displayName, externalProvider: null, externalAccountId: null, occurredAt, endedAt: null, durationSeconds: null, sourceRecordHash });
    }
    events.push({ eventType, providerKey, displayName, externalProvider: null, externalAccountId: null, occurredAt, valueText: null, sourceRecordHash });
  }
  return { evidence, events };
}

function parseXmlAttributes(value: string) {
  const attributes: Record<string, string> = {};
  for (const match of value.matchAll(/([A-Za-z][A-Za-z0-9_-]*)="([^"]*)"/g)) {
    if (match[1] && match[2] !== undefined) attributes[match[1].toLocaleLowerCase("en-US")] = decodeXml(match[2]);
  }
  return attributes;
}

function decodeXml(value: string) {
  return value.replaceAll("&quot;", '"').replaceAll("&apos;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
}

function parseLocalDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6]));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseProjectZomboidLog(contents: string): { evidence: AgentLegacyPlayerEvidence[]; events: AgentLegacyPlayerEvent[] } {
  const evidence: AgentLegacyPlayerEvidence[] = [];
  const events: AgentLegacyPlayerEvent[] = [];
  for (const line of contents.split(/\r?\n/)) {
    if (!line.includes('"client-connect"')) continue;
    const match = /^\[(\d{2})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.\d{3}].*\bsteam-id=(7656119\d{10})\b.*\busername="([^"]{1,80})"/i.exec(line);
    if (!match) continue;
    const [, day, month, year, hour, minute, second, steamId, rawName] = match;
    if (!day || !month || !year || !hour || !minute || !second || !steamId || !rawName) continue;
    const displayName = rawName.trim();
    if (!isSafeDisplayName(displayName) || displayName === "null") continue;
    const parsed = new Date(2000 + Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    if (Number.isNaN(parsed.getTime())) continue;
    const occurredAt = parsed.toISOString();
    const sourceRecordHash = hashRecord(line);
    const item = { ...makeEvidence("PARTICIPATION", steamId, occurredAt, null, null, line), displayName };
    evidence.push(item);
    events.push({ eventType: "PLAYER_JOINED", providerKey: steamId, displayName, externalProvider: "STEAM", externalAccountId: steamId, occurredAt, valueText: null, sourceRecordHash });
  }
  return { evidence, events };
}

function parseEnshroudedLog(contents: string, sourcePath?: string): { evidence: AgentLegacyPlayerEvidence[]; events: AgentLegacyPlayerEvent[] } {
  const base = sourcePath ? parseEnshroudedFileDate(path.basename(sourcePath)) : null;
  if (!base) return { evidence: [], events: [] };
  const evidence: AgentLegacyPlayerEvidence[] = [];
  const events: AgentLegacyPlayerEvent[] = [];
  for (const line of contents.split(/\r?\n/)) {
    const match = /^\[I (\d{2,3}):(\d{2}):(\d{2}),(\d{3})].*Session accepted with peer \(steamid:(7656119\d{10})\)/i.exec(line);
    if (!match) continue;
    const [, hours, minutes, seconds, milliseconds, steamId] = match;
    if (!hours || !minutes || !seconds || !milliseconds || !steamId) continue;
    const occurredAt = new Date(base.getTime() + (Number(hours) * 3_600_000) + (Number(minutes) * 60_000) + (Number(seconds) * 1_000) + Number(milliseconds)).toISOString();
    const displayName = `Steam ${steamId.slice(-6)}`;
    const sourceRecordHash = hashRecord(`${path.basename(sourcePath ?? "")}:${line}`);
    evidence.push({ ...makeEvidence("PARTICIPATION", steamId, occurredAt, null, null, `${path.basename(sourcePath ?? "")}:${line}`), displayName });
    events.push({ eventType: "PLAYER_JOINED", providerKey: steamId, displayName, externalProvider: "STEAM", externalAccountId: steamId, occurredAt, valueText: null, sourceRecordHash });
  }
  return { evidence, events };
}

function parseEnshroudedFileDate(fileName: string): Date | null {
  const match = /^enshrouded_server_(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})\.log$/i.exec(fileName);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseHabitatChronicleLog(contents: string): { evidence: AgentLegacyPlayerEvidence[]; events: AgentLegacyPlayerEvent[] } {
  const firstSeen = new Map<string, AgentLegacyPlayerEvidence>();
  const events: AgentLegacyPlayerEvent[] = [];
  for (const line of contents.split(/\r?\n/)) {
    const fields = line.split("\t");
    if (fields.length < 4) continue;
    const [timestamp, kind, rawName, ...detailParts] = fields;
    if (!timestamp || !kind || !rawName || Number.isNaN(new Date(timestamp).getTime())) continue;
    const displayName = rawName.trim();
    const detail = detailParts.join(" ").trim();
    if (!isSafeDisplayName(displayName) || !detail || detail.length > 240) continue;
    const eventType = kind === "PLAYER" ? "PLAYER_JOINED" : kind === "DEATH" ? "PLAYER_DIED" : kind === "ACHIEVEMENT" ? "ACHIEVEMENT_EARNED" : kind === "RECORD" ? "RECORD_BROKEN" : null;
    if (!eventType) continue;
    const occurredAt = new Date(timestamp).toISOString();
    const providerKey = nativeProviderKey(displayName);
    const sourceRecordHash = hashRecord(line);
    if (!firstSeen.has(providerKey)) {
      firstSeen.set(providerKey, {
        kind: "PARTICIPATION",
        providerKey,
        displayName,
        externalProvider: null,
        externalAccountId: null,
        occurredAt,
        endedAt: null,
        durationSeconds: null,
        sourceRecordHash: hashRecord(`native-player:${providerKey}`),
      });
    }
    events.push({ eventType, providerKey, displayName, externalProvider: null, externalAccountId: null, occurredAt, valueText: eventType === "PLAYER_JOINED" ? null : detail, sourceRecordHash });
  }
  return { evidence: [...firstSeen.values()], events };
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
    sourceRecordHash: hashRecord(record),
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

function dedupeEvents(events: AgentLegacyPlayerEvent[]) {
  return [...new Map(events.map((item) => [item.sourceRecordHash, item])).values()].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
}

function nativeProviderKey(displayName: string) {
  return `native:${createHash("sha256").update(displayName.toLocaleLowerCase("en-US")).digest("hex").slice(0, 32)}`;
}

function hashRecord(record: string) {
  return createHash("sha256").update(record).digest("hex");
}

function isSafeDisplayName(value: string) {
  return value.length >= 1 && value.length <= 80 && !/[\u0000-\u001f\u007f]/.test(value);
}

function isIsoDate(value: string) {
  return !Number.isNaN(new Date(value).getTime()) && new Date(value).toISOString() === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
