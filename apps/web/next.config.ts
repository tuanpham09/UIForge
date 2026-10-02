import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  // UIForge is a pnpm monorepo. Design Intelligence is a first-party
  // TypeScript workspace package and must be bundled/transpiled by Next.
  transpilePackages: ["@uiforge/design-intelligence"],
};

export default nextConfig;
