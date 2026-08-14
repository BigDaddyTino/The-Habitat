import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { defaultResource, resourceFromAttributes } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { AlwaysOnSampler, TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { resolveTelemetryConfiguration } from "@habitat/shared";
import { agentVersion } from "./version.js";

/**
 * OpenTelemetry for the read-only agent.
 *
 * The agent lives on the game host, so its collector endpoint is a separate
 * decision from the portal's: exporting from here means the collector must be
 * reachable across the private network. Left unconfigured — the default — the
 * agent emits nothing and opens no outbound connection at all, which keeps the
 * "the agent is never exposed and never reaches out" property intact for
 * operators who do not want it.
 */

export type TelemetryHandle = { enabled: boolean; reason: string; stop(): Promise<void> };

export async function startAgentTelemetry(environment = process.env): Promise<TelemetryHandle> {
  const configuration = resolveTelemetryConfiguration("habitat-agent", agentVersion, environment);
  if (!configuration.enabled) {
    console.info(`[telemetry] OpenTelemetry is off: ${configuration.reason}`);
    return { enabled: false, reason: configuration.reason, stop: async () => {} };
  }

  const sdk = new NodeSDK({
    resource: defaultResource().merge(resourceFromAttributes({
      [ATTR_SERVICE_NAME]: configuration.serviceName,
      [ATTR_SERVICE_VERSION]: configuration.serviceVersion,
      "service.namespace": configuration.serviceNamespace,
      "deployment.environment.name": configuration.environmentName,
    })),
    sampler: configuration.traceSampleRatio >= 1 ? new AlwaysOnSampler() : new TraceIdRatioBasedSampler(configuration.traceSampleRatio),
    traceExporter: new OTLPTraceExporter({ url: `${configuration.endpoint}/v1/traces`, headers: configuration.headers }),
    metricReaders: [new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: `${configuration.endpoint}/v1/metrics`, headers: configuration.headers }),
      exportIntervalMillis: configuration.metricIntervalMs,
    })],
    // Only the inbound HTTP surface. The agent runs no database client and its
    // outbound work is process and game-query inspection, not fetch traffic.
    instrumentations: [new HttpInstrumentation()],
  });

  try {
    sdk.start();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[telemetry] OpenTelemetry could not start; the agent continues without it: ${reason}`);
    return { enabled: false, reason, stop: async () => {} };
  }

  console.info(`[telemetry] OpenTelemetry exporting to ${configuration.endpoint} as ${configuration.serviceName}.`);
  return {
    enabled: true,
    reason: "",
    stop: async () => {
      try {
        await sdk.shutdown();
      } catch (error) {
        console.warn("[telemetry] shutdown did not complete cleanly:", error instanceof Error ? error.message : String(error));
      }
    },
  };
}
