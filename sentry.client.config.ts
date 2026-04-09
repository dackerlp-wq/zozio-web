import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Replay session recordings for errors
  integrations: [
    Sentry.replayIntegration(),
  ],

  // 10% of sessions recorded normally, 100% when error occurs
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // 10% of transactions traced in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  debug: false,
});
