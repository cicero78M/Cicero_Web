import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "node:https": "https",
      "node:http": "http",
      "node:stream": "stream",
      "node:buffer": "buffer",
    };

    return config;
  },
};

export default nextConfig;
