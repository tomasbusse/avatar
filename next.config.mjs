import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "frame-ancestors 'self'",
            // 'unsafe-inline' retained for Next.js hydration scripts; 'unsafe-eval' removed.
            "script-src 'self' 'unsafe-inline' https://*.clerk.com https://clerk.simmonds.online https://challenges.cloudflare.com",
            "worker-src 'self' blob:",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob:",
            "media-src 'self' https: blob: data:",
            [
              "connect-src 'self'",
              // Convex
              "https://*.convex.cloud wss://*.convex.cloud",
              // Clerk
              "https://*.clerk.com https://*.clerk.accounts.dev https://clerk.simmonds.online",
              // LiveKit (self-hosted custom domain + LiveKit Cloud fallback)
              "https://news.englisch-lehrer.com wss://news.englisch-lehrer.com",
              "https://*.livekit.cloud wss://*.livekit.cloud",
              // Sentry (tunneled via /monitoring, but keep direct fallback)
              "https://*.sentry.io https://*.ingest.sentry.io",
              // Google APIs (Gemini, fonts, analytics)
              "https://generativelanguage.googleapis.com https://*.googleapis.com https://fonts.gstatic.com",
            ].join(' '),
            "font-src 'self' data: https://fonts.gstatic.com",
            "frame-src 'self' https://*.clerk.com https://challenges.cloudflare.com",
            "form-action 'self' blob: data:",
          ].join('; '),
        },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
      ],
    }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
      },
    ],
  },
  // Required for LiveKit (lesson rooms still use LiveKit)
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "sprachdienste-simmonds",

  project: "beethoven-web",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shaking Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
