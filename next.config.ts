import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uozokadcvzmhszatgqcu.supabase.co",
      },
      {
        protocol: "https",
        hostname: "reaizuvnwsjzhbxnlrpn.supabase.co",
      },
      {
        protocol: "https",
        hostname: "ocgubwfyosemitjmhbft.supabase.co",
      },
    ],
  },
};

export default nextConfig;


