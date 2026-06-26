import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    INGEST_SECRET: process.env.INGEST_SECRET || "",
  },
};

export default nextConfig;
