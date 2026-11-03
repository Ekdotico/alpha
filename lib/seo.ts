import type { Metadata } from 'next';
import { SITE_META, absoluteUrl } from '@/lib/site';

// Single-page marketing site — one canonical metadata block, no per-route
// helper needed. The default export builds a Metadata object for the home page.

// The social card drawn by app/opengraph-image.tsx (and twitter-image.tsx),
// which reads its size and alt text from here, so the tags below cannot claim
// a size the image is not.
export const SOCIAL_CARD = {
  width: 1200,
  height: 630,
  alt: `${SITE_META.siteName} · ${SITE_META.tagline}`,
} as const;

export function metadataForHome(): Metadata {
  const url = absoluteUrl('/');
  // Named here as well as by the file convention: this page's own openGraph
  // and twitter objects replace the ones Next builds from the image files, and
  // without these lines the home page, the one people share, had no image tag.
  const card = { ...SOCIAL_CARD, type: 'image/png' };
  const title = `${SITE_META.siteName} · ${SITE_META.tagline}`;
  return {
    metadataBase: new URL(SITE_META.siteUrl),
    // Absolute: the root layout's template appends the site name to every
    // other route's title, and this one already begins with it.
    title: { absolute: title },
    description: SITE_META.description,
    applicationName: SITE_META.siteName,
    authors: [{ name: SITE_META.siteName }],
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: SITE_META.siteName,
      title,
      description: SITE_META.description,
      url,
      images: [{ url: absoluteUrl('/opengraph-image'), ...card }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: SITE_META.description,
      images: [{ url: absoluteUrl('/twitter-image'), ...card }],
    },
  };
}
