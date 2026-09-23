import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the project root explicitly — without this, Turbopack walks up
    // from this folder looking for a workspace root and can pick up an
    // unrelated package-lock.json higher in the home directory tree.
    root: path.join(__dirname),
  },
};

export default nextConfig;
