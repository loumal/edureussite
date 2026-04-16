import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",

  tracesSampleRate: 0.1,

  // Capturer le contexte des erreurs serveur (stack traces complètes)
  includeLocalVariables: true,
});
