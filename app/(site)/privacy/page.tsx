import type { Metadata } from 'next';
import { SiteFooter } from '@/components/alpha/SiteFooter';
import { SITE_META } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How the Ekdotico waitlist keeps your email address.',
  alternates: { canonical: '/privacy' },
};

// The notice GDPR Article 13 asks for at the point of collection: who holds
// the address, why, on what basis, with whom, for how long, and what the reader
// can ask for. Linked from the note under each waitlist form.
export default function PrivacyPage() {
  return (
    <>
      <main id="main-content" tabIndex={-1}>
        <section className="section" aria-labelledby="privacy-title">
          <h1 id="privacy-title" className="section-heading">How your address is kept</h1>
          <div className="section-body">
            <p>
              The waitlist on this site collects the email address you enter, and whether you
              ticked the box about user testing. The address is used to tell you when Ekdotico
              opens. It is not sold, shared for advertising, or added to any list you did not
              choose.
            </p>
            <p>
              <em>User testing.</em> The box is optional and unticked unless you tick it. If you
              do, your address also joins a separate testing list once you confirm it, and you
              receive one email about what taking part involves. Ticking it does not sign you up
              for a session: nothing is arranged without your agreement, and any session comes
              with its own information about how what you share is handled. You can leave the
              testing list without leaving the waitlist by writing to the address below.
            </p>
            <p>
              <em>Who holds it.</em> The Ekdotico team, reachable at{' '}
              <a href={`mailto:${SITE_META.contact}`}>{SITE_META.contact}</a>.
            </p>
            <p>
              <em>Why we may hold it.</em> Your consent, given twice: when you send the form, and
              when you open the confirmation link. An address that is never confirmed is not added
              to the list.
            </p>
            <p>
              <em>Where it is stored.</em> With Brevo, an email service based in France that keeps
              its data in the European Union. Brevo also records when and from which network
              address you confirmed, as evidence of your consent.
            </p>
            <p>
              <em>What else sees the form.</em> Cloudflare Turnstile checks that a person sent it,
              from signals in your browser and your network address; it does not set an
              advertising cookie. The site runs on Vercel, in its Frankfurt region. To stop the
              form being misused, counters keyed by your network address and by a one-way hash of
              your email address are kept for at most a day, on Upstash in the European Union.
            </p>
            <p>
              <em>How long.</em> Until you unsubscribe, or until the waitlist closes after launch,
              whichever comes first; the testing list closes when testing ends, or with the
              waitlist. Every email after the confirmation request carries an unsubscribe link,
              which stops all email from Ekdotico at once, from the waitlist and the testing list
              alike. Brevo then keeps your address only as a record not to write to it again; to
              have that record deleted too, write to the address above.
            </p>
            <p>
              <em>What you can ask for.</em> A copy of what is held about you, its correction, or
              its deletion, by writing to the address above. You may also complain to a data
              protection authority; in Greece, that is the Hellenic Data Protection Authority.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
