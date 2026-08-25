export const atlasFindingSeverities = ["INFO", "WARNING", "ERROR", "FATAL"] as const;
export type AtlasFindingSeverity = (typeof atlasFindingSeverities)[number];

export type AtlasValidationFinding = {
  readonly severity: AtlasFindingSeverity;
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type AtlasValidationResult<T> = {
  readonly valid: boolean;
  readonly value: T | null;
  readonly findings: readonly AtlasValidationFinding[];
};

export const atlasFindingSeverityRank: Readonly<Record<AtlasFindingSeverity, number>> = {
  INFO: 0,
  WARNING: 1,
  ERROR: 2,
  FATAL: 3,
};

export function atlasFinding(severity: AtlasFindingSeverity, code: string, path: string, message: string): AtlasValidationFinding {
  return { severity, code, path, message };
}

export function atlasValidationResult<T>(value: T | null, findings: readonly AtlasValidationFinding[]): AtlasValidationResult<T> {
  return { valid: !findings.some((finding) => atlasFindingSeverityRank[finding.severity] >= atlasFindingSeverityRank.ERROR), value, findings };
}

export function atlasFindingsFail(findings: readonly AtlasValidationFinding[], strict = false) {
  const threshold = strict ? atlasFindingSeverityRank.WARNING : atlasFindingSeverityRank.ERROR;
  return findings.some((finding) => atlasFindingSeverityRank[finding.severity] >= threshold);
}

