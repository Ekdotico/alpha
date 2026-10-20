import { Hero } from '@/components/alpha/Hero';
import { PlatformSection } from '@/components/alpha/PlatformSection';
import { ProvenanceSection } from '@/components/alpha/ProvenanceSection';
import { VerificationSection } from '@/components/alpha/VerificationSection';
import { TeamSection } from '@/components/alpha/TeamSection';
import { WaitlistSection } from '@/components/alpha/WaitlistSection';
import { SiteFooter } from '@/components/alpha/SiteFooter';
import { metadataForHome } from '@/lib/seo';

export const metadata = metadataForHome();

export default function HomePage() {
  return (
    /*
     * tabIndex={-1} on <main> is what moves focus rather than only the scroll
     * position. A fragment target that cannot hold focus does not reliably move
     * the sequential-focus starting point — WebKit most notably leaves focus on
     * the link — so the next Tab walks back into the header the reader had
     * skipped.
     *
     * SiteFooter sits outside <main>, not inside it: a <footer> nested in
     * <main> maps to no landmark at all.
     */
    <>
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <PlatformSection />
        <ProvenanceSection />
        <VerificationSection />
        <TeamSection />
        <WaitlistSection />
      </main>
      <SiteFooter />
    </>
  );
}
