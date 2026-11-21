import { AppearanceMenu } from '@ekdotico/domico/theme';

import { HeaderLogo } from '@/components/alpha/HeaderLogo';

/*
 * Sticky site header. Three pieces: the lockup (HeaderLogo, which on the
 * homepage starts large in the hero and travels in as the page scrolls), the
 * status badge, and the appearance control at the far right.
 *
 * The appearance control is one trigger disclosing the whole optionset, in the
 * top-right corner, which is where docs and praktico put theirs. What a reader
 * carries between the three surfaces is the gesture — the same corner, the same
 * button, the same panel — so this site states only where the wrapper sits in
 * the row.
 *
 * AppearanceMenu is a client component; importing it here does not make this
 * header one. It also positions its own panel, off the .appearance-menu wrapper.
 */

export function SiteHeader() {
  return (
    <header className="site-header" role="banner">
      <div className="site-header-inner">
        <HeaderLogo />
        <span className="site-header-badge">Closed alpha</span>
        <AppearanceMenu className="site-header-appearance" />
      </div>
    </header>
  );
}
