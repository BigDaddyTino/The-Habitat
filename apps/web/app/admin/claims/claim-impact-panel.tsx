import { AlertTriangle, Info, OctagonAlert, ShieldAlert } from "lucide-react";
import type { ClaimConflict, ConflictSeverity, OwnershipImpact } from "@habitat/identity";
import { impactRows, severityLabels, sortConflicts } from "@/lib/claim-center";

const severityIcons: Record<ConflictSeverity, typeof Info> = {
  BLOCKING: OctagonAlert,
  SEVERE: ShieldAlert,
  WARNING: AlertTriangle,
  INFO: Info,
};

/** The measured consequence of an ownership change, stated before it is made. */
export function ClaimImpactPanel({ impact }: { impact: OwnershipImpact }) {
  const rows = impactRows(impact);
  const achievements = impact.direction === "GRANT" ? impact.achievementsGained : impact.achievementsLost;
  const titles = impact.direction === "GRANT" ? impact.titlesGained : impact.titlesLost;
  const achievementLabel = impact.direction === "GRANT" ? "Achievements unlocked" : "Achievements revoked";
  const titleLabel = impact.direction === "GRANT" ? "Titles unlocked" : "Titles revoked";

  return <div className="claim-impact">
    <p className="claim-impact-headline">{impact.headline}</p>
    <dl className="claim-impact-grid">{rows.map((row) => <div className={row.value === "no change" ? "muted" : undefined} key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
    {achievements.length > 0 && <div className="claim-impact-list"><p className="eyebrow">{achievementLabel}</p><ul>{achievements.map((achievement) => <li key={achievement.id}><span>{achievement.name}</span><span className={`rarity-chip ${achievement.rarity.toLowerCase()}`}>{achievement.rarity.replaceAll("_", " ").toLowerCase()}</span></li>)}</ul></div>}
    {titles.length > 0 && <div className="claim-impact-list"><p className="eyebrow">{titleLabel}</p><ul>{titles.map((title) => <li key={`${title.id}-${title.achievementName}`}><span>{title.name}</span><span className="muted">via {title.achievementName}</span></li>)}</ul></div>}
    {impact.caveats.length > 0 && <ul className="claim-caveats">{impact.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}</ul>}
  </div>;
}

export function ConflictList({ conflicts }: { conflicts: ClaimConflict[] }) {
  if (conflicts.length === 0) return <p className="claim-conflicts-clear">No conflicts detected. Provider proof, competing claims, duplicate identities, and overlapping sessions were all checked.</p>;
  return <ul className="claim-conflicts">{sortConflicts(conflicts).map((conflict) => {
    const Icon = severityIcons[conflict.severity];
    return <li className={`severity-${conflict.severity.toLowerCase()}`} key={conflict.code}>
      <Icon aria-hidden="true" size={16} />
      <div><p><span className="conflict-severity">{severityLabels[conflict.severity]}</span>{conflict.title}</p><span>{conflict.detail}</span></div>
    </li>;
  })}</ul>;
}
