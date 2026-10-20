// Cloudflare Turnstile, the facts both sides need: the origin the proxy lets
// the widget frame from, the script the form loads, and the site key. No secret
// lives here; the server-side check is in lib/waitlist.ts.

export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';
export const TURNSTILE_SCRIPT = `${TURNSTILE_ORIGIN}/turnstile/v0/api.js?render=explicit`;

// The action name the widget signs into its token and lib/waitlist.ts checks,
// so a token minted for another form on another site cannot be replayed here.
export const TURNSTILE_ACTION = 'waitlist';

// Cloudflare's published test key that always passes. Used only when no key is
// configured outside production, so `pnpm dev` works with no account; its
// paired test secret is in lib/waitlist.ts. A production build with no key set
// renders the form and the server refuses every submission, loudly.
const TEST_SITE_KEY = '1x00000000000000000000AA';

export function turnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;
}
