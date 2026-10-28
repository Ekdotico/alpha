// Which link a signup came from: the UTM parameters in the address bar, and
// the referring site's host name. Read by the form at the moment it is sent,
// never stored in the browser, and cleaned again on the server, which trusts
// nothing the form sends. Each value lands on the Brevo contact as the text
// attribute named here; Brevo refuses an attribute that does not exist yet.

/** Form field name, as the form sends it, mapped to its Brevo attribute. */
export const ATTRIBUTION_FIELDS = {
  utm_source: 'UTM_SOURCE',
  utm_medium: 'UTM_MEDIUM',
  utm_campaign: 'UTM_CAMPAIGN',
  utm_content: 'UTM_CONTENT',
  signup_referrer: 'SIGNUP_REFERRER',
} as const;

export const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;

const MAX_LENGTH = 100;

/** Lower-cased, trimmed, only [a-z0-9._-], at most 100 characters; null if nothing is left. */
export function cleanAttribution(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  // Sliced before the expression runs, so a long value costs nothing.
  const clean = value
    .slice(0, 4 * MAX_LENGTH)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, MAX_LENGTH);
  return clean === '' ? null : clean;
}

/**
 * The referrer's host name alone, never its path or query. Null when there is
 * no referrer, it does not parse, or it is this site or another ekdoti.co host,
 * since the redirect from ekdoti.co is ours and not where the reader came from.
 */
export function referrerHost(referrer: string, ownHost: string): string | null {
  if (referrer === '') return null;
  let host: string;
  try {
    host = new URL(referrer).hostname;
  } catch {
    return null;
  }
  if (host === ownHost || host === 'ekdoti.co' || host.endsWith('.ekdoti.co')) return null;
  return cleanAttribution(host);
}

/** The Brevo attributes a submitted form carries, with empty values left out. */
export function attributionAttributes(form: FormData): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const [field, attribute] of Object.entries(ATTRIBUTION_FIELDS)) {
    const value = cleanAttribution(form.get(field));
    if (value) attributes[attribute] = value;
  }
  return attributes;
}
