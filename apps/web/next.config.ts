import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@club/db", "@club/matchmaking"],
};

export default nextConfig;
