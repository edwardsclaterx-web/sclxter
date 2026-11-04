import type { NextConfig } from "next";

const NO_STORE = "private, no-store, max-age=0, must-revalidate";

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  async headers() {
    return [
      {
        source: "/embed.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, stale-while-revalidate=30",
          },
        ],
      },
      {
        source: "/api/widget/:path*",
        headers: [{ key: "Cache-Control", value: NO_STORE }],
      },
      {
        source: "/widget/:path*",
        headers: [{ key: "Cache-Control", value: NO_STORE }],
      },
    ];
  },
  allowedDevOrigins: ["127.0.0.1", "localhost", "0.0.0.0"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
