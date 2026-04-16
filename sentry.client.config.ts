import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",

  // Capture 10% des transactions en production pour le performance monitoring
  tracesSampleRate: 0.1,

  // Replay vidéo des sessions avec erreur (5% normal, 100% sur erreur)
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,   // RGPD : masquer tout texte utilisateur
      blockAllMedia: true,
    }),
  ],

  // Ne pas logguer les erreurs courantes et inoffensives
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    /^AbortError/,
  ],
});
