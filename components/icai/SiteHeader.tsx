import { AppearanceMenu } from '@ekdotico/domico/theme';

import { Logo } from '@/components/Logo';
import { SITE_META } from '@/lib/site';

/*
 * Sticky site header. Four pieces: wordmark (Logo), domain label, status badge,
 * and the appearance control at the far right.
 *
 * The appearance control is one trigger disclosing the whole optionset, in the
 * top-right corner, which is where docs and praktico put theirs. It used to sit
 * in the footer here, laid out flat, on the reasoning that a marketing page with
 * no sidebar has its footer where the other two surfaces have their sidebar
 * foot. That reasoning treated position as the thing to match. What a reader
 * actually carries between the three surfaces is the gesture — the same corner,
 * the same button, the same panel — and a control laid out flat in a footer
 * shares none of it.
 *
 * AppearanceMenu is a client component; importing it here does not make this
 * header one. It also positions its own panel, off the .appearance-menu wrapper,
 * so the only thing this site states is where the wrapper sits in the row.
 */

export function SiteHeader() {
  return (
    <header className="site-header" role="banner">
      <div className="site-header-inner">
        <Logo />
        {/* From SITE_META, not a literal. lib/site.ts calls `domain` "the brand
            string the header and footer print" — the footer reads it and the
            header did not, so one of the two would have kept printing the old
            value the day it changes. */}
        <span className="site-header-domain">{SITE_META.domain}</span>
        <span className="site-header-badge">Pre-launch</span>
        <AppearanceMenu className="site-header-appearance" />
      </div>
    </header>
  );
}
