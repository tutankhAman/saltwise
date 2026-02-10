import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@saltwise/ui", "@saltwise/logger"],
};

export default nextConfig;
