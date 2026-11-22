import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.M1_T18_TEST_DIST_DIR ?? ".next",
};

export default nextConfig;
