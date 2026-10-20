import { SiteHeader } from '@/components/alpha/SiteHeader';
import { OpeningSequence, SkipLink } from '@ekdotico/domico/components';

// Marketing-site chrome lives here, not in the root layout. The skip link
// targets #main-content, which every page in this group renders. OpeningSequence
// plays once per session under the key every Ekdotico surface shares, and never
// for a reader who asks for reduced motion.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SkipLink />
      <OpeningSequence />
      <SiteHeader />
      {children}
    </>
  );
}
