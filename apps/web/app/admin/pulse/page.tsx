import "@/lib/environment";
import { AlertTriangle, CircleCheck, CircleHelp, HeartPulse, ServerCog } from "lucide-react";
import { getPrismaClient } from "@habitat/db/client";
import { formatPulseDuration, type PulseStatus } from "@habitat/shared";
import { requireRole } from "@/lib/authorization";
import { buildPulseView, groupPulseTiles, type PulseHeartbeatRow, type PulseSignalRow } from "@/lib/pulse-view";
import { PulseRefresh } from "./pulse-refresh";
import "./pulse.css";

export const dynamic = "force-dynamic";

const db = getPrismaClient();

const statusLabels: Record<PulseStatus, string> = {
  OK: "Healthy",
  WARN: "Degraded",
  CRITICAL: "Failing",
  UNKNOWN: "Unknown",
};

const headlineCopy: Record<PulseStatus, string> = {
  OK: "Every evaluated signal is healthy.",
  WARN: "Something is degraded and worth a look before it becomes an outage.",
  CRITICAL: "A signal is failing right now.",
  UNKNOWN: "Not enough has been evaluated to judge the installation.",
};

export default async function AdminPulsePage() {
  await requireRole("ADMIN");
  const now = new Date();
  const [signals, heartbeats, collectors, failures] = await Promise.all([
    db.pulseSignal.findMany({ select: { key: true, status: true, summary: true, observedAt: true, statusSince: true, lastOkAt: true, detail: true } }),
    db.serviceHeartbeat.findMany({ select: { service: true, hostname: true, version: true, startedAt: true, observedAt: true, intervalMs: true } }),
    db.gameServer.findMany({
      where: { enabled: true },
      orderBy: { displayName: "asc" },
      select: {
        displayName: true,
        slug: true,
        collectorSources: {
          orderBy: { sourceKind: "asc" },
          select: { sourceKind: true, label: true, available: true, truncated: true, recordsLastScan: true, importedLastScan: true, lastScanAt: true, lastYieldAt: true, lastRecordAt: true, lastError: true },
        },
      },
    }),
    db.evaluationFailure.findMany({ where: { resolvedAt: null }, orderBy: { occurredAt: "desc" }, take: 10, select: { id: true, kind: true, scope: true, reference: true, message: true, occurredAt: true } }),
  ]);

  const view = buildPulseView(signals as PulseSignalRow[], heartbeats as PulseHeartbeatRow[], now);
  const groups = groupPulseTiles(view.tiles);
  const worlds = collectors.map((world) => ({ slug: world.slug, displayName: world.displayName, sources: world.collectorSources }));

  return <section className="admin-page pulse-page">
    <header className="pulse-hero">
      <div>
        <p className="eyebrow">Admin / observability</p>
        <h1>Habitat<br /><em>pulse.</em></h1>
        <p>{headlineCopy[view.overall]} Every signal below is evaluated by the worker and written down, so what this page shows and what Discord was told about are the same verdict. A signal nobody could evaluate reports as unknown rather than being painted green.</p>
      </div>
      <div className={`pulse-headline ${toneClass(view.overall)}`}>
        <StatusGlyph status={view.overall} />
        <strong>{statusLabels[view.overall]}</strong>
        <span>{view.evaluatedAt ? `Last evaluated ${formatPulseDuration(now.getTime() - view.evaluatedAt.getTime())} ago` : "Never evaluated"}</span>
        <PulseRefresh />
      </div>
    </header>

    {view.workerStale ? <p className="pulse-stale-banner">
      <AlertTriangle aria-hidden="true" size={16} />
      <span>The worker has not reported for {view.workerObservedAt ? formatPulseDuration(now.getTime() - view.workerObservedAt.getTime()) : "an unknown length of time"}. Everything except the process tiles below is the last verdict it managed to record, not the state right now.</span>
    </p> : null}

    {groups.map((group) => <section className="pulse-group" key={group.category}>
      <div className="pulse-group-heading">
        <p className="eyebrow">{group.label}</p>
        <span className={`pulse-chip ${toneClass(group.status)}`}>{statusLabels[group.status]}</span>
      </div>
      <div className="pulse-grid">
        {group.tiles.map((tile) => <article className={`pulse-tile ${toneClass(tile.status)} ${tile.stale ? "stale" : ""}`} key={tile.key}>
          <header>
            <StatusGlyph status={tile.status} />
            <h2>{tile.title}</h2>
            <span className="pulse-age">{tile.stale ? `as of ${tile.ageLabel} ago` : tile.ageLabel}</span>
          </header>
          <p className="pulse-summary">{tile.summary}</p>
          <p className="pulse-description">{tile.description}</p>
          {tile.status === "OK" ? null : <p className="pulse-remedy">{tile.remedy}</p>}
          <footer>
            {tile.statusSince ? <span>{statusLabels[tile.status].toLowerCase()} for {formatPulseDuration(now.getTime() - tile.statusSince.getTime())}</span> : <span>no recorded history</span>}
            {tile.status === "OK" || !tile.lastOkAt ? null : <span>last healthy {formatPulseDuration(now.getTime() - tile.lastOkAt.getTime())} ago</span>}
          </footer>
        </article>)}
      </div>
    </section>)}

    <section className="pulse-group">
      <div className="pulse-group-heading"><p className="eyebrow">Collectors, world by world</p><span className="pulse-note">Written by the history scan, not by this page</span></div>
      {worlds.length === 0 ? <p className="pulse-empty">No history scan has completed yet, so no collector has reported. This is expected on a fresh installation until the first scan interval elapses.</p> : <div className="pulse-worlds">
        {worlds.map((world) => <article className="pulse-world" key={world.slug}>
          <header><ServerCog aria-hidden="true" size={16} /><h3>{world.displayName}</h3></header>
          {world.sources.length === 0 ? <p className="pulse-world-missing"><CircleHelp aria-hidden="true" size={15} /> No collector source has reported for this enabled world yet.</p> : <ul>
            {world.sources.map((source) => {
              const status = collectorStatus(source, now);
              return <li className={toneClass(status)} key={source.sourceKind}>
                <div><strong>{source.label}</strong><span>{source.sourceKind}</span></div>
                <div className="pulse-source-facts">
                  <span>{source.available ? `${source.recordsLastScan} parsed` : "unreadable"}</span>
                  <span>{source.importedLastScan} new</span>
                  <span>scanned {formatPulseDuration(now.getTime() - source.lastScanAt.getTime())} ago</span>
                  <span>{source.lastRecordAt ? `newest record ${formatPulseDuration(now.getTime() - source.lastRecordAt.getTime())} old` : "no record seen"}</span>
                </div>
                {source.truncated ? <p className="pulse-source-note">Scan truncated; older records were not read.</p> : null}
                {source.lastError ? <p className="pulse-source-note">{source.lastError}</p> : null}
                {source.available && source.recordsLastScan === 0 ? <p className="pulse-source-note">Readable but parsed nothing — compare the real log format against this source&apos;s parser.</p> : null}
              </li>;
            })}
          </ul>}
        </article>)}
      </div>}
    </section>

    <section className="pulse-group">
      <div className="pulse-group-heading"><p className="eyebrow">Unresolved evaluation failures</p><span className="pulse-note">Newest ten</span></div>
      {failures.length === 0 ? <p className="pulse-empty">No pipeline evaluation has failed without being resolved. A failure here names the exact stage and record that threw, so it can be fixed and replayed rather than guessed at.</p> : <ol className="pulse-failures">
        {failures.map((failure) => <li key={failure.id}>
          <div><strong>{failure.kind.replaceAll("_", " ").toLowerCase()}</strong><span>{failure.scope}</span></div>
          <p>{failure.message}</p>
          <div className="pulse-failure-meta">
            {failure.reference ? <code>{failure.reference}</code> : null}
            <time dateTime={failure.occurredAt.toISOString()}>{formatPulseDuration(now.getTime() - failure.occurredAt.getTime())} ago</time>
          </div>
        </li>)}
      </ol>}
    </section>
  </section>;
}

type CollectorRow = {
  sourceKind: string;
  label: string;
  available: boolean;
  truncated: boolean;
  recordsLastScan: number;
  importedLastScan: number;
  lastScanAt: Date;
  lastYieldAt: Date | null;
  lastRecordAt: Date | null;
  lastError: string | null;
};

/**
 * Mirrors the worker's per-source verdict closely enough to colour a row. The
 * authoritative aggregate is the collector tile above; this only decides which
 * lines a reader should look at first.
 */
function collectorStatus(source: CollectorRow, now: Date): PulseStatus {
  if (!source.available) return "CRITICAL";
  if (source.recordsLastScan === 0) return "CRITICAL";
  if (source.lastError || source.truncated) return "WARN";
  if (now.getTime() - source.lastScanAt.getTime() >= 24 * 3_600_000) return "WARN";
  return "OK";
}

function toneClass(status: PulseStatus): string {
  if (status === "OK") return "tone-ok";
  if (status === "WARN") return "tone-warn";
  if (status === "CRITICAL") return "tone-critical";
  return "tone-unknown";
}

function StatusGlyph({ status }: { status: PulseStatus }) {
  if (status === "OK") return <CircleCheck aria-hidden="true" size={17} />;
  if (status === "UNKNOWN") return <CircleHelp aria-hidden="true" size={17} />;
  if (status === "WARN") return <AlertTriangle aria-hidden="true" size={17} />;
  return <HeartPulse aria-hidden="true" size={17} />;
}
