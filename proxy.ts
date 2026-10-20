import { NextRequest, NextResponse } from 'next/server';
import { contentSecurityPolicy, nonce } from '@ekdotico/amyntico/headers';
import { TURNSTILE_ORIGIN } from '@/lib/turnstile';

// One responsibility: the Content Security Policy. deree's passcode gate is not
// here, because this site is public.
//
// One nonce per request from the shared headers module, and the shared policy
// built around it. The policy goes on the forwarded request so the framework
// nonces its own bootstrap, and on the response so the browser enforces it. The
// nonce travels as x-nonce for parity with deree; nothing reads it.
//
// The Turnstile script needs no nonce of its own. The waitlist form appends it
// from a bundle the framework already nonced, and 'strict-dynamic' extends that
// trust to scripts a trusted script inserts. That is why the package has no
// script origin list, and why none is passed.
//
// The one source passed is Turnstile's origin as a frame: the widget renders
// its challenge in an iframe from challenges.cloudflare.com. Nothing else is
// third-party: fonts are self-hosted through next/font, images are local, and
// the waitlist reaches Brevo from the server, never from the browser.

export const config = {
  // Exact file names, each anchored with `$`, so an excluded path cannot be
  // widened to whatever a request spells after it.
  matcher: ['/((?!_next/|favicon\\.ico$|apple-icon\\.png$|icon\\.svg$|robots\\.txt$|og\\.png$).*)'],
};

const CSP_HEADER_NAME = 'Content-Security-Policy';

export function proxy(req: NextRequest) {
  const requestNonce = nonce();
  const policy = contentSecurityPolicy(requestNonce, { frame: [TURNSTILE_ORIGIN] });

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', requestNonce);
  requestHeaders.set(CSP_HEADER_NAME, policy);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set(CSP_HEADER_NAME, policy);
  return res;
}
