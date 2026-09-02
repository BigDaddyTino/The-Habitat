import {
  codexDialogueLinesContractVersion,
  dialogueContentHashInput,
  dialogueDirectionHashInput,
  dialogueEmotionTags,
  dialogueLineId,
  dialogueOptionLineId,
  dialogueTextProblem,
  emptyVoiceProfile,
  isDialogueLocale,
  isDialogueRole,
  roleTitle,
  roleVoiceProfile,
  storyVoiceStatuses,
  type CodexDialogueLine,
  type CodexJsonValue,
  type CodexSnapshotNode,
  type DialogueLineRecord,
  type DialogueOptionRecord,
  type MartinoCodexDialogueLines,
  type MartinoCodexSnapshot,
  type StoryVoiceProfile,
  type StoryVoiceStatus,
} from "@habitat/shared";
import { sha256Bytes } from "./integrity";

/**
 * Voiced dialogue in the bundle (contract v5): the per-node line records with
 * their hashes, the voice profiles resolved against the drop-in clips, the
 * flattened `content/dialogue-lines.json` sidecar, and the validation that
 * fails a publish before a bad line reaches the share.
 */

type StoredLine = {
  number: number;
  order: number;
  speakerSlug: string | null;
  speakerRole: string | null;
  listenerSlug: string | null;
  listenerRole: string | null;
  text: string;
  performance: string;
  intensity: number;
  emotion: string[];
  locale: string;
  voiced: boolean;
};

/** One stored row as the snapshot carries it: identity and hashes attached. */
export function lineRecord(arcSlug: string, nodeKey: string, line: StoredLine): DialogueLineRecord {
  const speaker = line.speakerSlug ?? line.speakerRole ?? "";
  const emotion = [...line.emotion].sort();
  return {
    lineId: dialogueLineId(arcSlug, nodeKey, line.number),
    order: line.order + 1,
    speakerSlug: line.speakerSlug,
    speakerRole: line.speakerSlug ? null : line.speakerRole,
    listenerSlug: line.listenerSlug ?? line.listenerRole,
    text: line.text,
    performance: line.performance,
    intensity: line.intensity,
    emotion,
    locale: line.locale,
    voiced: line.voiced,
    contentHash: sha256Bytes(dialogueContentHashInput(speaker, line.text, line.locale)),
    directionHash: sha256Bytes(dialogueDirectionHashInput(line.performance, line.intensity, emotion)),
  };
}

/** The speaker a node reports (B4): the most frequent character among its lines, earliest first on a tie. */
export function dominantSpeaker(lines: readonly DialogueLineRecord[]): string | null {
  const counts = new Map<string, { count: number; first: number }>();
  lines.forEach((line, index) => {
    if (!line.speakerSlug) return;
    const entry = counts.get(line.speakerSlug);
    if (entry) entry.count += 1;
    else counts.set(line.speakerSlug, { count: 1, first: index });
  });
  let best: { slug: string; count: number; first: number } | null = null;
  for (const [slug, entry] of counts) {
    if (!best || entry.count > best.count || (entry.count === best.count && entry.first < best.first)) best = { slug, ...entry };
  }
  return best?.slug ?? null;
}

const voiceClipPrefix = "/audio/voice-clips/";

/** slug → logical path, for every voice clip among the bundle's assets. */
export function voiceClipsIn(assets: ReadonlyArray<{ logicalPath: string }>): Map<string, string> {
  const clips = new Map<string, string>();
  for (const asset of [...assets].sort((left, right) => left.logicalPath.localeCompare(right.logicalPath))) {
    if (!asset.logicalPath.startsWith(voiceClipPrefix)) continue;
    const file = asset.logicalPath.slice(voiceClipPrefix.length);
    const slug = file.replace(/\.[a-z0-9]+$/i, "");
    if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && !clips.has(slug)) clips.set(slug, asset.logicalPath);
  }
  return clips;
}

const isRecord = (value: unknown): value is Record<string, CodexJsonValue> => typeof value === "object" && value !== null && !Array.isArray(value);

function profileOf(meta: CodexJsonValue): StoryVoiceProfile | null {
  if (!isRecord(meta) || !isRecord(meta.voiceProfile)) return null;
  return meta.voiceProfile as unknown as StoryVoiceProfile;
}

function statusOf(meta: CodexJsonValue): StoryVoiceStatus {
  const value = isRecord(meta) ? meta.voiceStatus : null;
  return typeof value === "string" && (storyVoiceStatuses as readonly string[]).includes(value) ? value as StoryVoiceStatus : "NONE";
}

/**
 * Resolves what only the exporter knows onto the CHARACTER sheets: the
 * reference clip on the drop-in shelf, and a `voiceStatus` of NONE where the
 * pipeline has never written one. The sheet's own fields are untouched.
 */
export function attachDialogue(snapshot: MartinoCodexSnapshot, clips: Map<string, string>): MartinoCodexSnapshot {
  const entries = snapshot.entries.map((entry) => {
    if (entry.kind !== "CHARACTER" || !isRecord(entry.meta)) return entry;
    const clip = clips.get(entry.slug) ?? null;
    const stored = profileOf(entry.meta);
    const voiceProfile: StoryVoiceProfile | null = stored
      ? { ...stored, referenceClipAssetId: clip }
      : clip ? { ...emptyVoiceProfile(), referenceClipAssetId: clip } : null;
    const meta: Record<string, CodexJsonValue> = { ...entry.meta, voiceStatus: statusOf(entry.meta) };
    if (voiceProfile) meta.voiceProfile = voiceProfile as unknown as CodexJsonValue;
    return { ...entry, meta };
  });
  return { ...snapshot, entries };
}

/** The node order the sidecar sorts by: the arc, then the canvas top-down, left-right, then the key. */
function nodeOrder(left: CodexSnapshotNode, right: CodexSnapshotNode) {
  return left.canvasY - right.canvasY || left.canvasX - right.canvasX || left.key.localeCompare(right.key);
}

export function buildDialogueLinesSidecar(
  snapshot: MartinoCodexSnapshot,
  identity: { snapshotId: string; generatedAt: string; sourceContentSha256: string },
): MartinoCodexDialogueLines {
  const arcSlugById = new Map(snapshot.arcs.map((arc) => [arc.id, arc.slug]));
  const characterBySlug = new Map(snapshot.entries.filter((entry) => entry.kind === "CHARACTER").map((entry) => [entry.slug, entry]));
  const nodes = [...snapshot.nodes].sort((left, right) => {
    const arcs = (arcSlugById.get(left.arcId) ?? "").localeCompare(arcSlugById.get(right.arcId) ?? "");
    return arcs || nodeOrder(left, right);
  });
  const lines: CodexDialogueLine[] = [];
  const speakerSlugs = new Set<string>();
  const roles = new Set<string>();
  for (const node of nodes) {
    const arcSlug = arcSlugById.get(node.arcId);
    if (!arcSlug) continue;
    for (const line of [...(node.lines ?? [])].sort((left, right) => left.order - right.order)) {
      lines.push({ ...line, arcSlug, nodeKey: node.key, nodeKind: node.kind, nodeId: node.id });
      if (line.speakerSlug) speakerSlugs.add(line.speakerSlug);
      else if (line.speakerRole) roles.add(line.speakerRole);
    }
  }
  // Everyone who speaks, plus anyone the pipeline has already designed a
  // voice for: a designed voice is worth carrying before its first line.
  for (const entry of characterBySlug.values()) if (statusOf(entry.meta) !== "NONE") speakerSlugs.add(entry.slug);
  const speakers: MartinoCodexDialogueLines["speakers"] = {};
  for (const slug of [...speakerSlugs].sort()) {
    const entry = characterBySlug.get(slug);
    if (!entry) continue;
    speakers[slug] = { title: entry.title, voiceProfile: profileOf(entry.meta) ?? emptyVoiceProfile(), voiceStatus: statusOf(entry.meta) };
  }
  const roleProfiles: MartinoCodexDialogueLines["roles"] = {};
  for (const role of [...roles].sort()) roleProfiles[role] = { title: roleTitle(role), voiceProfile: roleVoiceProfile(role) };
  return {
    contract: "martino-codex-dialogue-lines",
    contractVersion: codexDialogueLinesContractVersion,
    snapshotId: identity.snapshotId,
    generatedAt: identity.generatedAt,
    sourceContentSha256: identity.sourceContentSha256,
    speakers,
    roles: roleProfiles,
    lines,
    counts: { lines: lines.length, voiced: lines.filter((line) => line.voiced).length, speakers: Object.keys(speakers).length, roles: Object.keys(roleProfiles).length },
  };
}

export type DialogueValidation = { problems: string[]; report: string[] };

/**
 * The gate (E). Every miss is a reason not to publish: an ambiguous line id,
 * a speaker the bible does not know, prose where spoken words should be, or a
 * hash that does not match its own content. The report is what a person
 * reads after a successful run: counts per arc, and the lines still waiting
 * for a speaker.
 */
export function validateDialogue(snapshot: MartinoCodexSnapshot, sidecar: MartinoCodexDialogueLines): DialogueValidation {
  const problems: string[] = [];
  const report: string[] = [];
  const characters = new Set(snapshot.entries.filter((entry) => entry.kind === "CHARACTER").map((entry) => entry.slug));
  const arcSlugById = new Map(snapshot.arcs.map((arc) => [arc.id, arc.slug]));
  const nodeKeyById = new Map(snapshot.nodes.map((node) => [node.id, node.key]));
  const seen = new Set<string>();
  const perArc = new Map<string, { nodes: number; dialogueNodes: number; withoutLines: number; lines: number; voiced: number; unattributed: number; options: number }>();
  const unattributed: string[] = [];
  const tally = (arcSlug: string) => {
    const row = perArc.get(arcSlug) ?? { nodes: 0, dialogueNodes: 0, withoutLines: 0, lines: 0, voiced: 0, unattributed: 0, options: 0 };
    perArc.set(arcSlug, row);
    return row;
  };

  for (const node of snapshot.nodes) {
    const arcSlug = arcSlugById.get(node.arcId) ?? node.arcId;
    const row = tally(arcSlug);
    row.nodes += 1;
    const at = `${arcSlug}/${node.key}`;
    if (node.kind === "DIALOGUE") {
      row.dialogueNodes += 1;
      if (!node.lines) problems.push(`${at}: a DIALOGUE node must carry lines (empty with linesStatus NONE)`);
      else if (node.lines.length === 0) {
        row.withoutLines += 1;
        if (node.linesStatus !== "NONE") problems.push(`${at}: a DIALOGUE node with no lines must say linesStatus NONE`);
      }
    } else if (node.linesStatus) problems.push(`${at}: linesStatus is only for DIALOGUE nodes`);

    for (const line of node.lines ?? []) {
      row.lines += 1;
      if (line.voiced) row.voiced += 1;
      const expectedPrefix = `${arcSlug}/${node.key}/`;
      if (!line.lineId.startsWith(expectedPrefix) || !/\/\d{2,}$/.test(line.lineId)) problems.push(`${line.lineId}: lineId does not follow <arc>/<node>/<nn>`);
      if (seen.has(line.lineId)) problems.push(`${line.lineId}: lineId is not unique`);
      seen.add(line.lineId);
      if ((line.speakerSlug === null) === (line.speakerRole === null)) problems.push(`${line.lineId}: exactly one of speakerSlug and speakerRole must be set`);
      if (line.speakerSlug && !characters.has(line.speakerSlug)) problems.push(`${line.lineId}: speaker "${line.speakerSlug}" is not a CHARACTER entry`);
      if (line.speakerRole && !isDialogueRole(line.speakerRole)) problems.push(`${line.lineId}: speakerRole "${line.speakerRole}" is not a role`);
      if (line.speakerRole === "unattributed") { row.unattributed += 1; unattributed.push(`${line.lineId}  "${line.text.slice(0, 70)}"`); }
      const textProblem = dialogueTextProblem(line.text);
      if (textProblem) problems.push(`${line.lineId}: text ${textProblem}`);
      if (!Number.isInteger(line.intensity) || line.intensity < 1 || line.intensity > 10) problems.push(`${line.lineId}: intensity must be 1..10`);
      for (const tag of line.emotion) if (!(dialogueEmotionTags as readonly string[]).includes(tag)) problems.push(`${line.lineId}: unknown emotion tag "${tag}"`);
      if (!isDialogueLocale(line.locale)) problems.push(`${line.lineId}: locale "${line.locale}" is not a locale`);
      const speaker = line.speakerSlug ?? line.speakerRole ?? "";
      if (sha256Bytes(dialogueContentHashInput(speaker, line.text, line.locale)) !== line.contentHash) problems.push(`${line.lineId}: contentHash does not match its content`);
      if (sha256Bytes(dialogueDirectionHashInput(line.performance, line.intensity, line.emotion)) !== line.directionHash) problems.push(`${line.lineId}: directionHash does not match its direction`);
    }

    if (node.options) {
      if (node.kind !== "CHOICE") problems.push(`${at}: options are only for CHOICE nodes`);
      const edgeKeys = new Set(snapshot.edges.filter((edge) => edge.fromNodeId === node.id).map((edge) => edge.key));
      for (const option of node.options) {
        row.options += 1;
        if (!edgeKeys.has(option.edgeKey)) problems.push(`${at}: option edgeKey "${option.edgeKey}" is not an edge out of this node`);
        if (option.lineId !== dialogueOptionLineId(arcSlug, node.key, option.edgeKey)) problems.push(`${at}: option lineId "${option.lineId}" does not follow <arc>/<node>/opt-<edgeKey>`);
        if (seen.has(option.lineId)) problems.push(`${option.lineId}: lineId is not unique`);
        seen.add(option.lineId);
        if (!option.text.trim()) problems.push(`${option.lineId}: an option needs text`);
        if (!nodeKeyById.has(snapshot.edges.find((edge) => edge.key === option.edgeKey && edge.fromNodeId === node.id)?.toNodeId ?? "")) problems.push(`${option.lineId}: option leads to a node that is not in the snapshot`);
      }
    }
  }

  // The sidecar is the same lines, flattened: same count, same ids, in order.
  const flat = new Set(sidecar.lines.map((line) => line.lineId));
  const snapshotLineIds = snapshot.nodes.flatMap((node) => (node.lines ?? []).map((line) => line.lineId));
  if (flat.size !== snapshotLineIds.length) problems.push(`dialogue-lines.json carries ${flat.size} lines; the snapshot carries ${snapshotLineIds.length}`);
  for (const lineId of snapshotLineIds) if (!flat.has(lineId)) problems.push(`dialogue-lines.json is missing ${lineId}`);
  for (const line of sidecar.lines) if (line.speakerSlug && !sidecar.speakers[line.speakerSlug]) problems.push(`dialogue-lines.json: speaker "${line.speakerSlug}" has no entry in speakers{}`);
  for (const line of sidecar.lines) if (line.speakerRole && !sidecar.roles[line.speakerRole]) problems.push(`dialogue-lines.json: role "${line.speakerRole}" has no entry in roles{}`);

  report.push(`${"arc".padEnd(40)} nodes  dialog  no-lines  lines  voiced  unattrib  options`);
  for (const [arcSlug, row] of [...perArc.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (row.lines === 0 && row.dialogueNodes === 0 && row.options === 0) continue;
    report.push(`${arcSlug.padEnd(40)} ${String(row.nodes).padStart(5)}  ${String(row.dialogueNodes).padStart(6)}  ${String(row.withoutLines).padStart(8)}  ${String(row.lines).padStart(5)}  ${String(row.voiced).padStart(6)}  ${String(row.unattributed).padStart(8)}  ${String(row.options).padStart(7)}`);
  }
  report.push(`${"TOTAL".padEnd(40)} ${String(snapshot.nodes.length).padStart(5)}  ${String([...perArc.values()].reduce((sum, row) => sum + row.dialogueNodes, 0)).padStart(6)}  ${String([...perArc.values()].reduce((sum, row) => sum + row.withoutLines, 0)).padStart(8)}  ${String(sidecar.counts.lines).padStart(5)}  ${String(sidecar.counts.voiced).padStart(6)}  ${String(unattributed.length).padStart(8)}  ${String([...perArc.values()].reduce((sum, row) => sum + row.options, 0)).padStart(7)}`);
  report.push(`speakers ${sidecar.counts.speakers} · roles ${sidecar.counts.roles} (${Object.keys(sidecar.roles).join(", ") || "none"})`);
  if (unattributed.length) {
    report.push("unattributed lines (role \"unattributed\", not voiced — a writer names the speaker in the Lines editor):");
    for (const line of unattributed) report.push(`  ${line}`);
  }
  return { problems, report };
}

export type { DialogueOptionRecord };
