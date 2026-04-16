import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// ── Content-Security-Policy ───────────────────────────────────────────────────
// Les APIs IA (Anthropic, ElevenLabs, Deepgram) sont appelées côté serveur
// uniquement → pas besoin de les lister en connect-src.
// next/font/google télécharge les polices au build et les sert depuis 'self'.
const csp = [
  "default-src 'self'",
  // Next.js App Router injecte des scripts inline pour l'hydratation RSC
  "script-src 'self' 'unsafe-inline'",
  // Tailwind et styled-components utilisent des styles inline
  "style-src 'self' 'unsafe-inline'",
  // Avatars générés (data URI) et blobs audio (MediaRecorder)
  "img-src 'self' data: blob:",
  // Audio Sofia (ElevenLabs retourné via notre API → blob URL côté client)
  "media-src 'self' blob:",
  // tRPC, API routes — tout sur la même origine
  "connect-src 'self'",
  // Polices servies localement après next/font/google (build-time download)
  "font-src 'self' data:",
  // Pas d'iframes
  "frame-src 'none'",
  "frame-ancestors 'none'",
]
  .join("; ");

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
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
    key: "Permissions-Policy",
    value: "camera=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: csp,
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Photos de spécialistes (URLs arbitraires soumises par les utilisateurs)
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Organisation et projet Sentry (à renseigner dans les variables d'environnement)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload des source maps uniquement en CI/CD, sans exposer les sources en prod
  silent: true,
  sourcemaps: { disable: true },

  // Désactiver le tunnel Sentry (route /monitoring) pour simplifier le CSP
  disableLogger: true,
});
