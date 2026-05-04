import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Voorkomt dubbele bundling van Blob-error classes (instanceof faalt soms in serverless). */
  serverExternalPackages: ["@vercel/blob"],
  headers: async () => [
    {
      source: "/service-worker.js",
      headers: [{ key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" }],
    },
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.private.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;