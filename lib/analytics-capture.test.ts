// @vitest-environment happy-dom
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ALLOWED_SEGMENTS } from './analytics-proxy';

// The lazy path as the site runs it: capture() fetches posthog-js after the
// page has loaded and starts it with buildConfig() as it is, compression and
// batching included. Every network path is replaced, so nothing leaves the test.
const requests: { url: string; via: string }[] = [];
const idb = { open: vi.fn(), deleteDatabase: vi.fn(), databases: vi.fn(async () => []) };

beforeAll(async () => {
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test_key_not_real');
  const sink = vi.fn(async (url: unknown) => {
    requests.push({ url: String(url), via: 'fetch' });
    return new Response('{"status":1}', { status: 200 });
  });
  vi.stubGlobal('fetch', sink);
  window.fetch = sink as unknown as typeof window.fetch;
  class RecordingXhr {
    status = 200;
    readyState = 4;
    responseText = '{"status":1}';
    onreadystatechange: (() => void) | null = null;
    private url = '';
    open(_method: string, url: string) {
      this.url = url;
    }
    setRequestHeader() {}
    send() {
      requests.push({ url: this.url, via: 'xhr' });
      queueMicrotask(() => this.onreadystatechange?.());
    }
  }
  vi.stubGlobal('XMLHttpRequest', RecordingXhr);
  window.XMLHttpRequest = RecordingXhr as never;
  Object.defineProperty(navigator, 'sendBeacon', {
    value: (url: string) => (requests.push({ url, via: 'beacon' }), true),
    configurable: true,
  });

  // The library drops events from a browser it takes for a bot: happy-dom
  // reports itself as automated (navigator.webdriver) and by its own agent.
  Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true });
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    configurable: true,
  });
  // happy-dom has no IndexedDB: a stub that records being opened proves the
  // library never reaches for it, where an absent API would prove nothing.
  vi.stubGlobal('indexedDB', idb);
  window.indexedDB = idb as never;

  const { capture } = await import('./analytics');
  capture({ name: 'page_view', props: { route: '/' } });
  capture({ name: 'waitlist_submit', props: { outcome: 'ok' } });
  // posthog-js is fetched after the window's load event, then flushes on its own timer.
  await new Promise((r) => setTimeout(r, 4000));
}, 15000);

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('capture(), the lazy path, with the production configuration', () => {
  // The list ALLOWED_SEGMENTS is taken from this: a library update that calls
  // anywhere else fails here, and the forward would have answered it 404.
  it('calls the site\'s own /ingest/e/ and nothing else, and the forward admits exactly that', () => {
    expect(requests.length).toBeGreaterThan(0);
    const paths = new Set(requests.map(({ url }) => new URL(url, 'https://alpha.ekdoti.co').pathname));
    expect([...paths]).toEqual(['/ingest/e/']);
    expect([...ALLOWED_SEGMENTS]).toEqual(['e']);
  });

  // Rule 23, with the storage the first test left out.
  it('opens no IndexedDB database, and sets no ph_ cookie or storage key', async () => {
    expect(idb.open).not.toHaveBeenCalled();
    expect(idb.deleteDatabase).not.toHaveBeenCalled();
    expect(document.cookie).not.toMatch(/ph_/);
    expect(Object.keys(localStorage).filter((k) => /ph_|posthog/i.test(k))).toEqual([]);
    expect(Object.keys(sessionStorage).filter((k) => /ph_|posthog/i.test(k))).toEqual([]);
  });

  it('loads nothing from the assets host, so the forward need not admit it', () => {
    const assets = requests.filter(({ url }) => /\/ingest\/(static|array)\//.test(url));
    expect(assets).toEqual([]);
  });
});
