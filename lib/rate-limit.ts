import 'server-only';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Shared Redis client. The Upstash Marketplace integration sets
// KV_REST_API_URL / KV_REST_API_TOKEN (the Vercel KV-compatible names), and a
// manual setup may use the UPSTASH_REDIS_REST_* names instead — both are
// accepted below. Provision the database in an EU region (eu-central-1).
// It holds counters, not the list: the client is keyed by IP address for at
// most a day, and an inbox only as a SHA-256 hash, also for at most a day.
//
// Outside production, missing variables degrade the limiters open (local dev
// before Upstash is provisioned). In production the same absence refuses every
// signup instead: a limiter that cannot count is not a limiter. The check sits
// in consume() rather than at module load so a build with no environment,
// which is what CI runs, still imports this module.

const MISSING_UPSTASH_MESSAGE =
  'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and ' +
  'KV_REST_API_TOKEN) are not set. The waitlist limiter cannot count without ' +
  'them, and in production it refuses every signup rather than admitting all ' +
  'of them. Provision Upstash Redis through the Vercel Marketplace.';

function makeRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = makeRedis();

function limiter(prefix: string, limit: number, window: `${number} ${'m' | 'h'}`): Ratelimit | null {
  return redis
    ? new Ratelimit({
        redis,
        // Fixed rather than sliding: a fixed window's key expires with the
        // window, while the sliding script keeps it for two. The privacy page
        // states these retention periods, so they have to be the real ones.
        limiter: Ratelimit.fixedWindow(limit, window),
        analytics: false,
        prefix,
      })
    : null;
}

// Four buckets, checked in this order.
//
//   client      five signups per address of origin in ten minutes. An IPv6
//               client is counted by its /64, which is what one subscriber is
//               allocated.
//   client-day  ten per address of origin in a day, so one client cannot spend
//               the global budget alone and close the list to everyone.
//   address     three confirmation emails to one inbox in a day, so the form
//               cannot be turned on a stranger's address to flood it. Keyed by
//               the inbox rather than the address as typed (inboxKey).
//   global   250 confirmation emails a day across everyone. Brevo's free plan
//            sends 300 a day, and the confirmation is one of them; the margin is
//            left for whatever else the account sends.
//            ponytail: fixed to the free tier; raise it with the Brevo plan.
const LIMITERS = {
  client: limiter('rl:waitlist:client', 5, '10 m'),
  'client-day': limiter('rl:waitlist:client-day', 10, '24 h'),
  address: limiter('rl:waitlist:address', 3, '24 h'),
  global: limiter('rl:waitlist:global', 250, '24 h'),
};

export type LimitScope = keyof typeof LIMITERS;

export interface LimitDecision {
  allowed: boolean;
  /** Which bucket refused, when one did. */
  scope: LimitScope;
}

async function consume(scope: LimitScope, identifier: string): Promise<LimitDecision> {
  const bucket = LIMITERS[scope];
  if (!bucket) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(MISSING_UPSTASH_MESSAGE);
    }
    return { allowed: true, scope };
  }
  const res = await bucket.limit(identifier);
  // A decision Upstash did not return within the library's 5 s timeout arrives
  // as success: true with reason "timeout". That is the library failing open;
  // here a signup that was not counted is a signup that is refused.
  return { allowed: res.success && res.reason !== 'timeout', scope };
}

/** Count one signup from this client. Checked before the Turnstile call. */
export async function consumeClient(headers: Headers): Promise<LimitDecision> {
  const key = clientKey(headers);
  const recent = await consume('client', key);
  if (!recent.allowed) return recent;
  return consume('client-day', key);
}

/**
 * Count one confirmation email: against the inbox first, then everyone. An
 * email the inbox's bucket refuses is not counted globally, so one address
 * hammered by a bot does not spend the budget every other reader shares.
 */
export async function consumeSend(email: string): Promise<LimitDecision> {
  const own = await consume('address', await sha256(inboxKey(email)));
  if (!own.allowed) return own;
  return consume('global', 'all');
}

/**
 * The inbox an address delivers to, for counting only; Brevo is sent the
 * address as typed. A `+tag` reaches the same inbox on every major provider,
 * and Gmail also ignores dots, so `a.b+1@gmail.com` and `ab@googlemail.com`
 * are one inbox and share one bucket. Expects the schema's lower-cased form.
 */
export function inboxKey(email: string): string {
  const at = email.lastIndexOf('@');
  let local = email.slice(0, at).split('+')[0];
  let domain = email.slice(at + 1);
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.replaceAll('.', '');
    domain = 'gmail.com';
  }
  return `${local}@${domain}`;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// The client's address, as the platform saw it. Vercel sets
// x-vercel-forwarded-for and x-real-ip itself and overwrites any value a
// client sent; x-forwarded-for is the fallback for other hosts, and its first
// entry is the client. A fixed sentinel stands in when none is present, so the
// signup is still counted, in one shared bucket, rather than admitted.
export function clientIp(headers: Headers): string | null {
  const first = (value: string | null) => value?.split(',')[0]?.trim() || null;
  return (
    first(headers.get('x-vercel-forwarded-for')) ??
    first(headers.get('x-real-ip')) ??
    first(headers.get('x-forwarded-for'))
  );
}

/**
 * The key a client is counted under. An IPv4 address is its own key. An IPv6
 * address is folded to its /64 prefix, because a single subscriber is normally
 * allocated a whole /64 and can rotate through its addresses at will: keyed by
 * the full address, every one of them would get its own five signups.
 */
export function clientKey(headers: Headers): string {
  const ip = clientIp(headers);
  if (!ip) return 'unknown';
  const bare = ip.replace(/^\[|\]$/g, '').replace(/%.*$/, '').toLowerCase();
  const mapped = /^(?:0{0,4}:){1,6}ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(bare);
  if (mapped) return mapped[1];
  const prefix = ipv6Prefix64(bare);
  return prefix ? `${prefix}::/64` : bare;
}

// The first four groups of an IPv6 address, normalised, or null when the value
// is not a plain IPv6 address, which is then keyed as written.
function ipv6Prefix64(ip: string): string | null {
  if (!ip.includes(':')) return null;
  const halves = ip.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill('0'), ...tail];
  if (!groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ''))
    .join(':');
}
