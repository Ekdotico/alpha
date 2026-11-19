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

type Call = { url: string; method: string; body: string };
let calls: Call[];

// `listIds` is what Brevo's contact lookup answers for an existing contact
// (the list by default); a DOI request after a delete answers 201.
function upstream(
  turnstile: object,
  brevoStatus: number,
  brevoBody: object = {},
  listIds = [7],
  retryStatus = 201,
) {
  calls = [];
  let deleted = false;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const method = init.method ?? 'GET';
      calls.push({ url, method, body: String(init.body) });
      if (url.includes('siteverify')) return Response.json(turnstile);
      if (method === 'GET') return Response.json({ listIds });
      if (method === 'DELETE') {
        deleted = true;
        return new Response(null, { status: 204 });
      }
      if (deleted) {
        return retryStatus === 204
          ? new Response(null, { status: 204 })
          : Response.json({}, { status: retryStatus });
      }
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
    expect(brevo.redirectionUrl).toBe('https://alpha.ekdoti.co/confirmed');
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

  it('sends the link the reader came from as attributes, and none when there is none', async () => {
    upstream({ success: true }, 201);
    await joinWaitlist(
      form({ ...valid, utm_source: 'LinkedIn', utm_content: 'Test<script>', utm_medium: '' }),
      headers,
    );
    expect(JSON.parse(calls[1].body).attributes).toEqual({
      UTM_SOURCE: 'linkedin',
      UTM_CONTENT: 'testscript',
    });
    upstream({ success: true }, 201);
    await joinWaitlist(form(valid), headers);
    expect(JSON.parse(calls[1].body)).not.toHaveProperty('attributes');
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

  it('sends nothing to a contact already on either list', async () => {
    vi.stubEnv('BREVO_TESTING_LIST_ID', '9');
    for (const listIds of [[7], [9], [2, 7]]) {
      upstream({ success: true }, 204, {}, listIds);
      expect(await joinWaitlist(form(valid), headers)).toEqual({ status: 'ok' });
      expect(calls.map((c) => c.method)).toEqual(['POST', 'POST', 'GET']);
    }
  });

  it('deletes a contact on neither list and asks Brevo again, so the confirmation is sent', async () => {
    vi.stubEnv('BREVO_TESTING_LIST_ID', '9');
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    for (const listIds of [[], [2]]) {
      upstream({ success: true }, 204, {}, listIds);
      expect(await joinWaitlist(form(valid), headers)).toEqual({ status: 'ok' });
      expect(calls.slice(1).map((c) => c.method)).toEqual(['POST', 'GET', 'DELETE', 'POST']);
      expect(calls[3].url).toBe('https://api.brevo.com/v3/contacts/reader%40example.org');
      expect(JSON.parse(calls[4].body)).toMatchObject({ email: 'reader@example.org', templateId: 3 });
      expect(info).toHaveBeenLastCalledWith('[waitlist] ok: brevo-recreated');
    }
  });

  it('answers "check your inbox" when Brevo still holds the address after the delete, and logs why', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    upstream({ success: true }, 204, {}, [], 204);
    expect(await joinWaitlist(form(valid), headers)).toEqual({ status: 'ok' });
    expect(info).toHaveBeenCalledWith(
      '[waitlist] resend: lookup 200, lists 0, blocklisted false, delete 204, retry 204',
    );
    expect(info).toHaveBeenLastCalledWith('[waitlist] ok: brevo-unsent');
    expect(JSON.stringify(info.mock.calls)).not.toMatch(/reader@example\.org/i);
  });

  it('logs which success path a signup took, and never the address', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    for (const [status, path] of [
      [201, 'brevo-created'],
      [204, 'brevo-existing'],
    ] as const) {
      upstream({ success: true }, status);
      await joinWaitlist(form(valid), headers);
      expect(info).toHaveBeenLastCalledWith(`[waitlist] ok: ${path}`);
    }
    await joinWaitlist(form({ ...valid, website: 'x' }), headers);
    expect(info).toHaveBeenLastCalledWith('[waitlist] ok: honeypot');
    expect(JSON.stringify(info.mock.calls)).not.toMatch(/reader@example\.org/i);
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
