import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/api/visual": ["./assets/fonts/**"] },
};

export default nextConfig;
