import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bendre/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bjodimpnpwuuoogwufso.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@tanstack/react-query", "recharts"],
  },
};

export default nextConfig;
