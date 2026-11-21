import { afterEach, describe, expect, it, vi } from 'vitest';
import { config } from '../proxy';
import { forward, INGEST_ORIGIN, upstreamUrl, type Limit } from './analytics-proxy';

afterEach(() => vi.unstubAllGlobals());

function stubUpstream(headers: Record<string, string> = {}) {
  const fetchMock = vi.fn(async () => new Response('{"status":1}', { status: 200, headers }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const open: Limit = async () => ({ allowed: true });
const post = (headers: Record<string, string> = {}, path = 'e/') =>
  new Request(`https://alpha.ekdoti.co/ingest/${path}?ip=0`, { method: 'POST', body: '{}', headers });

describe('the analytics forward', () => {
  // Rule 13 and rule 15e: nothing that identifies the reader's session reaches PostHog.
  it('forwards no cookie, no credential and no address', async () => {
    const fetchMock = stubUpstream();
    await forward(
      post({
        'content-type': 'application/json',
        cookie: 'ekd-alpha-notice=1; session=SENTINEL',
        authorization: 'Bearer SENTINEL',
        'x-forwarded-for': '203.0.113.7',
        'x-real-ip': '203.0.113.7',
        forwarded: 'for=203.0.113.7',
        referer: 'https://alpha.ekdoti.co/?email=SENTINEL',
        origin: 'https://alpha.ekdoti.co',
      }),
      ['e', ''],
      open,
    );
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sent = new Headers(init.headers);
    expect(url).toBe(`${INGEST_ORIGIN}/e/?ip=0`);
    expect([...sent.keys()]).toEqual(['content-type']);
    expect(JSON.stringify([...sent])).not.toContain('SENTINEL');
  });

  // A1: the forward is not a relay to every PostHog endpoint.
  it('answers 404 to any path but /e/, and sends nothing upstream', async () => {
    const fetchMock = stubUpstream();
    const limit = vi.fn(open);
    const others = [
      ['i', 'v0', 'e', ''],
      ['batch', ''],
      ['capture', ''],
      ['flags', ''],
      ['static', 'array.js'],
      ['array', 'phc_x', 'config.js'],
      ['api', 'environments', ''],
      ['decide', ''],
      ['e', 'extra'],
      ['e', '', ''],
      ['..', 'x'],
      ['e', '..'],
      ['//evil.example'],
      ['E', ''],
      [],
    ];
    for (const segments of others) {
      const res = await forward(post({}, segments.join('/')), segments, limit);
      expect(res.status, JSON.stringify(segments)).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(limit).not.toHaveBeenCalled();
  });

  it('admits /e and /e/ to the ingestion host, and nothing else', () => {
    expect(upstreamUrl(['e', ''], '?ver=1')).toBe(`${INGEST_ORIGIN}/e/?ver=1`);
    expect(upstreamUrl(['e'], '')).toBe(`${INGEST_ORIGIN}/e/`);
  });

  it('answers 405 to any method but POST, and sends nothing', async () => {
    const fetchMock = stubUpstream();
    for (const method of ['GET', 'DELETE', 'PUT', 'OPTIONS']) {
      const res = await forward(new Request('https://alpha.ekdoti.co/ingest/e/', { method }), ['e', ''], open);
      expect(res.status, method).toBe(405);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers 413 to a large body and sends nothing', async () => {
    const fetchMock = stubUpstream();
    const big = new Request('https://alpha.ekdoti.co/ingest/e/', { method: 'POST', body: 'x'.repeat(300_000) });
    expect((await forward(big, ['e', ''], open)).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passes no Set-Cookie back to the browser', async () => {
    stubUpstream({ 'set-cookie': 'ph=1', 'content-type': 'application/json' });
    const res = await forward(post(), ['e', ''], open);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(res.headers.get('content-type')).toBe('application/json');
  });

  it('is invisible when PostHog does not answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    expect((await forward(post(), ['e', ''], open)).status).toBe(502);
  });
});

// A2: a per-client limit, and what happens when it cannot count.
describe('the limit on the forward', () => {
  it('answers 429 over the limit, and sends nothing upstream', async () => {
    const fetchMock = stubUpstream();
    const res = await forward(post(), ['e', ''], async () => ({ allowed: false }));
    expect(res.status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('counts the request it is given, with the headers of that request', async () => {
    stubUpstream();
    const limit = vi.fn(open);
    await forward(post({ 'x-real-ip': '203.0.113.9' }), ['e', ''], limit);
    expect(limit).toHaveBeenCalledOnce();
    expect(limit.mock.calls[0]![0].get('x-real-ip')).toBe('203.0.113.9');
  });

  // The limiter throws when the store is not configured in production, and on a
  // store error: an unlimited relay is not acceptable, and the page must not
  // break, so nothing is forwarded and the library drops the event quietly.
  it('answers 503 and sends nothing upstream when the limiter cannot count', async () => {
    const fetchMock = stubUpstream();
    const res = await forward(post(), ['e', ''], async () => {
      throw new Error('store not configured');
    });
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// Rule 20, for a site with no gate: the path is left out of the policy's matcher on purpose.
describe('the policy matcher', () => {
  const matches = (path: string) => new RegExp(`^${config.matcher[0]}$`).test(path);

  it('leaves /ingest to the forward and keeps the policy on every page', () => {
    expect(matches('/ingest/e/')).toBe(false);
    expect(matches('/ingest')).toBe(false);
    expect(matches('/')).toBe(true);
    expect(matches('/privacy')).toBe(true);
    expect(matches('/ingestion-notes')).toBe(true);
  });
});
