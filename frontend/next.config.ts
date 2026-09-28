import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo: trace files up to the repo root so ../backend imports are
  // included in the server bundle on Vercel.
  outputFileTracingRoot: path.join(import.meta.dirname, ".."),
};

export default nextConfig;
