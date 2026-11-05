import type { NextConfig } from "next";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://likely-ecology-refused-letters.trycloudflare.com/api";
let apiOrigin = "";
try {
  apiOrigin = new URL(apiBaseUrl).origin;
} catch {
  apiOrigin = "https://likely-ecology-refused-letters.trycloudflare.com";
}

const isDev = process.env.NODE_ENV !== "production";

const connectSources = new Set([
  "'self'",
  apiOrigin,
  "https://likely-ecology-refused-letters.trycloudflare.com",
]);

if (isDev) {
  connectSources.add("ws:");
  connectSources.add("http://localhost:*");
  connectSources.add("ws://localhost:*");
}

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "frame-src 'self' blob:",
  `connect-src ${Array.from(connectSources).join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
