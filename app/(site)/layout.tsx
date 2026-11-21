import { AlphaNotice } from '@/components/alpha/AlphaNotice';
import { AnalyticsPageView } from '@/components/alpha/AnalyticsPageView';
import { InPageLinks } from '@/components/alpha/InPageLinks';
import { SiteHeader } from '@/components/alpha/SiteHeader';
import { OpeningSequence, SkipLink } from '@ekdotico/domico/components';

// Marketing-site chrome lives here, not in the root layout. The skip link
// targets #main-content, which every page in this group renders. OpeningSequence
// plays once per session under the key every Ekdotico surface shares, and never
// for a reader who asks for reduced motion. InPageLinks turns the arrow on an
// in-page link up or down, towards its target. AlphaNotice is the release
// status, until the reader acknowledges it.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SkipLink />
      <AlphaNotice />
      <AnalyticsPageView />
      <OpeningSequence />
      <InPageLinks />
      <SiteHeader />
      {children}
    </>
  );
}
