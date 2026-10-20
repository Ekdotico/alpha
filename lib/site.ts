// Single source of truth for site-wide metadata for the alpha waitlist site.
// Adapted from deree: no gate, so the site is public and indexable.

export const SITE_META = {
  licence: 'AGPL-3.0',
  domain: 'ekdoti.co',
  verification: 'verify.ekdoti.co',
  // The host that serves this site. It feeds `metadataBase`,
  // `alternates.canonical`, `openGraph.url` and the OG image URL.
  siteUrl: 'https://alpha.ekdoti.co',
  siteName: 'Ekdotico',
  // No trailing full stop: lib/seo.ts interpolates this into
  // `${siteName} · ${tagline}` to build the document <title>.
  tagline: 'An academic writing environment with a cryptographic provenance system',
  description:
    'Ekdotico is an academic writing environment with a cryptographic provenance system, in pre-launch development. Join the waitlist to hear when it opens.',
  // Where a reader writes about their data. Named on the privacy page and in
  // the note under each waitlist form.
  contact: 'stavros.apostolou@acg.edu',
} as const;

export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const trimmed = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_META.siteUrl}${trimmed === '/' ? '' : trimmed}`;
}
