import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  outputFileTracingRoot: path.join(__dirname),
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "node:https": false,
      "node:fs": false,
      https: false,
      fs: false,
      "node:http": "http",
      "node:stream": "stream",
      "node:buffer": "buffer",
    };

    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      https: false,
      fs: false,
    };

    return config;
  },
};

export default nextConfig;
