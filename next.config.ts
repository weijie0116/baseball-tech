import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, too small for a phone-camera photo upload (student
      // avatars). Server Actions are the only file-upload path in this app.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
