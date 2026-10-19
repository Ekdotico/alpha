import type { NextConfig } from 'next';
import path from 'node:path';
import { STATIC_HEADERS } from '@ekdotico/amyntico/headers';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root so Turbopack ignores stray lockfiles in parent
  // directories (e.g. ~/pnpm-lock.yaml) and always treats this repo as root.
  turbopack: {
    root: path.resolve(__dirname),
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
