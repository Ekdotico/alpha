import 'server-only';
import { email as emailSchema } from '@ekdotico/amyntico/validation';
import { attributionAttributes } from '@/lib/attribution';
import { clientIp, consumeClient, consumeSend } from '@/lib/rate-limit';
import { absoluteUrl } from '@/lib/site';
import { TURNSTILE_ACTION, TURNSTILE_ORIGIN } from '@/lib/turnstile';

// One signup, from form post to Brevo. Every step that can refuse runs before
// the one that sends an email, cheapest first:
//
//   1. the honeypot, which a person never fills;
//   2. the address, validated and normalised (trimmed, lower-cased);
//   3. the client's rate limit, before any third party is called;
//   4. Turnstile, verified on the server against the action this form signs;
//   5. the address's and the day's send limits;
//   6. Brevo's double opt-in, which stores the contact unconfirmed and sends
//      the confirmation. The contact joins the list only once its owner clicks.
//      A reader who ticked the testing box joins the testing list at the same
//      moment, and a Brevo automation on that list sends the testing email, so
//      an address nobody confirmed is never sent it. The link the reader came
//      from, if the form sent one, rides along as contact attributes, cleaned
//      again here (lib/attribution.ts).
//
// The reply never says whether an address was already on the list: a repeat
// signup, a signup the address limit absorbed, and a new one all answer "check
// your inbox". Anything else would let the form be used to test who signed up.

export type WaitlistResult =
  | { status: 'ok' }
  | { status: 'invalid'; message: string }
  | { status: 'refused'; message: string };

const MESSAGES = {
  check:
    'The spam check did not finish. Wait for it to complete under the address field, then send the form again.',
  client: 'Too many signups from this connection. Try again in ten minutes.',
  global: 'The waitlist has had a busy day. Try again tomorrow.',
  service: 'Your address could not be added. Try again in a few minutes.',
} as const;

// RFC 5321 caps a path at 256 octets, so an address over 254 characters cannot
// be delivered to. Checked before parsing so a megabyte of form input is never
// handed to a regular expression.
const MAX_EMAIL = 254;
// Turnstile documents its tokens as at most 2048 characters.
const MAX_TOKEN = 2048;

// Cloudflare's published test secret that always passes, paired with the test
// site key in lib/turnstile.ts. Outside production only.
const TEST_SECRET = '1x0000000000000000000000000000000AA';

const BREVO_URL = 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation';
const SITEVERIFY_URL = `${TURNSTILE_ORIGIN}/turnstile/v0/siteverify`;
const UPSTREAM_TIMEOUT_MS = 8000;

class ConfigError extends Error {}

const isProduction = () => process.env.NODE_ENV === 'production';

// Every "check your inbox" looks the same to the reader, by design, so the log
// is the only place that says which one it was: the trap, the address's own
// limit, a new contact, or one Brevo already had (which it sends nothing to).
// Never with the address, and never in the reader's answer.
type OkPath = 'honeypot' | 'address-limit' | 'brevo-created' | 'brevo-existing';
function ok(path: OkPath): WaitlistResult {
  console.info(`[waitlist] ok: ${path}`);
  return { status: 'ok' };
}

export async function joinWaitlist(form: FormData, headers: Headers): Promise<WaitlistResult> {
  // 1. A bot that filled the trap is told it succeeded, and nothing is sent.
  if (String(form.get('website') ?? '') !== '') return ok('honeypot');

  // 2.
  const raw = form.get('email');
  const parsed =
    typeof raw === 'string' && raw.length <= MAX_EMAIL ? emailSchema.safeParse(raw) : null;
  if (!parsed?.success) {
    return { status: 'invalid', message: 'Enter an email address, such as name@example.com.' };
  }
  const email = parsed.data;

  // A missing token is checked here, before the client limit, because it
  // costs nothing to check: a reader who sends the form before the widget
  // finishes should not spend one of their five tries on it.
  const token = form.get('cf-turnstile-response');
  if (typeof token !== 'string' || token === '' || token.length > MAX_TOKEN) {
    return { status: 'refused', message: MESSAGES.check };
  }

  // 3.
  if (!(await consumeClient(headers)).allowed) return { status: 'refused', message: MESSAGES.client };

  // 4.
  if (!(await verifyTurnstile(token, clientIp(headers)))) {
    return { status: 'refused', message: MESSAGES.check };
  }

  // 5. An inbox past its own limit is answered as a success: its owner has
  // already been sent a link today, and saying more would confirm the address.
  const send = await consumeSend(email);
  if (!send.allowed) {
    return send.scope === 'global' ? { status: 'refused', message: MESSAGES.global } : ok('address-limit');
  }

  // 6.
  return requestDoubleOptIn(email, form.get('testing') === 'yes', attributionAttributes(form));
}

// A Brevo ID from the environment, or null. Number('') is 0, which is an
// integer, so a set-but-empty variable has to be refused explicitly.
function brevoId(name: string): number | null {
  const id = Number(process.env[name]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY || (isProduction() ? null : TEST_SECRET);
  if (!secret) throw new ConfigError('TURNSTILE_SECRET_KEY is not set.');
  // The test secret passes every token, so it must never reach production.
  if (isProduction() && secret === TEST_SECRET) {
    throw new ConfigError('TURNSTILE_SECRET_KEY is Cloudflare’s always-pass test secret.');
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  const res = await fetch(SITEVERIFY_URL, {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Turnstile siteverify answered ${res.status}.`);
  const outcome = (await res.json()) as { success?: boolean; action?: string };
  // The test secret signs no action, so the action is checked only against a
  // real secret.
  return outcome.success === true && (secret === TEST_SECRET || outcome.action === TURNSTILE_ACTION);
}

async function requestDoubleOptIn(
  email: string,
  testing: boolean,
  attributes: Record<string, string>,
): Promise<WaitlistResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = brevoId('BREVO_LIST_ID');
  const templateId = brevoId('BREVO_DOI_TEMPLATE_ID');
  // Required only when the box is ticked, so the list can go live before the
  // testing list exists. A ticked box with no list to put it in is a refusal,
  // not a signup that quietly drops the reader's consent.
  const testingListId = testing ? brevoId('BREVO_TESTING_LIST_ID') : null;
  if (!apiKey || !listId || !templateId || (testing && !testingListId)) {
    if (isProduction()) {
      throw new ConfigError(
        'BREVO_API_KEY, BREVO_LIST_ID and BREVO_DOI_TEMPLATE_ID must all be set, and ' +
          'BREVO_TESTING_LIST_ID too when the testing box is ticked; the IDs are positive integers.',
      );
    }
    console.warn('[waitlist] Brevo is not configured; the signup was accepted and not sent.');
    return { status: 'ok' };
  }

  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      email,
      // Brevo applies these lists only on confirmation, so the testing list's
      // automation never reaches an unconfirmed address.
      includeListIds: testingListId ? [listId, testingListId] : [listId],
      templateId,
      redirectionUrl: absoluteUrl('/confirmed'),
      // Held with the unconfirmed contact and written on confirmation, like the
      // lists. Left out when empty, so a later signup with no link never
      // clears one an earlier signup recorded.
      ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
    }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  // 201 created, 204 an existing contact updated. Both are a success, and the
  // second is deliberately indistinguishable from the first to the reader.
  if (res.status === 201) return ok('brevo-created');
  if (res.status === 204) return ok('brevo-existing');

  const detail = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
  // Brevo is stricter than the schema about what it will deliver to.
  if (res.status === 400 && /email/i.test(detail.message ?? '')) {
    return { status: 'invalid', message: 'That address could not be accepted. Check it for typing errors.' };
  }
  // Logged without the address: the log is not where the list lives.
  throw new Error(`Brevo answered ${res.status} ${detail.code ?? ''}: ${detail.message ?? ''}`);
}

/** Every failure that is ours rather than the reader's, in one answer. */
export function serviceFailure(error: unknown): WaitlistResult {
  console.error('[waitlist]', error instanceof ConfigError ? `misconfigured: ${error.message}` : error);
  return { status: 'refused', message: MESSAGES.service };
}
