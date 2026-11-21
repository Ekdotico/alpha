// @vitest-environment happy-dom
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const SENTINEL_ADDRESS = 'reader-SENTINEL@example.org';
const SENTINEL_TOKEN = 'turnstile-SENTINEL-0xABC';

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// The real library, a made-up key, and every network path replaced, so nothing leaves the test.
async function run(): Promise<string[]> {
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test_key_not_real');
  const bodies: string[] = [];
  const sink = vi.fn(async (_url: unknown, init?: { body?: unknown }) => {
    bodies.push(String(init?.body ?? ''));
    return new Response('{"status":1}', { status: 200 });
  });
  vi.stubGlobal('fetch', sink);
  window.fetch = sink as unknown as typeof window.fetch;
  Object.defineProperty(navigator, 'sendBeacon', { value: (_: string, d: unknown) => (bodies.push(String(d)), true), configurable: true });

  // The library sends by XMLHttpRequest unless told otherwise; record that too.
  class RecordingXhr {
    status = 200;
    readyState = 4;
    responseText = '{"status":1}';
    onreadystatechange: (() => void) | null = null;
    open() {}
    setRequestHeader() {}
    send(body?: unknown) {
      bodies.push(String(body ?? ''));
      queueMicrotask(() => this.onreadystatechange?.());
    }
  }
  vi.stubGlobal('XMLHttpRequest', RecordingXhr);
  window.XMLHttpRequest = RecordingXhr as never;

  const { default: posthog } = await import('posthog-js');
  const { buildConfig, outcomeOf } = await import('./analytics');
  posthog.init('phc_test_key_not_real', { ...buildConfig(), disable_compression: true, request_batching: false, opt_out_useragent_filter: true });
  // A submission whose result carries what must never be sent.
  const state = { status: 'refused', message: SENTINEL_ADDRESS, email: SENTINEL_ADDRESS, token: SENTINEL_TOKEN } as never;
  posthog.capture('waitlist_submit', { outcome: outcomeOf(state), email: SENTINEL_ADDRESS });
  posthog.capture('$autocapture', { $el_text: SENTINEL_ADDRESS });
  await new Promise((r) => setTimeout(r, 300));
  return bodies;
}

describe('the browser, with analytics on', () => {
  let bodies: string[];
  // One session for both tests: the library initialises once per page.
  beforeAll(async () => {
    bodies = await run();
  });

  // Rule 23: the privacy notice says no analytics cookies, and it stays true.
  it('writes no ph_ cookie and no ph_ key to localStorage or sessionStorage', () => {
    expect(document.cookie).not.toMatch(/ph_/);
    for (const store of [localStorage, sessionStorage]) {
      expect(Object.keys(store).filter((k) => /ph_|posthog/i.test(k))).toEqual([]);
    }
  });

  // Rule 24: no address and no Turnstile token in anything sent.
  it('sends no address and no spam-check token in any request', () => {
    const all = bodies.join('\n');
    // The permitted event did go out, so an empty body cannot pass this test.
    expect(all).toContain('waitlist_submit');
    expect(all).toContain('"outcome":"error"');
    expect(all).not.toContain('SENTINEL');
    expect(all).not.toContain('$autocapture');
  });
});
