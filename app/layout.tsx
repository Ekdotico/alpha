/*
 * Two imports, not three. tokens.css belongs here: it declares custom
 * properties and no rules that could tie on specificity, so where it lands in
 * the cascade cannot change what paints.
 *
 * The package's base and component layers used to sit here too, and moved to an
 * @import at the top of globals.css — the position that guarantees they precede
 * this site's own rules whatever the bundler decides to do with the chunks. The
 * reasoning, and the measurement behind it, is written out there.
 *
 * The seam that used to sit here is settled. .logo, .logo-mark and .logo-wordmark
 * were duplicated in globals.css with identical declarations — one of them a px
 * literal where the package uses --fs-md — and have been deleted, so the package
 * is now the only definition. (.badge never collided; the earlier report matched
 * the word inside a comment.)
 */
import '@ekdotico/domico/tokens.css';
import './globals.css';
import { AppearanceProvider, DEFAULT_THEME } from '@ekdotico/domico/theme';
import {
  appearanceAttributes,
  appearanceState,
} from '@ekdotico/domico/theme/server';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Crimson_Pro, Commissioner, Fira_Code } from 'next/font/google';
import { SITE_META } from '@/lib/site';

// Self-hosted, optimised fonts (no render-blocking Google Fonts @import, no
// third-party request). These expose CSS variables that the --font-serif /
// --font-sans / --font-mono tokens in globals.css consume, so no component
// CSS changes. Serif loads italic to match the editorial typography;
// sans/mono load upright only (italics are serif).
const serif = Crimson_Pro({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-crimson-pro',
});
const sans = Commissioner({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-commissioner',
});
const mono = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fira-code',
});

// Appearance: the same system as docs and praktico, restored the same way from
// the same cookie — `ekd-theme` and `ekd-mode` at Path=/, read here by
// appearanceAttributes() and written onto the document element.
//
// This site used to pin Parchment Light, on the reasoning that marketing is
// branding rather than a reading accommodation. The cookie is shared across
// every Ekdotico surface by design, and pinning meant a reader who had chosen
// Sepia in docs met Parchment here — which is precisely the drift the shared
// key exists to prevent. Consistency for the reader wins over consistency of
// presentation.
//
// The choice can also be made here, from the AppearanceMenu in the top right of
// SiteHeader — one trigger disclosing the mode pill and the four themes, the
// same control in the same corner as docs and praktico. Someone arriving with no
// cookie gets Parchment, which is what the pin gave them, so nothing changes for
// a first-time visitor.
//
// Auto remains a CSS decision. An absent `data-mode` is what lets the
// prefers-color-scheme block in globals.css apply, so the server writes
// nothing for it rather than guessing at a preference it cannot see.

// Root metadata: a metadataBase for resolving relative URLs. The site is
// public, so it is indexable by default; per-route pages, the home page among
// them, export their own title/description/canonical on top of this.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_META.siteUrl),
  // Every route's title carries the site name (WCAG 2.4.2): "Privacy" alone
  // does not say whose. The home page sets its own title as absolute, since it
  // already begins with the name.
  title: { default: SITE_META.siteName, template: `%s · ${SITE_META.siteName}` },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();

  return (
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      {...appearanceAttributes(store)}
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        {/*
          The same cookie as attributes, for the document, and as values, for
          the components. The AppearanceMenu in SiteHeader reads it through this
          provider, which is what has the panel open onto the reader's own theme
          — checked swatch, and the roving tab stop parked on it — before any
          JavaScript runs. Without it the panel would report Parchment on a
          Sepia page until hydration.
        */}
        <AppearanceProvider value={appearanceState(store)}>{children}</AppearanceProvider>
      </body>
    </html>
  );
}
