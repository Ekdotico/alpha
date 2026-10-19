import Link from 'next/link';
import { SITE_META } from '@/lib/site';

/*
 * Brand line, licence, and the privacy notice. The licence is the platform's,
 * on its release, and says so: AGPL-3.0 will cover the provenance system and
 * the core application, while this site's own code is proprietary, so a bare
 * "AGPL-3.0" in its footer read as the licence of the page being viewed.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-inner">
        <span className="site-footer-brand">
          {SITE_META.siteName} · {SITE_META.domain}
        </span>
        <span className="site-footer-licence">
          <Link href="/privacy">Privacy</Link> · Platform licence on release: {SITE_META.licence}
        </span>
      </div>
    </footer>
  );
}
