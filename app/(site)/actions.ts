'use server';

import { headers } from 'next/headers';
import { joinWaitlist, serviceFailure, type WaitlistResult } from '@/lib/waitlist';

/** What the form renders from: the result, and the address to put back. */
export type WaitlistState = WaitlistResult & { email?: string };

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
  // rather than retyped. Capped at the field's own maxLength.
  const email = form.get('email');
  return { ...result, email: typeof email === 'string' ? email.slice(0, 254) : undefined };
}
