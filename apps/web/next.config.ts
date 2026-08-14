import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@habitat/db", "@habitat/shared"],
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
