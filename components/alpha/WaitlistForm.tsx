'use client';

import Link from 'next/link';
import { type FormEvent, useActionState, useEffect, useId, useRef, useState } from 'react';
import { Button, Checkbox, FormFault, TextField, Tooltip } from '@ekdotico/domico/components';
import { InfoIcon } from '@ekdotico/domico/icons';
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

// The approved note on what the list sends, word for word. The closing
// section's form prints it; the hero's form puts it behind the info mark.
const WHAT_IS_SENT =
  'One email confirms your address; after that, only news of the opening. If you also tick the user-testing box, one further email explains what testing involves. Every message has an unsubscribe link.';

// The approved hint under the testing box, word for word; behind its own info
// mark in the hero's form.
const TESTING_HINT =
  'Optional. Once you confirm your address, we send one email about what testing involves. Nothing is arranged without your agreement.';

export function WaitlistForm({ headingLevel = 2, compact = false }: { headingLevel?: 2 | 3; compact?: boolean }) {
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

  return <WaitlistFields state={state} formAction={formAction} headingLevel={headingLevel} compact={compact} />;
}

// The form itself, a component of its own so that the success message above
// unmounts it, and the effect's cleanup removes its Turnstile widget.
function WaitlistFields({
  state,
  formAction,
  headingLevel,
  compact,
}: {
  state: WaitlistState | null;
  formAction: (form: FormData) => void;
  headingLevel: 2 | 3;
  compact: boolean;
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
          appearance: 'interaction-only',
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
        <div className="waitlist-address">
        {/* The hero's form is the short one, so that the hero is one screen:
            what is sent is said behind the info mark on the label's line, and
            in full on the page in the closing section's form. The mark is an
            array, not an element, so that Tooltip renders its own trigger: a
            button a press opens, which is what a touch has for a hover. */}
        {compact ? (
          <Tooltip className="waitlist-info" content={WHAT_IS_SENT}>
            {[<InfoIcon key="mark" title="What we send" />]}
          </Tooltip>
        ) : null}
        <TextField
          id={fieldId}
          label={compact ? <>Email address<span className="waitlist-mark waitlist-mark--address" /></> : 'Email address'}
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
        </div>
        <Button type="submit" variant="primary" pendingLabel="Adding you…">
          Join the waitlist
        </Button>
      </div>

      {/* Unticked by default: taking part in testing is a separate consent from
          joining the list, and GDPR does not count a pre-ticked box as one. */}
      <div className="waitlist-testing">
        {compact ? (
          <Tooltip className="waitlist-info waitlist-info--testing" content={TESTING_HINT}>
            {[<InfoIcon key="mark" title="What testing involves" />]}
          </Tooltip>
        ) : null}
        <Checkbox
          name="testing"
          value="yes"
          label={
            <>
              I would also like to hear about taking part in user testing
              {compact ? <span className="waitlist-mark waitlist-mark--testing" /> : null}
            </>
          }
          hint={compact ? undefined : TESTING_HINT}
          defaultChecked={state?.testing ?? false}
        />
      </div>

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

      {/* The link stays on the page in both forms: a tooltip holds text only,
          because a link inside one cannot be reached with a keyboard. */}
      <p className="waitlist-note">
        {compact ? null : `${WHAT_IS_SENT} `}
        <Link href="/privacy">How your address is kept</Link>.
      </p>
    </form>
  );
}
