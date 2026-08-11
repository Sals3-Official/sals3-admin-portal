import type { NextConfig } from 'next';

/**
 * Admin Portal is an internal employee control plane. Unlike the storefront,
 * *no* route here is ever meant for a search engine, an AI answer surface, or
 * a shared cache, so the security headers apply to every path rather than to
 * a named list of sensitive pages.
 *
 * `X-Robots-Tag` is sent as a header rather than only as page metadata so it
 * also covers non-document responses (route handlers, API payloads), which
 * `robots` metadata cannot reach.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // No `images.remotePatterns` entry exists on purpose. Admin Portal renders
  // no remote image today; a host must be allow-listed here only when a real
  // screen needs it, so an unreviewed origin can never be loaded by accident.
};

export default nextConfig;
