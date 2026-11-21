// The same-origin path the browser reports to (app/ingest/[...path]/route.ts).
// It forwards to PostHog's EU cloud and nothing else, and it forwards only what
// is listed here: the request's Cookie and Authorization headers, a client
// address and the page it came from never reach PostHog, because a header that
// is not on the list is not copied. EU only, and fixed in code, so no variable
// can point it elsewhere.

export const INGEST_ORIGIN = 'https://eu.i.posthog.com';

// The one first segment posthog-js 1.453.2 calls with the configuration of
// lib/analytics.ts, as lib/analytics-capture.test.ts records it. Anything else,
// a /batch/ of another project or a /api/ path included, is a 404 and reaches
// nobody. Nothing is admitted from the assets host (so none is named here): the
// test shows the library loads no settings or script from it with every
// feature off.
export const ALLOWED_SEGMENTS: readonly string[] = ['e'];
const FORWARD_REQUEST_HEADERS = ['content-type', 'content-encoding', 'accept', 'user-agent'];
const FORWARD_RESPONSE_HEADERS = ['content-type', 'cache-control'];
const MAX_BODY_BYTES = 256 * 1024;

/** Where a path under /ingest goes, or null if it is not one we forward. */
export function upstreamUrl(segments: string[], search: string): string | null {
  // /e or /e/ and nothing after it.
  const [first, ...rest] = segments;
  if (first === undefined || !ALLOWED_SEGMENTS.includes(first)) return null;
  if (rest.length > 1 || (rest.length === 1 && rest[0] !== '')) return null;
  return `${INGEST_ORIGIN}/${first}/${search}`;
}

/** The headers sent upstream: the listed ones present on the request, no others. */
export function forwardHeaders(incoming: Headers): Headers {
  const out = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = incoming.get(name);
    if (value !== null) out.set(name, value);
  }
  return out;
}

/**
 * Whether this client may send one more. Injected, so the forward can be tested
 * without a store; the route passes the site's limiter (lib/rate-limit.ts).
 */
export type Limit = (headers: Headers) => Promise<{ allowed: boolean }>;

// Order: method and path first, because a request that would be refused anyway
// costs no count; then the limit, before the body is read or anything is sent.
export async function forward(request: Request, segments: string[], limit: Limit): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  const url = upstreamUrl(segments, new URL(request.url).search);
  if (url === null) return new Response(null, { status: 404 });

  // An unlimited relay is not acceptable, and analytics must not break a page:
  // when the limiter cannot count (not configured in production, or Upstash
  // does not answer), nothing is forwarded and the answer is 503. The library
  // drops the event and the page never knows.
  let allowed: boolean;
  try {
    ({ allowed } = await limit(request.headers));
  } catch {
    return new Response(null, { status: 503 });
  }
  if (!allowed) return new Response(null, { status: 429 });

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) return new Response(null, { status: 413 });
  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BODY_BYTES) return new Response(null, { status: 413 });

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: forwardHeaders(request.headers),
      body,
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    const headers = new Headers();
    for (const name of FORWARD_RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value !== null) headers.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    // PostHog being unreachable is invisible to the page.
    return new Response(null, { status: 502 });
  }
}
