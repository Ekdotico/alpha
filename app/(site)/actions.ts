'use server';

import { cookies, headers } from 'next/headers';
import { ALPHA_NOTICE_COOKIE } from '@/lib/site';
import { joinWaitlist, serviceFailure, type WaitlistResult } from '@/lib/waitlist';

// Remembers that the reader acknowledged the release status. Setting a cookie
// in an action re-renders the route, and AlphaNotice then renders nothing. A
// year, and HttpOnly: nothing in the browser needs to read it.
export async function acknowledgeAlphaNotice(): Promise<void> {
  (await cookies()).set(ALPHA_NOTICE_COOKIE, '1', {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });
}

/** What the form renders from: the result, and the input to put back. */
export type WaitlistState = WaitlistResult & { email?: string; testing?: boolean };

// The waitlist form's server action. A server action, rather than a route
// handler, for two reasons: the form posts and gets its answer without
// JavaScript (useActionState is progressively enhanced), and Next rejects a
// cross-site invocation itself by comparing Origin with Host.
//
// The previous state is unused: each submission is judged on its own.
export async function submitWaitlist(
  _previous: WaitlistState | null,
  form: FormData,
): Promise<WaitlistState> {
  let result: WaitlistResult;
  try {
    result = await joinWaitlist(form, await headers());
  } catch (error) {
    result = serviceFailure(error);
  }
  if (result.status === 'ok') return result;
  // The reader's own input, handed back so a refused address can be corrected
  // rather than retyped, and the testing box keeps the choice they made.
  // Capped at the field's own maxLength.
  const email = form.get('email');
  return {
    ...result,
    email: typeof email === 'string' ? email.slice(0, 254) : undefined,
    testing: form.get('testing') === 'yes',
  };
}
