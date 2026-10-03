import type { NextConfig } from "next";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const nextConfig: NextConfig = {
  transpilePackages: ["@club/db", "@club/matchmaking"],
  webpack(config, { isServer }) {
    // In a pnpm monorepo Next.js does not trace Prisma's query engine into the
    // serverless bundle; this plugin copies it next to the server output.
    if (isServer) config.plugins = [...config.plugins, new PrismaPlugin()];
    return config;
  },
};

export default nextConfig;
