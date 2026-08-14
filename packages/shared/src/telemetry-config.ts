/**
 * OpenTelemetry configuration, resolved identically by the web app, the worker
 * and the agent.
 *
 * Telemetry is dormant unless an OTLP endpoint is configured. That is the whole
 * point of choosing OpenTelemetry: the three services emit standard traces and
 * metrics, and where those go — a local collector, or nothing at all — is an
 * operator decision that no application code here depends on.
 *
 * The standard `OTEL_EXPORTER_OTLP_ENDPOINT` is honoured so a collector agent
 * that injects it works without touching Habitat configuration, while the
 * `HABITAT_`-prefixed variables stay consistent with the rest of the .env and
 * win when both are present.
 */

export type TelemetryServiceName = "habitat-web" | "habitat-worker" | "habitat-agent";

export type TelemetryConfiguration =
  | { enabled: false; reason: string; serviceName: TelemetryServiceName }
  | {
    enabled: true;
    serviceName: TelemetryServiceName;
    serviceNamespace: string;
    serviceVersion: string;
    environmentName: string;
    /** Base OTLP/HTTP endpoint; signal paths are appended by the exporters. */
    endpoint: string;
    metricIntervalMs: number;
    traceSampleRatio: number;
    headers: Record<string, string>;
  };

export type TelemetryEnv = Record<string, string | undefined>;

const disabledValues = new Set(["off", "false", "0", "disabled", "none"]);

export function resolveTelemetryConfiguration(serviceName: TelemetryServiceName, serviceVersion: string, env: TelemetryEnv): TelemetryConfiguration {
  const switchValue = env.HABITAT_OTEL?.trim().toLowerCase();
  if (switchValue && disabledValues.has(switchValue)) {
    return { enabled: false, reason: "HABITAT_OTEL is switched off.", serviceName };
  }

  const rawEndpoint = env.HABITAT_OTEL_EXPORTER_OTLP_ENDPOINT?.trim() || env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() || "";
  if (!rawEndpoint) {
    return { enabled: false, reason: "No OTLP endpoint is configured, so telemetry stays dormant.", serviceName };
  }

  const endpoint = normalizeEndpoint(rawEndpoint);
  if (!endpoint) {
    return { enabled: false, reason: "The configured OTLP endpoint is not a credential-free HTTP or HTTPS URL.", serviceName };
  }

  return {
    enabled: true,
    serviceName,
    serviceNamespace: trimmedOr(env.HABITAT_OTEL_SERVICE_NAMESPACE, "habitat", 60),
    serviceVersion: serviceVersion.slice(0, 40),
    environmentName: trimmedOr(env.HABITAT_OTEL_ENVIRONMENT, "production", 40),
    endpoint,
    metricIntervalMs: boundedInteger(env.HABITAT_OTEL_METRIC_INTERVAL_MS, 5_000, 300_000, 60_000),
    traceSampleRatio: boundedRatio(env.HABITAT_OTEL_TRACE_SAMPLE_RATIO, 1),
    headers: parseHeaders(env.HABITAT_OTEL_EXPORTER_OTLP_HEADERS ?? env.OTEL_EXPORTER_OTLP_HEADERS),
  };
}

/**
 * Returns the origin-and-path base with any trailing slash removed, or null when
 * unusable.
 *
 * Parsed by pattern rather than with `URL`: this package targets pure ES2022
 * with no DOM library, so `URL` is not available to it.
 */
function normalizeEndpoint(value: string): string | null {
  // scheme :// authority [ /path ] — anything carrying credentials, a query or
  // a fragment is rejected rather than quietly stripped.
  const match = /^(https?):\/\/([^/?#@\s]+)(\/[^?#\s]*)?$/i.exec(value.trim());
  if (!match) return null;
  const [, scheme, authority, rawPath] = match;
  // Guard the host shape too, so "http://:4318" or "http://a:b:c" cannot pass.
  if (!/^[A-Za-z0-9._~-]+(?::\d{1,5})?$/.test(authority) && !/^\[[0-9A-Fa-f:.]+\](?::\d{1,5})?$/.test(authority)) return null;
  const path = (rawPath ?? "").replace(/\/+$/, "");
  return `${scheme.toLowerCase()}://${authority}${path}`;
}

function trimmedOr(value: string | undefined, fallback: string, maxLength: number): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function boundedInteger(value: string | undefined, minimum: number, maximum: number, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

function boundedRatio(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
}

/** Parses the W3C-style `key=value,key=value` list used by the OTLP specification. */
function parseHeaders(value: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!value?.trim()) return headers;
  for (const pair of value.split(",")) {
    const separator = pair.indexOf("=");
    if (separator < 1) continue;
    const name = pair.slice(0, separator).trim();
    const headerValue = pair.slice(separator + 1).trim();
    if (name && headerValue) headers[name] = headerValue;
  }
  return headers;
}
