import path from "node:path";
import type { NextConfig } from "next";

const workspaceRoot = path.resolve(process.cwd(), "../..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: ["@uiforge/design-intelligence"],
  turbopack: {
    root: workspaceRoot,
    resolveAlias: {
      "@uiforge/design-intelligence":
        "./packages/design-intelligence/src/index.ts",
    },
  },
};

export default nextConfig;
