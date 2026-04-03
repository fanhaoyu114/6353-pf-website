import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-de91dfdd-0515-4757-b624-250c6fb5d4b8.space.z.ai",
    "*.space.z.ai",
  ],
};

export default nextConfig;
