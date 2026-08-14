import { getPrismaClient } from "@habitat/db/client";

/**
 * Records a reward-pipeline evaluation that threw.
 *
 * Before this existed, one poisoned record could abort an entire history import
 * and the only trace was a log line nobody was reading. Recording the failure
 * lets the surrounding loop skip that record and keep going, while the failure
 * itself stays visible on Habitat Pulse until that record succeeds on replay.
 *
 * The write deliberately uses its own connection rather than the caller's
 * transaction: the transaction that carried the failing evaluation is already
 * doomed, so anything written inside it would roll back with the error.
 */

export const evaluationFailureKinds = [
  "LEGACY_EVIDENCE",
  "LEGACY_EVENT",
  "ACHIEVEMENT_CATALOG",
  "IDENTITY_RECONCILIATION",
  "ACTIVITY_PROJECTION",
] as const;

export type EvaluationFailureKind = typeof evaluationFailureKinds[number];

export type EvaluationFailureInput = {
  kind: EvaluationFailureKind;
  /** Where it happened, in operator terms: a world slug, a source kind, a job name. */
  scope: string;
  /** The specific record, so the failure is reproducible rather than merely countable. */
  reference?: string | null;
  error: unknown;
};

export async function recordEvaluationFailure(input: EvaluationFailureInput, now = new Date()): Promise<void> {
  const message = input.error instanceof Error ? input.error.message : String(input.error);
  const scope = input.scope.slice(0, 120);
  const reference = input.reference ? input.reference.slice(0, 200) : null;
  try {
    const db = getPrismaClient();
    const existing = await db.evaluationFailure.findFirst({ where: { kind: input.kind, scope, reference, resolvedAt: null }, select: { id: true } });
    if (existing) await db.evaluationFailure.update({ where: { id: existing.id }, data: { message: message.slice(0, 300), occurredAt: now } });
    else await db.evaluationFailure.create({ data: { kind: input.kind, scope, reference, message: message.slice(0, 300), occurredAt: now } });
  } catch (recordingError) {
    // Never let bookkeeping about a failure become a second failure that stops
    // the import. The original error is already on its way to the log.
    console.error("[evaluation-failures] could not record a failure:", recordingError instanceof Error ? recordingError.message : String(recordingError));
  }
  console.error(`[evaluation-failures] ${input.kind} failed for ${input.scope}${input.reference ? ` (${input.reference})` : ""}:`, message);
}

/** Clears failures for records that have since been evaluated successfully. */
export async function resolveEvaluationFailures(kind: EvaluationFailureKind, references: readonly string[], scope?: string, now = new Date()): Promise<number> {
  if (references.length === 0) return 0;
  try {
    const result = await getPrismaClient().evaluationFailure.updateMany({
      where: {
        kind,
        resolvedAt: null,
        reference: { in: references.map((reference) => reference.slice(0, 200)) },
        ...(scope ? { scope: scope.slice(0, 120) } : {}),
      },
      data: { resolvedAt: now },
    });
    return result.count;
  } catch (error) {
    console.error("[evaluation-failures] could not resolve recovered failures:", error instanceof Error ? error.message : String(error));
    return 0;
  }
}
