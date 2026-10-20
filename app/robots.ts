import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

// Public site: everything may be crawled. /confirmed is the landing page of the
// confirmation link and says nothing a search result should show.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/confirmed'] },
    host: absoluteUrl('/'),
  };
}
