'use client';

import Link from 'next/link';
import { type FormEvent, useActionState, useEffect, useId, useRef, useState } from 'react';
import { Button, Checkbox, FormFault, TextField } from '@ekdotico/domico/components';
import { submitWaitlist, type WaitlistState } from '@/app/(site)/actions';
import { ATTRIBUTION_FIELDS, cleanAttribution, referrerHost, UTM_PARAMS } from '@/lib/attribution';
import { TURNSTILE_ACTION, TURNSTILE_SCRIPT, turnstileSiteKey } from '@/lib/turnstile';

// The waitlist form, rendered twice on the page: in the hero and in the closing
// section. Each instance has its own Turnstile widget, because a token is
// single-use and belongs to one form.
//
// It posts to a server action, so the address reaches the server without
// JavaScript; Turnstile itself needs JavaScript, and a submission without its
// token is refused with a message that says so.

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// One script for both forms. It is appended by this bundle, which the
// framework loaded under the request's nonce, so the policy's 'strict-dynamic'
// admits it without a nonce of its own (see proxy.ts).
let loading: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error('Turnstile did not load.'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

// Fills the hidden source fields from the address bar and the referrer as the
// form is sent, not when the page loads, and keeps nothing in the browser:
// storing it would need cookie consent. React reads the form data after this
// handler returns, so the values travel with this submission. Any failure
// leaves the fields empty and the signup goes ahead.
function captureSource(event: FormEvent<HTMLFormElement>) {
  try {
    const form = event.currentTarget;
    const set = (name: string, value: string | null) => {
      const input = form.elements.namedItem(name);
      if (input instanceof HTMLInputElement) input.value = value ?? '';
    };
    const params = new URLSearchParams(window.location.search);
    for (const name of UTM_PARAMS) set(name, cleanAttribution(params.get(name)));
    set('signup_referrer', referrerHost(document.referrer, window.location.hostname));
  } catch {
    // Attribution is a nicety; the signup is not.
  }
}

export function WaitlistForm({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const [state, formAction] = useActionState(submitWaitlist, null);

  if (state?.status === 'ok') {
    return (
      <div className="waitlist">
        <FormFault
          title="Check your inbox"
          tone="neutral"
          announce="polite"
          autoFocus
          headingLevel={headingLevel}
        >
          <p>
            A confirmation link is on its way. Your address joins the waitlist once you open it.
          </p>
        </FormFault>
      </div>
    );
  }

  return <WaitlistFields state={state} formAction={formAction} headingLevel={headingLevel} />;
}

// The form itself, a component of its own so that the success message above
// unmounts it, and the effect's cleanup removes its Turnstile widget.
function WaitlistFields({
  state,
  formAction,
  headingLevel,
}: {
  state: WaitlistState | null;
  formAction: (form: FormData) => void;
  headingLevel: 2 | 3;
}) {
  const fieldId = useId();
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [checkFailed, setCheckFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey: turnstileSiteKey(),
          action: TURNSTILE_ACTION,
          theme: 'auto',
          size: 'flexible',
        });
      })
      .catch(() => {
        if (!cancelled) setCheckFailed(true);
      });
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);

  // A token is spent by the server's check whatever the answer, so every
  // answer asks the widget for a fresh one.
  useEffect(() => {
    if (state && widget.current) window.turnstile?.reset(widget.current);
  }, [state]);

  return (
    <form className="waitlist" action={formAction} onSubmit={captureSource}>
      <div className="waitlist-row">
        <TextField
          id={fieldId}
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          required
          maxLength={254}
          // React resets a form after its action; the server hands the address
          // back so a refused one is still there to correct.
          defaultValue={state?.email ?? ''}
          error={state?.status === 'invalid' ? state.message : undefined}
        />
        <Button type="submit" variant="primary" pendingLabel="Adding you…">
          Join the waitlist
        </Button>
      </div>

      {/* Unticked by default: taking part in testing is a separate consent from
          joining the list, and GDPR does not count a pre-ticked box as one. */}
      <Checkbox
        className="waitlist-testing"
        name="testing"
        value="yes"
        label="I would also like to hear about taking part in user testing"
        hint="Optional. Once you confirm your address, we send one email about what testing involves. Nothing is arranged without your agreement."
        defaultChecked={state?.testing ?? false}
      />

      {/* The honeypot: a field a person never sees or reaches. */}
      <div className="waitlist-trap" aria-hidden="true">
        <label htmlFor={`${fieldId}-website`}>Website</label>
        <input id={`${fieldId}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {Object.keys(ATTRIBUTION_FIELDS).map((name) => (
        <input key={name} type="hidden" name={name} />
      ))}

      <div ref={box} className="waitlist-check" />

      {state?.status === 'refused' ? (
        <FormFault headingLevel={headingLevel} focusKey={state}>
          <p>{state.message}</p>
        </FormFault>
      ) : null}
      {checkFailed ? (
        <FormFault tone="neutral" announce="polite" headingLevel={headingLevel}>
          <p>
            The spam check could not load. A content blocker may be stopping it; allow
            challenges.cloudflare.com for this page, then reload.
          </p>
        </FormFault>
      ) : null}

      <p className="waitlist-note">
        One email to confirm your address, then news of the launch. Every message has an
        unsubscribe link. <Link href="/privacy">How your address is kept</Link>.
      </p>
    </form>
  );
}
