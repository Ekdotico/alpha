import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/alpha/SiteFooter';

export const metadata: Metadata = {
  title: 'Address confirmed',
  robots: { index: false, follow: false },
};

// Where Brevo sends a reader after they open the confirmation link
// (redirectionUrl in lib/waitlist.ts). Brevo has already recorded the
// confirmation by then; this page only says so.
export default function ConfirmedPage() {
  return (
    <>
      <main id="main-content" tabIndex={-1}>
        <section className="section" aria-labelledby="confirmed-title">
          <h1 id="confirmed-title" className="section-heading">Your address is confirmed</h1>
          <div className="section-body">
            <p>
              You are on the waitlist for news of Ekdotico&rsquo;s launch.
            </p>
            <p>
              <Link href="/">Back to the Ekdotico page</Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
