# Security policy

`icai` is the public Ekdotico waitlist site at `icai.ekdoti.co`, deployed on
Vercel. The repository is private. The site holds no accounts and no database
of its own: waitlist addresses go to Brevo through double opt-in, and the only
other state is short-lived rate-limit counters in Upstash.

## Reporting a vulnerability

Email `stavros.apostolou@acg.edu` with `[security] icai` in the subject line.

Do not open an issue. An issue is visible to every collaborator and remains in
the timeline after the fix. Include the route, the request, the response
received, and the response expected. Do not put a live value of
`BREVO_API_KEY`, `TURNSTILE_SECRET_KEY`, or an Upstash token in the message —
name the variable instead.

## In scope

- Adding an address to the list without its owner opening the confirmation link.
- Using the form to send confirmation emails to an inbox, or in total, past the
  limits in `lib/rate-limit.ts` (five signups per client per ten minutes and ten per day, three
  emails per inbox per day, 250 per day overall), including by spoofing the
  client address or rotating through an IPv6 /64.
- Submitting without a Turnstile token that `siteverify` accepted for the
  `waitlist` action, or replaying one.
- Learning from the form's answers whether an address is already on the list.
- Reading the list, or any address, from the site, its logs, or its responses.
- Invoking the server action cross-site.
- A secret committed to the repository, present in the client bundle, or
  visible in build output.
- Response headers and the content security policy on the deployed site.
- A dependency vulnerability reachable from this application's code.

## Out of scope

- The limits and Turnstile degrading open locally when their variables are
  absent. The same behaviour in production is in scope.
- Brevo's, Cloudflare's, Vercel's, or Upstash's own platforms.
- Scanner output with no demonstrated impact on this deployment.
- Copy, accessibility, and design defects. Those are ordinary issues.

## What happens next

An acknowledgement within five working days and an assessment within ten. There
is no bounty programme.

## Supported version

The deployment at `icai.ekdoti.co`. `main` is the deployed branch and fixes ship
forward.
