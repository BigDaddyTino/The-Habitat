import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@habitat/db", "@habitat/shared"],
};

export default nextConfig;
