import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // Le proxy /api/backend/[...path] retransmet des chemins Django avec slash
  // final (ex: assignments/3/accept/). Sans ceci, Next redirige (308) vers la
  // version sans slash avant même d'atteindre le route handler.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
