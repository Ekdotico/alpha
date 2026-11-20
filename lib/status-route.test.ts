import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config';
import { config } from '../proxy';

// The matcher is a path-to-regexp pattern whose only syntax here is plain regex.
const proxied = (path: string) => new RegExp(`^${config.matcher[0]}$`).test(path);

describe('the status page route', () => {
  it('rewrites /status and its files to the page served at ekdoti.co', async () => {
    expect(await nextConfig.rewrites?.()).toEqual([
      { source: '/status/:path*', destination: 'https://ekdoti.co/status/:path*' },
    ]);
  });

  it('keeps the nonce policy off /status and on every other page', () => {
    for (const p of ['/status', '/status/', '/status/status.js', '/status/tokens.css']) {
      expect(proxied(p), p).toBe(false);
    }
    for (const p of ['/', '/privacy', '/confirmed', '/statusx', '/statuses/y', '/en/status']) {
      expect(proxied(p), p).toBe(true);
    }
  });
});
