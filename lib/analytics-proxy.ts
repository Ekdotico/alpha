// The same-origin path the browser reports to (app/ingest/[...path]/route.ts).
// It forwards to PostHog's EU cloud and nothing else, and it forwards only what
// is listed here: the request's Cookie and Authorization headers, a client
// address and the page it came from never reach PostHog, because a header that
// is not on the list is not copied. EU only, and fixed in code, so no variable
// can point it elsewhere.

export const INGEST_ORIGIN = 'https://eu.i.posthog.com';
export const ASSETS_ORIGIN = 'https://eu-assets.i.posthog.com';

// posthog-js loads its settings and any extension from the assets host, under
// these two first segments; everything else is an event on the ingestion host.
const ASSET_SEGMENTS = ['static', 'array'];
const SAFE_PATH = /^[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*\/?$/;
const FORWARD_REQUEST_HEADERS = ['content-type', 'content-encoding', 'accept', 'user-agent'];
const FORWARD_RESPONSE_HEADERS = ['content-type', 'cache-control'];
const MAX_BODY_BYTES = 256 * 1024;

/** Where a path under /ingest goes, or null if it is not one we forward. */
export function upstreamUrl(segments: string[], search: string): string | null {
  const path = segments.join('/');
  if (!SAFE_PATH.test(path) || segments.some((s) => s === '.' || s === '..')) return null;
  const origin = ASSET_SEGMENTS.includes(segments[0] ?? '') ? ASSETS_ORIGIN : INGEST_ORIGIN;
  return `${origin}/${path}${search}`;
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

export async function forward(request: Request, segments: string[]): Promise<Response> {
  if (!['GET', 'POST', 'OPTIONS'].includes(request.method)) return new Response(null, { status: 405 });
  const url = upstreamUrl(segments, new URL(request.url).search);
  if (url === null) return new Response(null, { status: 404 });

  let body: ArrayBuffer | undefined;
  if (request.method === 'POST') {
    const length = Number(request.headers.get('content-length') ?? 0);
    if (length > MAX_BODY_BYTES) return new Response(null, { status: 413 });
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) return new Response(null, { status: 413 });
  }

  try {
    const upstream = await fetch(url, {
      method: request.method,
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
