import Link from 'next/link';
import { SITE_META } from '@/lib/site';

/*
 * Brand line and the privacy notice. The platform's licence is held off the
 * page until its repositories are public; the approved wording for then is
 * "The source code is public under AGPL-3.0, an open-source licence."
 */
export function SiteFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-inner">
        <span className="site-footer-brand">
          {SITE_META.siteName} · {SITE_META.domain}
        </span>
        <span className="site-footer-licence">
          <Link href="/privacy">Privacy</Link>
        </span>
      </div>
    </footer>
  );
}
