import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@habitat/db", "@habitat/shared"],
  // Which build directory this process reads or writes. The deploy script sets
  // it to a fresh `.next-<stamp>` for the build, then points the service at
  // that directory and restarts — so a deploy never writes into the tree the
  // running server is serving from. It used to build straight into the live
  // `.next`, which replaced chunks under the old process and produced the
  // ChunkLoadError and missing-module failures in the production logs. Unset
  // everywhere else, which is the ordinary `.next`.
  distDir: process.env.HABITAT_WEB_DIST_DIR || ".next",
  // Browser-driven local QA may reach the dev server through an explicit LAN
  // address. Keep that origin opt-in so production and normal local dev do not
  // broaden their accepted development origins.
  allowedDevOrigins: process.env.HABITAT_ALLOWED_DEV_ORIGIN
    ? [process.env.HABITAT_ALLOWED_DEV_ORIGIN]
    : undefined,
  // The OpenTelemetry Node SDK patches modules at require time, which only works
  // when it is loaded from node_modules rather than bundled into the server
  // output. Next's own instrumentation guidance requires the same.
  serverExternalPackages: [
    "@opentelemetry/sdk-node",
    "@opentelemetry/sdk-trace",
    "@opentelemetry/instrumentation",
    "@opentelemetry/instrumentation-http",
    "@opentelemetry/instrumentation-pg",
    "@opentelemetry/instrumentation-undici",
    "@opentelemetry/exporter-trace-otlp-http",
    "@opentelemetry/exporter-metrics-otlp-http",
  ],
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=31536000" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
      ],
    }];
  },
};

export default nextConfig;
