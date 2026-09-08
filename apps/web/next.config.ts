import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["@araland/shared"],
  devIndicators: false,
  agentRules: false,
  poweredByHeader: false,
  async headers() {
    return [
      ...["/login", "/portal/:path*", "/preview/:path*", "/editor/:path*", "/live-preview"].map(source => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] })),
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};
export default config;
