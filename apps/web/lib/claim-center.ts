import type { ClaimConflict, ConflictSeverity, OwnershipImpact } from "@habitat/identity";

/**
 * Typed exactly, so a retroactive ownership change cannot be a stray click.
 * These live here rather than beside the actions because a `"use server"`
 * module may only export async functions.
 */
export const approvalConfirmationPhrase = "APPROVE";
export const rollbackConfirmationPhrase = "ROLL BACK";

export const severityLabels: Record<ConflictSeverity, string> = {
  BLOCKING: "Blocking",
  SEVERE: "Severe",
  WARNING: "Check",
  INFO: "Note",
};

/** Conflicts read top-down, worst first, so the reason to stop is never below the fold. */
const severityOrder: ConflictSeverity[] = ["BLOCKING", "SEVERE", "WARNING", "INFO"];

export function sortConflicts(conflicts: ClaimConflict[]): ClaimConflict[] {
  return [...conflicts].sort((left, right) => severityOrder.indexOf(left.severity) - severityOrder.indexOf(right.severity));
}

export function formatHours(seconds: number): string {
  const hours = seconds / 3_600;
  if (hours === 0) return "0";
  if (Math.abs(hours) < 10) return hours.toFixed(1);
  return Math.round(hours).toLocaleString("en-US");
}

export function formatSigned(value: number, fractionDigits = 0): string {
  const rendered = Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: fractionDigits });
  if (value === 0) return "no change";
  return `${value > 0 ? "+" : "−"}${rendered}`;
}

export function formatMemberName(user: { displayName?: string | null; name?: string | null; username?: string | null; email?: string | null } | null | undefined): string {
  return user?.displayName ?? user?.name ?? user?.username ?? user?.email ?? "Habitat member";
}

export function formatGame(gameType: string): string {
  return gameType.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\w/g, (match) => match.toUpperCase());
}

export function formatTimestamp(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export type ImpactRow = { label: string; value: string; muted?: boolean };

/** The numbers behind the headline, in the order an administrator checks them. */
export function impactRows(impact: OwnershipImpact): ImpactRow[] {
  return [
    { label: "Tracked hours", value: formatSigned(impact.delta.trackedHours, 1) },
    { label: "XP-bearing session hours", value: formatSigned(impact.delta.verifiedSessionSeconds / 3_600, 1) },
    { label: "Imported legacy hours", value: formatSigned(impact.delta.legacyEvidenceSeconds / 3_600, 1) },
    { label: "Sessions", value: formatSigned(impact.delta.sessionCount) },
    { label: "World joins", value: formatSigned(impact.delta.joinCount) },
    { label: "Total XP", value: formatSigned(impact.delta.totalXp) },
    { label: "Level", value: `${impact.before.level} → ${impact.after.level}` },
    { label: "Achievements", value: formatSigned(impact.delta.achievementCount) },
    { label: "Achievement points", value: formatSigned(impact.delta.achievementPoints) },
  ];
}

export const claimCenterNotices: Record<string, string> = {
  claim_approved: "Claim approved. The identity is attached and its verified history is queued for reconciliation.",
  claim_rejected: "Claim rejected. The identity remains unclaimed.",
  ownership_rolled_back: "Ownership rolled back. Playtime XP, achievements, rewards, and record holdings granted through this identity have been reversed.",
};

export const claimCenterErrors: Record<string, string> = {
  invalid_decision: "That claim decision was not understood. Nothing was changed.",
  invalid_rollback: "A rollback needs a reason of at least eight characters and a typed confirmation.",
  already_resolved: "That claim was already resolved by another administrator.",
  blocked_by_conflict: "A blocking conflict prevents this approval. Resolve it first — the identity may have been claimed in the meantime.",
  confirmation_required: "This change carries unresolved conflicts, so it requires the typed confirmation.",
  rollback_failed: "The rollback could not be completed and nothing was changed.",
  export_failed: "The member export could not be produced.",
};
