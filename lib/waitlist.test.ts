import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// server-only throws outside a React Server Component build; the logic under
// test is plain TypeScript.
vi.mock('server-only', () => ({}));

const { joinWaitlist } = await import('./waitlist');

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const headers = new Headers({ 'x-real-ip': '203.0.113.7' });
const valid = { email: '  Reader@Example.org ', 'cf-turnstile-response': 'token' };

type Call = { url: string; body: string };
let calls: Call[];

function upstream(turnstile: object, brevoStatus: number, brevoBody: object = {}) {
  calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, body: String(init.body) });
      if (url.includes('siteverify')) return Response.json(turnstile);
      return brevoStatus === 204
        ? new Response(null, { status: 204 })
        : Response.json(brevoBody, { status: brevoStatus });
    }),
  );
}

beforeEach(() => {
  vi.stubEnv('BREVO_API_KEY', 'key');
  vi.stubEnv('BREVO_LIST_ID', '7');
  vi.stubEnv('BREVO_DOI_TEMPLATE_ID', '3');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('joinWaitlist', () => {
  it('sends a normalised address to Brevo double opt-in after Turnstile passes', async () => {
    upstream({ success: true }, 201);
    expect(await joinWaitlist(form(valid), headers)).toEqual({ status: 'ok' });
    const brevo = JSON.parse(calls[1].body);
    expect(brevo).toMatchObject({ email: 'reader@example.org', includeListIds: [7], templateId: 3 });
    expect(brevo.redirectionUrl).toBe('https://icai.ekdoti.co/confirmed');
    expect(calls[0].body).toContain('remoteip=203.0.113.7');
  });

  it('adds the testing list only when the box is ticked', async () => {
    vi.stubEnv('BREVO_TESTING_LIST_ID', '9');
    upstream({ success: true }, 201);
    await joinWaitlist(form({ ...valid, testing: 'yes' }), headers);
    expect(JSON.parse(calls[1].body).includeListIds).toEqual([7, 9]);
    upstream({ success: true }, 201);
    await joinWaitlist(form(valid), headers);
    expect(JSON.parse(calls[1].body).includeListIds).toEqual([7]);
  });

  it('refuses a ticked box in production when there is no testing list to honour it', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'real-secret');
    const limits = await import('./rate-limit');
    vi.spyOn(limits, 'consumeClient').mockResolvedValue({ allowed: true, scope: 'client' });
    vi.spyOn(limits, 'consumeSend').mockResolvedValue({ allowed: true, scope: 'address' });
    upstream({ success: true, action: 'waitlist' }, 201);
    await expect(joinWaitlist(form({ ...valid, testing: 'yes' }), headers)).rejects.toThrow(
      'BREVO_TESTING_LIST_ID',
    );
    expect(calls.some((c) => c.url.includes('brevo'))).toBe(false);
  });

  it('answers an address already on the list exactly as a new one', async () => {
    upstream({ success: true }, 204);
    expect(await joinWaitlist(form(valid), headers)).toEqual({ status: 'ok' });
  });

  it('pretends success to a filled honeypot and calls nothing', async () => {
    upstream({ success: true }, 201);
    expect(await joinWaitlist(form({ ...valid, website: 'x' }), headers)).toEqual({ status: 'ok' });
    expect(calls).toHaveLength(0);
  });

  it('refuses a malformed or oversized address before any network call', async () => {
    upstream({ success: true }, 201);
    for (const email of ['not-an-address', `${'a'.repeat(250)}@x.org`]) {
      const result = await joinWaitlist(form({ ...valid, email }), headers);
      expect(result.status).toBe('invalid');
    }
    expect(calls).toHaveLength(0);
  });

  it('refuses a missing or failed Turnstile token and never reaches Brevo', async () => {
    upstream({ success: false }, 201);
    expect((await joinWaitlist(form({ email: 'a@b.org' }), headers)).status).toBe('refused');
    expect((await joinWaitlist(form(valid), headers)).status).toBe('refused');
    expect(calls.some((c) => c.url.includes('brevo'))).toBe(false);
  });

  it('throws on an unexpected Brevo answer, so the action reports a service failure', async () => {
    upstream({ success: true }, 401, { code: 'unauthorized', message: 'Key not found' });
    await expect(joinWaitlist(form(valid), headers)).rejects.toThrow('Brevo answered 401');
  });

  it('accepts a real-secret token only for the waitlist action', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'real-secret');
    upstream({ success: true, action: 'login' }, 201);
    expect((await joinWaitlist(form(valid), headers)).status).toBe('refused');
    upstream({ success: true, action: 'waitlist' }, 201);
    expect((await joinWaitlist(form(valid), headers)).status).toBe('ok');
  });

  it('fails closed in production without a secret, or with the test secret', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    // The production limiter would throw first without Upstash; the point here
    // is the Turnstile guard, so the limiter is given a working stand-in.
    const limits = await import('./rate-limit');
    vi.spyOn(limits, 'consumeClient').mockResolvedValue({ allowed: true, scope: 'client' });
    upstream({ success: true }, 201);
    await expect(joinWaitlist(form(valid), headers)).rejects.toThrow('TURNSTILE_SECRET_KEY is not set');
    vi.stubEnv('TURNSTILE_SECRET_KEY', '1x0000000000000000000000000000000AA');
    await expect(joinWaitlist(form(valid), headers)).rejects.toThrow('always-pass test secret');
    expect(calls).toHaveLength(0);
  });
});

describe('inboxKey', () => {
  it('folds +tags everywhere and Gmail dots, so one inbox shares one send limit', async () => {
    const { inboxKey } = await import('./rate-limit');
    expect(inboxKey('v.ictim+1@gmail.com')).toBe('victim@gmail.com');
    expect(inboxKey('victim@googlemail.com')).toBe('victim@gmail.com');
    expect(inboxKey('a.b+news@example.org')).toBe('a.b@example.org');
  });
});
