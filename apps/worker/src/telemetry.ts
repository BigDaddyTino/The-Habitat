import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { defaultResource, resourceFromAttributes } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { AlwaysOnSampler, TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { resolveTelemetryConfiguration } from "@habitat/shared";
import { workerVersion } from "./version.js";

/**
 * OpenTelemetry for the worker.
 *
 * Standard traces and metrics are emitted over OTLP so the collector — and
 * therefore the choice of monitoring vendor — stays entirely outside the
 * application. With no endpoint configured nothing is instrumented at all,
 * which is the state a fresh clone runs in.
 */

export type TelemetryHandle = { enabled: boolean; reason: string; stop(): Promise<void> };

let defaultTelemetry: Promise<TelemetryHandle> | null = null;

export function startWorkerTelemetry(environment = process.env): Promise<TelemetryHandle> {
  if (environment !== process.env) return createWorkerTelemetry(environment);
  defaultTelemetry ??= createWorkerTelemetry(environment);
  return defaultTelemetry;
}

async function createWorkerTelemetry(environment: NodeJS.ProcessEnv): Promise<TelemetryHandle> {
  const configuration = resolveTelemetryConfiguration("habitat-worker", workerVersion, environment);
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
    instrumentations: [
      new HttpInstrumentation(),
      // The worker's outbound calls to Steam, Discord, Twitch and the private
      // agent all go through undici's fetch.
      new UndiciInstrumentation(),
      new PgInstrumentation(),
    ],
  });

  try {
    sdk.start();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[telemetry] OpenTelemetry could not start; monitoring continues without it: ${reason}`);
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
