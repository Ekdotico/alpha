# Ekdotico alpha site — Agent Rules

This file is loaded into every Claude Code session for the alpha repo, the public Ekdotico waitlist site. It is a copy of `deree` without the passcode gate or the research area. Read it once, follow it always.

---

## The hard rules — UI / page work

### Rule 1 — Components first

Before writing any UI, check `components/alpha/` for the landing-page sections. Use an existing section or extend it. Do not create one-off components inside `app/(site)/page.tsx`.

And check `@ekdotico/domico` before either. The waitlist form is the package's `TextField`, `Button` and `FormFault`, arranged by this site's `.waitlist-*` classes; `pnpm check:discipline` names a local copy of a package export as `dupes` and fails on it.

### Rule 2 — Tokens-only for design properties

Colour, type, spacing, radius, shadow, and motion values must reference the design tokens from `@ekdotico/domico/tokens.css`. Do not write hex literals, raw px font-sizes, or one-off CSS-in-JS. `app/globals.css` defines no tokens of its own beyond the chrome-geometry values in its `:root` block, and those are composed from the spacing scale.

**Reference the token, never the value.** `var(--fs-md)`, never `var(--fs-md, 1rem)`. A fallback that restates a token is a second source of truth with nothing keeping it honest.

### Rule 3 — Stop and recommend, do not improvise

If a request cannot be fulfilled with existing components or tokens:

1. **Stop.** Do not write the change.
2. **Identify** the closest existing primitive in `components/alpha/` or `@ekdotico/domico`.
3. **Recommend exactly one** of three mitigations, with rationale: **extend** an existing component (preferred), **reimplement** the section using a different documented pattern, or **add** a new component or token to the system, with a one-paragraph proposal.
4. **Wait for human approval** before proceeding.

### Rule 4 — The page is Ekdotico's, not ICAI's

The site began as `icai`, named for an audience that meets Ekdotico through the International Center for Academic Integrity, and moved to `alpha.ekdoti.co`; `icai.ekdoti.co` redirects there. That audience is still a large part of its readership. The page never presents itself as the International Center for Academic Integrity, uses its name or marks, or implies an endorsement it has not given.

---

## Process

- **Branch hygiene.** Non-trivial work goes on a feature branch (`feat/...`, `fix/...`, `chore/...`).
- **Verify before claiming done.** `pnpm typecheck`, `pnpm test` and `pnpm build` after any TS change, and `pnpm run check` after any copy or UI change — every guard `@ekdotico/domico` ships for a consumer, then the copy linter over `.ekdotico-lint.json`. It is what CI runs. Visual review with `pnpm dev` after any UI change.
- **Commit message convention.** Conventional commits: `feat(scope): …`, `fix(scope): …`, `chore(scope): …`. Co-author trailer for AI-assisted commits.
- **Do not auto-commit.** When the user is reviewing-as-they-go, leave changes uncommitted unless explicitly told otherwise.
- **Lockfile.** Regenerate with `--config.auto-install-peers=false` on the command line: without `NODE_AUTH_TOKEN` set, pnpm discards the project `.npmrc` whole, setting included. Check the lockfile header still reads `autoInstallPeers: false`.

## Enforcement

- **PostToolUse hook** at `.claude/hooks/expression-check.sh`, wired in `.claude/settings.json`, runs `ekdotico-lint` on every file written. It ships in `@ekdotico/domico`, is copied in by `postinstall`, and is gitignored; do not edit it. `pnpm hooks:check` asserts the installed copy matches the package.

## The waitlist

The flow, its limits and where each piece of data lives are in `README.md` under "How a signup works" and "Data location". Two rules hold across any change to it:

- **No answer reveals membership.** A new address, an address already on the list, and an address past its own send limit all get the same "check your inbox".
- **Fail closed in production.** A missing variable or an upstream that does not answer refuses the signup and logs why. Never log the address.

`/privacy` describes every processor and retention period to the reader. A change to the flow that changes either is a change to that page too.

## Licence

This repository is proprietary: `LICENSE` reserves all rights and `package.json` declares `"license": "UNLICENSED"`. AGPL-3.0 applies only to the Ekdotico provenance system and the core Ekdotico application, on their release. The footer's "Platform licence on release: AGPL-3.0" names the platform's licence, not this site's.

## File map

| Path | Purpose |
|---|---|
| `app/globals.css` | `@import`s the package's base + component layers, then this site's own layer: chrome geometry, the marketing sections, and the waitlist form's arrangement. Defines no tokens |
| `app/layout.tsx` | Root layout: fonts, appearance cookie, `tokens.css`, `globals.css`. No chrome |
| `app/(site)/layout.tsx` | Marketing chrome: `SkipLink` and `OpeningSequence` from `@ekdotico/domico`, then `SiteHeader` |
| `app/(site)/page.tsx` | `/` — composes the sections in order, and owns the home-page metadata |
| `app/(site)/actions.ts` | The waitlist server action |
| `app/(site)/privacy/page.tsx` · `app/(site)/confirmed/page.tsx` | The privacy notice; the page Brevo redirects to after confirmation |
| `components/alpha/*` | Section components, one file per section, and `WaitlistForm` |
| `lib/waitlist.ts` | The signup pipeline: honeypot, validation, limits, Turnstile, Brevo double opt-in |
| `lib/rate-limit.ts` | Upstash sliding-window limits: per client, per inbox (hashed), per day |
| `lib/turnstile.ts` | Turnstile origin, script, action name, and site key |
| `proxy.ts` | The per-request Content Security Policy from `@ekdotico/amyntico/headers`, with Turnstile's frame origin |
| `lib/seo.ts` · `lib/site.ts` | Home-page SEO + `SITE_META` |
| `vercel.json` | Pins the functions to `fra1` |

## Design philosophy

The brand is **scholarly, measured, calm** — closer to a university press or well-bound journal than a SaaS dashboard. Read `.impeccable.md` for the design context.

1. **Match the book, not the dashboard.**
2. **Restraint signals rigor.** Hairlines and warmth over gradients and glow.
3. **Reading is the job.** Hierarchy through type and rhythm, not boxes.
