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
import { webVersion } from "@/lib/web-version";

/**
 * OpenTelemetry for the Next.js server.
 *
 * Next emits its own spans through the OpenTelemetry API when a tracer provider
 * is registered, so registering the Node SDK here is enough to get request,
 * render and route-handler spans alongside the database and outbound HTTP spans
 * the instrumentations below provide. Nothing starts unless an OTLP endpoint is
 * configured.
 */

export type TelemetryHandle = { enabled: boolean; reason: string };

let started: TelemetryHandle | null = null;

export async function startWebTelemetry(environment = process.env): Promise<TelemetryHandle> {
  // Next can call `register` again on a hot reload; a second SDK would register
  // a competing global tracer provider and log a warning on every request.
  if (started) return started;

  const configuration = resolveTelemetryConfiguration("habitat-web", webVersion, environment);
  if (!configuration.enabled) {
    console.info(`[telemetry] OpenTelemetry is off: ${configuration.reason}`);
    started = { enabled: false, reason: configuration.reason };
    return started;
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
    instrumentations: [new HttpInstrumentation(), new UndiciInstrumentation(), new PgInstrumentation()],
  });

  try {
    sdk.start();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[telemetry] OpenTelemetry could not start; the site continues without it: ${reason}`);
    started = { enabled: false, reason };
    return started;
  }

  process.once("SIGTERM", () => { void sdk.shutdown().catch(() => {}); });
  console.info(`[telemetry] OpenTelemetry exporting to ${configuration.endpoint} as ${configuration.serviceName}.`);
  started = { enabled: true, reason: "" };
  return started;
}
