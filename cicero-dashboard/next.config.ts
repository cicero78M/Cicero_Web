import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
