import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Supabase Edge Functions are excluded via tsconfig.json
  // They use Deno runtime and should not be compiled by Next.js
};

export default nextConfig;
