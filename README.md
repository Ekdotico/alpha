# alpha — Ekdotico waitlist site

The public Ekdotico landing page at `https://alpha.ekdoti.co`, for readers who meet Ekdotico through the academic-integrity community. A copy of `deree` without the passcode gate or the research area: a few sections describing Ekdotico, and a waitlist form in the hero and above the footer. The page presents itself as Ekdotico, never as the International Center for Academic Integrity.

## Stack

Next.js 16 · React 19 · TypeScript 6 · Node 24 · pnpm 10 · Brevo · Cloudflare Turnstile · Upstash Redis · Vercel (`fra1`)

## Local development

```bash
pnpm install
pnpm dev
```

No configuration is needed locally: with the variables in `.env.example` blank, the form runs against Cloudflare's always-pass Turnstile test keys, the rate limits are open, and Brevo is skipped with a warning in the server log. `vercel env pull .env.local` after linking brings the real values down.

`pnpm test` runs the signup pipeline's tests; `pnpm typecheck`, `pnpm lint`, `pnpm run check` and `pnpm build` are what CI runs.

## How a signup works

`components/alpha/WaitlistForm.tsx` posts to the server action in `app/(site)/actions.ts`, which calls `joinWaitlist` in `lib/waitlist.ts`:

1. **Honeypot.** A hidden `website` field; a filled one is answered as a success and nothing is sent.
2. **Validation.** The address is trimmed, lower-cased, length-capped at 254, and parsed with `@ekdotico/amyntico/validation`.
3. **Per-client limit.** Five signups per IP (an IPv6 client by its /64) in ten minutes and ten in a day, in `lib/rate-limit.ts`. A missing token is refused before this, so it costs the reader no try.
4. **Turnstile.** The token is verified server-side with `siteverify`, including the `waitlist` action it was signed for.
5. **Send limits.** Three confirmation emails per inbox per day (keyed by a SHA-256 of the inbox, with `+tags` and Gmail dots folded, so no address is stored in Redis), and 250 a day overall, under Brevo's free 300 a day.
6. **Brevo double opt-in.** The contact is stored unconfirmed and Brevo sends the confirmation template; the address joins the list only when its owner clicks, and Brevo then redirects to `/confirmed`. A reader who ticked the optional testing box joins the "User testing" list at the same moment, and a Brevo automation on that list sends the testing email, so an unconfirmed address never receives it. The testing email is a marketing email, not a transactional one, so its unsubscribe link blocklists the address for every campaign and automation; a transactional unsubscribe would stop only transactional sends and leave the address on both lists.

The answer never reveals whether an address was already on the list. Every step fails closed in production: a missing variable, a Turnstile or Upstash timeout, or an unexpected Brevo response refuses the signup and logs why, without logging the address. The form also works without JavaScript up to the Turnstile check, which needs it.

## Data location

Brevo (France) stores the list in the EU. The Vercel functions run in Frankfurt (`vercel.json`). Upstash should be created in `eu-central-1`; it holds only fixed-window counters, keyed by IP or by a hashed inbox, for at most a day. Turnstile sees the reader's IP and browser signals. `/privacy` states all of this to the reader and must be kept in step with it.

## Deploying

Vercel project `alpha` in the team that holds `deree` and `docs`. Before the first production deploy:

1. **Brevo:** create a contact list and a Double opt-in template whose button links to `{{ doubleoptin }}`; authenticate the sending domain; create an API key (API Keys tab, `xkeysib-`, not SMTP). Add an `optin` tag to the template and activate it. Create a second list, "User testing", and an automation: contact added to that list, then a marketing "Send an email" step (not a transactional template) whose footer carries Brevo's `{{ unsubscribe }}` link. Set `BREVO_API_KEY`, `BREVO_LIST_ID`, `BREVO_DOI_TEMPLATE_ID`, `BREVO_TESTING_LIST_ID`.
2. **Turnstile:** add a widget for `alpha.ekdoti.co` only, Managed mode (local development uses the test keys). Keep the DNS record DNS-only, not proxied, or every reader is counted under Cloudflare's IPs. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
3. **Upstash:** Vercel Marketplace, Upstash Redis, region `eu-central-1`; it injects `KV_REST_API_URL` / `KV_REST_API_TOKEN`.
4. **Registry:** `NODE_AUTH_TOKEN` (a token with `read:packages`) so Vercel's install can fetch `@ekdotico/*` from GitHub Packages; and grant this repository Actions access on both packages for CI.
5. **Domain:** `alpha.ekdoti.co` is attached to the project, and its DNS points at Vercel (`vercel domains verify alpha.ekdoti.co` reports it configured). `icai.ekdoti.co`, the site's first address, stays attached as a permanent (308) redirect to `alpha.ekdoti.co`: confirmation emails sent before the move link to `icai.ekdoti.co/confirmed`, and those links must keep landing.

`vercel deploy` for a preview; `vercel deploy --prod` ships to `alpha.ekdoti.co`.

## Licence

Proprietary. All rights reserved — see `LICENSE`. AGPL-3.0 will apply to the Ekdotico provenance system and the core Ekdotico application on their release; it does not apply to this site.
