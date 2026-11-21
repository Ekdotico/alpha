import { afterEach, describe, expect, it, vi } from 'vitest';
import { config } from '../proxy';
import { ASSETS_ORIGIN, forward, INGEST_ORIGIN, upstreamUrl } from './analytics-proxy';

afterEach(() => vi.unstubAllGlobals());

function stubUpstream(headers: Record<string, string> = {}) {
  const fetchMock = vi.fn(async () => new Response('{"status":1}', { status: 200, headers }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const post = (headers: Record<string, string>) =>
  new Request('https://alpha.ekdoti.co/ingest/e/?ip=0', { method: 'POST', body: '{}', headers });

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
    );
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sent = new Headers(init.headers);
    expect(url).toBe(`${INGEST_ORIGIN}/e/?ip=0`);
    expect([...sent.keys()]).toEqual(['content-type']);
    expect(JSON.stringify([...sent])).not.toContain('SENTINEL');
  });

  it('sends settings and scripts to the assets host and events to the ingestion host', () => {
    expect(upstreamUrl(['array', 'phc_x', 'config.js'], '')).toBe(`${ASSETS_ORIGIN}/array/phc_x/config.js`);
    expect(upstreamUrl(['static', 'a.js'], '')).toBe(`${ASSETS_ORIGIN}/static/a.js`);
    expect(upstreamUrl(['e', ''], '?ver=1')).toBe(`${INGEST_ORIGIN}/e/?ver=1`);
  });

  it('refuses a path that could leave PostHog or climb out of it', () => {
    for (const segments of [['..', 'x'], ['a', '%2e%2e'], ['a b'], ['//evil.example'], ['a\\b']]) {
      expect(upstreamUrl(segments, '')).toBeNull();
    }
  });

  it('answers 405 to other methods and 413 to a large body, and sends neither upstream', async () => {
    const fetchMock = stubUpstream();
    expect((await forward(new Request('https://alpha.ekdoti.co/ingest/e/', { method: 'DELETE' }), ['e', ''])).status).toBe(405);
    const big = new Request('https://alpha.ekdoti.co/ingest/e/', {
      method: 'POST',
      body: 'x'.repeat(300_000),
    });
    expect((await forward(big, ['e', ''])).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passes no Set-Cookie back to the browser', async () => {
    stubUpstream({ 'set-cookie': 'ph=1', 'content-type': 'application/json' });
    const res = await forward(post({}), ['e', '']);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(res.headers.get('content-type')).toBe('application/json');
  });

  it('is invisible when PostHog does not answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    expect((await forward(post({}), ['e', ''])).status).toBe(502);
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
