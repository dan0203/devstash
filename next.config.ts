import type { NextConfig } from "next";

const r2PublicHostname = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      ...(r2PublicHostname
        ? [{ protocol: "https" as const, hostname: r2PublicHostname }]
        : []),
    ],
  },
};

export default nextConfig;
