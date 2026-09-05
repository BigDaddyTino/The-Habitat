import { randomUUID } from "node:crypto";
import { dialogueEmotionTags, dialogueTextProblem, isDialogueRole } from "@habitat/shared";
import type { Database } from "./story-authoring";

/**
 * Idempotent authoring for the voiced lines under a scene.
 *
 * Every line is keyed by `(node, number)`. A number is a frozen export identity
 * — the game addresses a clip by it — so a script never renumbers: a line that
 * moves is retired on its old number and written fresh on a new one. Text is
 * checked here as well as on save and on export, because a line the voice
 * pipeline cannot speak is a line nobody hears.
 */
export type LineSpeaker = { slug: string } | { role: string };
export type LineSpec = {
  number: number;
  speaker: LineSpeaker;
  listener?: LineSpeaker;
  text: string;
  performance?: string;
  intensity?: number;
  emotion?: string[];
  voiced?: boolean;
};
export type LineSet = { arc: string; node: string; lines: LineSpec[] };

export const c = (slug: string): LineSpeaker => ({ slug });
export const r = (role: string): LineSpeaker => ({ role });

const pad = (number: number) => String(number).padStart(2, "0");

export class LineWriter {
  readonly changes: string[] = [];
  private untouched = 0;
  constructor(private readonly db: Database, private readonly actorUserId: string, private readonly apply: boolean) {}

  /** Throws on the first unspeakable line so a dry run fails before anything is planned. */
  static validate(sets: readonly LineSet[]) {
    for (const set of sets) {
      const seen = new Set<number>();
      for (const line of set.lines) {
        const at = `${set.arc}/${set.node}/${pad(line.number)}`;
        if (seen.has(line.number)) throw new Error(`${at} is numbered twice.`);
        seen.add(line.number);
        const problem = dialogueTextProblem(line.text);
        if (problem) throw new Error(`${at} is not speakable: ${problem}`);
        for (const tag of line.emotion ?? []) {
          if (!(dialogueEmotionTags as readonly string[]).includes(tag)) throw new Error(`${at} uses an unknown emotion tag "${tag}".`);
        }
        for (const who of [line.speaker, line.listener]) {
          if (who && "role" in who && !isDialogueRole(who.role)) throw new Error(`${at} names a role "${who.role}" that is not kebab-case.`);
        }
        if (line.intensity !== undefined && (line.intensity < 1 || line.intensity > 10)) throw new Error(`${at} intensity is outside 1..10.`);
      }
    }
  }

  private async speakerData(speaker: LineSpeaker) {
    if ("slug" in speaker) {
      const row = await this.db.storyEntry.findUnique({ where: { slug: speaker.slug }, select: { id: true, kind: true } });
      if (!row || row.kind !== "CHARACTER") throw new Error(`speaker "${speaker.slug}" is not a CHARACTER in the bible`);
      return { speakerEntryId: row.id, speakerRole: null };
    }
    return { speakerEntryId: null, speakerRole: speaker.role };
  }

  private async listenerData(listener: LineSpeaker | undefined) {
    if (!listener) return { listenerEntryId: null, listenerRole: null };
    if ("slug" in listener) {
      const row = await this.db.storyEntry.findUnique({ where: { slug: listener.slug }, select: { id: true } });
      if (!row) throw new Error(`listener "${listener.slug}" is not in the bible`);
      return { listenerEntryId: row.id, listenerRole: null };
    }
    return { listenerEntryId: null, listenerRole: listener.role };
  }

  private async nodeId(arcSlug: string, nodeKey: string) {
    const arc = await this.db.storyArc.findUnique({ where: { slug: arcSlug }, select: { id: true } });
    if (!arc) throw new Error(`No arc "${arcSlug}".`);
    const node = await this.db.storyNode.findUnique({ where: { arcId_key: { arcId: arc.id, key: nodeKey } }, select: { id: true } });
    return node?.id ?? null;
  }

  async write(set: LineSet) {
    const nodeId = await this.nodeId(set.arc, set.node);
    if (!nodeId) {
      if (this.apply) throw new Error(`no scene ${set.arc}/${set.node} for its ${set.lines.length} lines`);
      this.changes.push(`(${set.lines.length} lines on ${set.arc}/${set.node} land after the scene is created)`);
      return;
    }
    for (const [index, spec] of set.lines.entries()) {
      const data = {
        ...(await this.speakerData(spec.speaker)),
        ...(await this.listenerData(spec.listener)),
        order: index,
        text: spec.text,
        performance: spec.performance ?? "",
        intensity: spec.intensity ?? 5,
        emotion: spec.emotion ?? [],
        locale: "en-US",
        voiced: spec.voiced ?? true,
        retiredAt: null as Date | null,
      };
      const label = `${set.arc}/${set.node}/${pad(spec.number)}`;
      const stored = await this.db.storyLine.findUnique({ where: { nodeId_number: { nodeId, number: spec.number } } });
      if (!stored) {
        this.changes.push(`create ${label} "${spec.text.slice(0, 48)}"`);
        if (this.apply) await this.db.storyLine.create({ data: { id: randomUUID(), nodeId, number: spec.number, createdByUserId: this.actorUserId, ...data } });
        continue;
      }
      const same = stored.speakerEntryId === data.speakerEntryId && stored.speakerRole === data.speakerRole
        && stored.listenerEntryId === data.listenerEntryId && stored.listenerRole === data.listenerRole
        && stored.order === data.order && stored.text === data.text && stored.performance === data.performance
        && stored.intensity === data.intensity && JSON.stringify(stored.emotion) === JSON.stringify(data.emotion)
        && stored.voiced === data.voiced && stored.retiredAt === null;
      if (same) { this.untouched += 1; continue; }
      this.changes.push(`update ${label}`);
      if (this.apply) await this.db.storyLine.update({ where: { id: stored.id }, data: { ...data, updatedByUserId: this.actorUserId } });
    }
  }

  async retire(arcSlug: string, nodeKey: string, numbers: readonly number[], because: string) {
    const nodeId = await this.nodeId(arcSlug, nodeKey);
    if (!nodeId) return;
    for (const number of numbers) {
      const stored = await this.db.storyLine.findUnique({ where: { nodeId_number: { nodeId, number } } });
      if (!stored || stored.retiredAt) { this.untouched += 1; continue; }
      this.changes.push(`retire ${arcSlug}/${nodeKey}/${pad(number)} — ${because}`);
      if (this.apply) await this.db.storyLine.update({ where: { id: stored.id }, data: { retiredAt: new Date(), updatedByUserId: this.actorUserId } });
    }
  }

  report(title: string) {
    console.log(`\n${title}: ${this.changes.length} change${this.changes.length === 1 ? "" : "s"}, ${this.untouched} already correct`);
    for (const change of this.changes) console.log(`  ${change}`);
  }
}
