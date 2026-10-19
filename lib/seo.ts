import type { Metadata } from 'next';
import { SITE_META, absoluteUrl } from '@/lib/site';

// Single-page marketing site — one canonical metadata block, no per-route
// helper needed. The default export builds a Metadata object for the home page.

export function metadataForHome(): Metadata {
  const url = absoluteUrl('/');
  const ogImage = absoluteUrl('/og.png');
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
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: SITE_META.description,
      images: [ogImage],
    },
  };
}
