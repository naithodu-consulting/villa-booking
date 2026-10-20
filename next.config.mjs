// Plain JavaScript, not TypeScript, and deliberately so.
//
// The production host runs a glibc older than 2.29, so Next's native SWC
// binary cannot load there (`@next/swc-linux-x64-gnu` fails with
// "version GLIBC_2.29 not found") and Next falls back to its WASM SWC. That
// fallback then could not load a *TypeScript* config at all: it compiles
// next.config.ts to a temporary file and immediately fails to resolve it -
//
//   Failed to load next.config.ts
//   Cannot find module '.../6ad7035f0d050.next.config'
//
// A .js config needs no compilation, so the whole failure mode disappears.
// The JSDoc annotation below keeps editor type-checking on the object.
//
// .mjs rather than .js: the lint config forbids CommonJS imports, and native
// ESM needs no compilation either, so this satisfies both constraints at once.
// It also matches postcss.config.mjs and eslint.config.mjs, which this project
// already uses.
import createMDX from '@next/mdx';

/**
 * Content-Security-Policy.
 *
 * The checkout loads Razorpay's script and opens its payment modal in an
 * iframe, and the site loads Google Analytics once a guest accepts cookies.
 * Everything else is served from this origin. A payment page is the one place
 * a CSP most earns its keep, so the hosts below are listed explicitly rather
 * than waved through with a wildcard.
 *
 * Two deliberate weaknesses, both worth understanding before anyone tries to
 * "tighten" them:
 *
 *   script-src 'unsafe-inline'  Next.js emits inline bootstrap and hydration
 *     scripts. The alternative is a per-request nonce, which has to be injected
 *     by middleware, and reading a request header in middleware forces every
 *     page to render dynamically. This app deliberately prerenders its content
 *     pages (see the `○ Static` routes in the build output), so nonces would
 *     trade the whole static-rendering strategy for one directive. Not worth it
 *     here: there is no user-generated HTML anywhere in the app, journal
 *     markdown renders with skipHtml, and every interpolated value in an email
 *     goes through esc().
 *
 *   style-src 'unsafe-inline'   The app styles almost everything with inline
 *     style={{...}} attributes. Removing this would mean rewriting the entire
 *     visual layer.
 *
 * Neither weakens script-src's host allowlist, which is the part that stops an
 * injected script from phoning home.
 *
 * CSP_REPORT_ONLY=1 sends this as Content-Security-Policy-Report-Only instead,
 * so a deployment can be checked for violations without risking a blocked
 * payment modal. Use it to validate a change, not as a permanent setting: a
 * report-only policy enforces nothing.
 */
/** @type {Record<string, string[]>} */
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    // checkout.razorpay.com serves checkout.js, which then pulls its risk-
    // detection bundle from cdn.razorpay.com. Listing only the first host
    // loads the modal but blocks that bundle, which was verified against a
    // real checkout page: "Loading the script
    // https://cdn.razorpay.com/static/cx/razorpay-risk-detection/bundle.js
    // violates the following Content Security Policy directive". Razorpay can
    // add hosts under its own domain without telling us, so this is the
    // wildcard, not two hard-coded names.
    'https://*.razorpay.com',
    'https://www.googletagmanager.com',
  ],
  // Google Fonts stylesheets; the rest are inline attributes.
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  // data: and blob: cover next/image's optimiser output and the OG image route.
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://*.razorpay.com',
    'https://images.unsplash.com',
    'https://*.supabase.co',
    'https://www.googletagmanager.com',
    'https://*.google-analytics.com',
  ],
  // The hero reel is served from /public on this origin.
  'media-src': ["'self'"],
  'connect-src': [
    "'self'",
    'https://*.razorpay.com',
    'https://*.supabase.co',
    'https://www.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
  ],
  // Razorpay's modal. Without this the guest sees an empty box and cannot pay.
  'frame-src': ["'self'", 'https://*.razorpay.com'],
  'worker-src': ["'self'", 'blob:'],
  'object-src': ["'none'"],
  'base-uri': ["'none'"],
  // Razorpay's flow can post a form back to its own domain on some methods.
  'form-action': ["'self'", 'https://*.razorpay.com'],
  // The modern equivalent of X-Frame-Options: DENY, which is also still sent
  // below for older browsers.
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

function buildCsp() {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => (values.length ? `${directive} ${values.join(' ')}` : directive))
    .join('; ');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/photo-**',
      },
      {
        // Supabase Storage — project-specific storage bucket URLs
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    const cspHeaderName =
      process.env.CSP_REPORT_ONLY === '1'
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';

    return [
      {
        source: '/(.*)',
        headers: [
          { key: cspHeaderName, value: buildCsp() },
          // One year. Deliberately without `includeSubDomains` or `preload`:
          // both are commitments that are hard to walk back, and nothing here
          // knows what else may be hosted on a villa19.in subdomain. Add them
          // once that is settled, preload last.
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default createMDX()(nextConfig);
