import assert from "node:assert/strict";
import test from "node:test";
import { resolveTelemetryConfiguration } from "@habitat/shared";

test("telemetry stays dormant until an endpoint is configured", () => {
  const resolved = resolveTelemetryConfiguration("habitat-web", "0.1.0", {});
  assert.equal(resolved.enabled, false);
  assert.match(resolved.reason, /No OTLP endpoint/);
});

test("the standard OTLP variable is honoured and the Habitat-prefixed one wins", () => {
  const standard = resolveTelemetryConfiguration("habitat-worker", "0.1.0", { OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4318" });
  assert.equal(standard.enabled && standard.endpoint, "http://127.0.0.1:4318");

  const both = resolveTelemetryConfiguration("habitat-worker", "0.1.0", {
    OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4318",
    HABITAT_OTEL_EXPORTER_OTLP_ENDPOINT: "http://10.0.0.5:4318",
  });
  assert.equal(both.enabled && both.endpoint, "http://10.0.0.5:4318");
});

test("an explicit off switch beats a configured endpoint", () => {
  const resolved = resolveTelemetryConfiguration("habitat-agent", "0.1.0", { HABITAT_OTEL: "off", HABITAT_OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4318" });
  assert.equal(resolved.enabled, false);
});

test("an endpoint carrying credentials, a query or a fragment is refused rather than silently stripped", () => {
  for (const endpoint of ["http://user:pass@127.0.0.1:4318", "http://127.0.0.1:4318?token=abc", "http://127.0.0.1:4318#frag", "ftp://127.0.0.1:4318", "not a url"]) {
    const resolved = resolveTelemetryConfiguration("habitat-web", "0.1.0", { HABITAT_OTEL_EXPORTER_OTLP_ENDPOINT: endpoint });
    assert.equal(resolved.enabled, false, `${endpoint} should be refused`);
  }
});

test("a trailing slash and a base path are normalized so exporter URLs never double up", () => {
  const plain = resolveTelemetryConfiguration("habitat-web", "0.1.0", { HABITAT_OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4318/" });
  assert.equal(plain.enabled && plain.endpoint, "http://127.0.0.1:4318");

  const prefixed = resolveTelemetryConfiguration("habitat-web", "0.1.0", { HABITAT_OTEL_EXPORTER_OTLP_ENDPOINT: "https://collector.example/otlp/" });
  assert.equal(prefixed.enabled && prefixed.endpoint, "https://collector.example/otlp");
});

test("out-of-range tuning falls back to defaults instead of failing the process", () => {
  const resolved = resolveTelemetryConfiguration("habitat-web", "0.1.0", {
    HABITAT_OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4318",
    HABITAT_OTEL_METRIC_INTERVAL_MS: "12",
    HABITAT_OTEL_TRACE_SAMPLE_RATIO: "17",
  });
  assert.equal(resolved.enabled && resolved.metricIntervalMs, 60_000);
  assert.equal(resolved.enabled && resolved.traceSampleRatio, 1);
});

test("headers are parsed from the OTLP key=value list", () => {
  const resolved = resolveTelemetryConfiguration("habitat-web", "0.1.0", {
    HABITAT_OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4318",
    HABITAT_OTEL_EXPORTER_OTLP_HEADERS: "authorization=Bearer abc, x-tenant = habitat ,broken",
  });
  assert.deepEqual(resolved.enabled && resolved.headers, { authorization: "Bearer abc", "x-tenant": "habitat" });
});
