import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { codexBundleContractVersion, dialogueContentHashInput, type MartinoCodexSnapshot } from "@habitat/shared";
import { attachDialogue, buildDialogueLinesSidecar, dominantSpeaker, lineRecord, validateDialogue, voiceClipsIn } from "./dialogue";

/**
 * The properties the voice pipeline and the game importer depend on: a line's
 * id and hashes are pure functions of its content, the sidecar's bytes are
 * the same for the same input, and the gate refuses exactly the things the
 * contract says it must.
 */

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const writer = { displayName: "test" };
const stamp = "2026-09-02T00:00:00.000Z";

function snapshotWith(overrides: Partial<MartinoCodexSnapshot> = {}): MartinoCodexSnapshot {
  const arcId = "arc-1";
  const line = lineRecord("the-island-is-already-lost", "cold-open", { number: 1, order: 0, speakerSlug: "tino", speakerRole: null, listenerSlug: null, listenerRole: "player", text: "Eyes up. Eyes the fuck up.", performance: "tactical shout, not narration", intensity: 8, emotion: ["urgent", "command"], locale: "en-US", voiced: true });
  const radio = lineRecord("the-island-is-already-lost", "cold-open", { number: 2, order: 1, speakerSlug: null, speakerRole: "radio", listenerSlug: null, listenerRole: null, text: "We have movement under the streets.", performance: "", intensity: 9, emotion: ["afraid"], locale: "en-US", voiced: true });
  const node = (key: string, kind: string, extra: Record<string, unknown> = {}) => ({
    id: `node-${key}`, arcId, key, kind, title: key, summary: null, body: null, status: "CANON", speakerSlug: null, endingKind: null, completion: null, effects: [], rewards: [], continuesInArcSlug: null, canvasX: 0, canvasY: 0, version: 1, createdBy: writer, updatedBy: null, createdAt: stamp, updatedAt: stamp, ...extra,
  });
  return {
    contract: "martino-codex-snapshot",
    contractVersion: codexBundleContractVersion,
    generatedAt: stamp,
    revisionCursor: null,
    scope: { statuses: "ALL", entryKinds: "ALL", includesComments: true, includesRevisionHistory: true, excludesOperationalState: ["presence", "courtesy-locks", "assistant-audit", "auth", "export-tokens"] },
    arcs: [{ id: arcId, slug: "the-island-is-already-lost", title: "The Island", summary: null, hook: null, regionSlug: null, isMainline: true, category: "MAINLINE", companionSlug: null, factionSlug: null, status: "CANON", position: 0, lockedAt: null, createdBy: writer, lockedBy: null, createdAt: stamp, updatedAt: stamp }],
    nodes: [
      node("cold-open", "SCENE", { canvasY: 10, lines: [line, radio] }),
      node("defend-or-flee", "CHOICE", { canvasY: 20, options: [{ edgeKey: "choice-hold", toNodeKey: "hold", text: "Stay.", voiced: true, lineId: "the-island-is-already-lost/defend-or-flee/opt-choice-hold" }] }),
      node("hold", "ENDING", { canvasY: 30 }),
      node("empty-talk", "DIALOGUE", { canvasY: 5, lines: [], linesStatus: "NONE" }),
    ],
    edges: [{ id: "edge-1", arcId, key: "choice-hold", fromNodeId: "node-defend-or-flee", toNodeId: "node-hold", label: "Stay.", condition: null, effects: [], position: 0, voiced: true, status: "CANON", createdBy: writer, createdAt: stamp, updatedAt: stamp }],
    entries: [{ id: "entry-tino", kind: "CHARACTER", slug: "tino", title: "Tino", summary: null, body: null, meta: { voice: "Competent, vulgar.", voiceProfile: { sex: "male", ageRange: null, accent: null, timbre: null, pace: null, register: null, designPrompt: "Competent, vulgar.", referenceClipAssetId: null, consent: { kind: "SYNTHETIC_DESIGNED", statement: null, signedAt: null }, faceRig: "unknown" } }, status: "CANON", version: 1, createdBy: writer, updatedBy: null, createdAt: stamp, updatedAt: stamp }],
    links: [], comments: [], revisions: [], maps: [], placements: [], nodePlacements: [],
    ...overrides,
  };
}

test("a line's id, order and hashes are functions of its content and nothing else", () => {
  const line = snapshotWith().nodes[0].lines![0];
  assert.equal(line.lineId, "the-island-is-already-lost/cold-open/01");
  assert.equal(line.order, 1);
  assert.equal(line.contentHash, sha(dialogueContentHashInput("tino", "Eyes up. Eyes the fuck up.", "en-US")));
  assert.equal(line.directionHash, sha("tactical shout, not narration\n8\ncommand,urgent"));
  assert.equal(line.listenerSlug, "player");
  // The direction can change without touching the content hash: that is what
  // lets the pipeline regenerate only what actually changed.
  const redirected = lineRecord("the-island-is-already-lost", "cold-open", { number: 1, order: 0, speakerSlug: "tino", speakerRole: null, listenerSlug: null, listenerRole: null, text: "Eyes up. Eyes the fuck up.", performance: "whispered", intensity: 2, emotion: [], locale: "en-US", voiced: true });
  assert.equal(redirected.contentHash, line.contentHash);
  assert.notEqual(redirected.directionHash, line.directionHash);
});

test("the dominant speaker is the most frequent character, earliest on a tie, never a role", () => {
  const mk = (speakerSlug: string | null, speakerRole: string | null, n: number) => lineRecord("a", "b", { number: n, order: n, speakerSlug, speakerRole, listenerSlug: null, listenerRole: null, text: "x", performance: "", intensity: 5, emotion: [], locale: "en-US", voiced: true });
  assert.equal(dominantSpeaker([mk(null, "radio", 1), mk(null, "radio", 2), mk("tino", null, 3)]), "tino");
  assert.equal(dominantSpeaker([mk("rook", null, 1), mk("tino", null, 2), mk("tino", null, 3), mk("rook", null, 4)]), "rook");
  assert.equal(dominantSpeaker([mk(null, "radio", 1)]), null);
});

test("the sidecar is deterministic, sorted by arc then canvas then order, and names every speaker and role", () => {
  const snapshot = snapshotWith();
  const one = buildDialogueLinesSidecar(snapshot, { snapshotId: "s", generatedAt: stamp, sourceContentSha256: "" });
  const two = buildDialogueLinesSidecar(snapshotWith({ nodes: [...snapshot.nodes].reverse() }), { snapshotId: "s", generatedAt: stamp, sourceContentSha256: "" });
  assert.equal(JSON.stringify(one), JSON.stringify(two));
  assert.deepEqual(one.lines.map((line) => line.lineId), ["the-island-is-already-lost/cold-open/01", "the-island-is-already-lost/cold-open/02"]);
  assert.deepEqual(one.counts, { lines: 2, voiced: 2, speakers: 1, roles: 1 });
  assert.equal(one.speakers.tino.voiceStatus, "NONE");
  assert.equal(one.roles.radio.title, "Radio");
  assert.match(one.roles.radio.voiceProfile.designPrompt ?? "", /radio/i);
});

test("the gate passes a well-formed snapshot and reports per arc", () => {
  const snapshot = snapshotWith();
  const sidecar = buildDialogueLinesSidecar(snapshot, { snapshotId: "s", generatedAt: stamp, sourceContentSha256: "" });
  const verdict = validateDialogue(snapshot, sidecar);
  assert.deepEqual(verdict.problems, []);
  assert.ok(verdict.report.some((row) => row.startsWith("the-island-is-already-lost")));
});

test("the gate refuses what the contract says it must", () => {
  const snapshot = snapshotWith();
  const bad = structuredClone(snapshot);
  const lines = bad.nodes[0].lines!;
  lines[0] = { ...lines[0], text: "See [[the-soul-forge]] **now**", contentHash: "0".repeat(64) };
  lines[1] = { ...lines[1], speakerSlug: "nobody", speakerRole: "radio", lineId: lines[0].lineId };
  bad.nodes[1].options![0].edgeKey = "choice-missing";
  bad.nodes[3].linesStatus = undefined;
  const sidecar = buildDialogueLinesSidecar(bad, { snapshotId: "s", generatedAt: stamp, sourceContentSha256: "" });
  const { problems } = validateDialogue(bad, sidecar);
  const has = (pattern: RegExp) => assert.ok(problems.some((problem) => pattern.test(problem)), `expected a problem matching ${pattern}; got:\n${problems.join("\n")}`);
  has(/contains "\[\["/);
  has(/contentHash does not match/);
  has(/exactly one of speakerSlug and speakerRole/);
  has(/not a CHARACTER entry/);
  has(/lineId is not unique/);
  has(/edgeKey "choice-missing" is not an edge/);
  has(/linesStatus NONE/);
});

test("voice clips resolve onto the sheet by slug and default the pipeline status to NONE", () => {
  const clips = voiceClipsIn([{ logicalPath: "/images/characters/keyart/tino.png" }, { logicalPath: "/audio/voice-clips/tino.wav" }, { logicalPath: "/audio/voice-clips/Bad Name.wav" }]);
  assert.deepEqual([...clips.entries()], [["tino", "/audio/voice-clips/tino.wav"]]);
  const attached = attachDialogue(snapshotWith(), clips);
  const meta = attached.entries[0].meta as { voiceProfile: { referenceClipAssetId: string | null; designPrompt: string | null }; voiceStatus: string };
  assert.equal(meta.voiceProfile.referenceClipAssetId, "/audio/voice-clips/tino.wav");
  assert.equal(meta.voiceProfile.designPrompt, "Competent, vulgar.");
  assert.equal(meta.voiceStatus, "NONE");
});
