import type { NextConfig } from 'next';
import path from 'node:path';
import { STATIC_HEADERS } from '@ekdotico/amyntico/headers';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // `next upgrade --agent` with no type moves this site only when the
  // installed release has a published security advisory.
  experimental: {
    agentUpgrade: 'security',
  },
  // Pin the workspace root so Turbopack ignores stray lockfiles in parent
  // directories (e.g. ~/pnpm-lock.yaml) and always treats this repo as root.
  turbopack: {
    root: path.resolve(__dirname),
  },

  // /status is the status page of the small `app` project that serves
  // ekdoti.co, which stays its one source. It is served here under this host
  // (the address bar keeps alpha.ekdoti.co), page and files alike: the page
  // names its stylesheets and scripts as /status/*. Nothing is copied. `app`
  // redirects every path except /status, so this cannot loop.
  async rewrites() {
    return [{ source: '/status/:path*', destination: 'https://ekdoti.co/status/:path*' }];
  },

  // The static security headers on every route come from the shared set, so
  // this site sends the same five as deree, docs and praktico. The
  // Content-Security-Policy carries a per-request nonce, which a static
  // headers() block cannot express, so it is minted and set in proxy.ts.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: Object.entries(STATIC_HEADERS).map(([key, value]) => ({ key, value })),
      },
    ];
  },
};

export default nextConfig;
