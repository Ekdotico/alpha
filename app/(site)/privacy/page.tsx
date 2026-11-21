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
//
// It says what a reader needs and no more. Service providers are named by
// category, which Article 13(1)(e) allows, and the names are given on request;
// how the form is protected is not described. Each promise here is one the
// project can keep without effort, or one the GDPR makes anyway.
//
// Change UPDATED with any change of substance.
const UPDATED = '21 November 2026';

export default function PrivacyPage() {
  return (
    <>
      <main id="main-content" tabIndex={-1}>
        <section className="section" aria-labelledby="privacy-title">
          <h1 id="privacy-title" className="section-heading">How your address is kept</h1>
          <div className="section-body">
            <p>
              <em>Last updated {UPDATED}.</em>
            </p>
            <p>
              <em>What is collected.</em> When you join the waitlist: the email address you enter,
              whether you ticked the box about user testing, and the link that brought you to the
              form. As with any website, your network address and browser details also reach the
              site when you visit, and the form&rsquo;s spam check uses them.
            </p>
            <p>
              <em>Why.</em> To tell you when Ekdotico opens; to send the one email about user
              testing, if you asked for it; to keep the form free of spam and misuse; and to learn
              which of our posts bring people to the waitlist. Your address is not sold or shared
              for advertising.
            </p>
            <p>
              <em>User testing.</em> The box is optional. If you tick it, your address also joins
              a separate testing list once you confirm it, and you receive one email about what
              taking part involves. Ticking it does not sign you up for a session; any session
              comes with its own information about how what you share is handled. You can leave
              the testing list without leaving the waitlist by writing to the address below.
            </p>
            <p>
              <em>Where you signed up from.</em> When you send the form, the link that brought you
              to this page is recorded with your address: the labels in its address that name the
              post or campaign you followed, and the name of the site you came from, such as
              www.linkedin.com, without the page you were on. It is kept only once you confirm
              your address, and nothing is stored in your browser for it.
            </p>
            <p>
              <em>Counting visits.</em> To learn how many people read this site and whether the
              form works, each page you open sends one short message to a measurement service. It
              says which page was opened (the home page, this page, the confirmation page, or
              another) and carries what your browser sends with any request, such as its name and
              version. When you send the form, a second message says whether it worked or failed,
              and never the address you entered. Nothing is stored in your browser for this. The
              messages of one visit share a random number that lasts only while the page is open,
              so there is no identifier that lasts beyond the page, and nothing links one visit to
              the next. The service does not receive your network address; it sees only that of
              the provider that hosts this site, and works out no location.
            </p>
            <p>
              <em>Who holds it.</em> The Ekdotico team, reachable at{' '}
              <a href={`mailto:${SITE_META.contact}`}>{SITE_META.contact}</a>.
            </p>
            <p>
              <em>Why we may hold it.</em> For the waitlist and the testing email, your consent,
              given when you send the form and again when you open the confirmation link. You can
              withdraw it at any time through the unsubscribe link in any of our emails. For the
              spam check and for recording where you signed up from, our legitimate interest in
              keeping the form working and in knowing which posts reach people. For counting
              visits, our legitimate interest in knowing whether the site and its form work. You
              can object to any of these by writing to us.
            </p>
            <p>
              <em>Who else handles it.</em> Service providers who process it for us and on our
              instructions: an email service in the European Union, which stores the waitlist,
              sends its emails, and records when and from which network address you confirmed, as
              evidence of your consent; the provider that hosts this site; a measurement service
              in the European Union, which receives the messages described under
              &quot;Counting visits&quot; through this site&apos;s own address; and a spam-check
              service, which looks at your browser and network address to tell a person from a
              program. Where any of them may process data outside the European Union, safeguards
              recognised by the GDPR, such as standard contractual clauses, apply. You can ask us
              which providers we use.
            </p>
            <p>
              <em>How long.</em> Your address is kept until you unsubscribe or ask us to delete
              it, and no longer than the waitlist is needed for news of the opening; the testing list
              closes when testing ends, or with the waitlist. Records used to stop the form or the
              counting being misused are short-lived and deleted automatically. The counts of visits are kept for
              one year and then deleted.
            </p>
            <p>
              <em>Cookies.</em> This site sets no advertising or analytics cookies. Your browser
              keeps a few settings for it, such as the appearance you choose.
            </p>
            <p>
              <em>Your rights.</em> You can ask for a copy of what is held about you, its
              correction or deletion, a limit on how it is used, or a copy in a form you can take
              elsewhere, by writing to the address above. We may ask you to confirm that the
              address is yours first. You may also complain to a data protection authority; in
              Greece, that is the Hellenic Data Protection Authority.
            </p>
            <p>
              <em>Who the waitlist is for.</em> People aged 18 or over.
            </p>
            <p>
              <em>Changes.</em> This notice may change; the date at the top shows the latest
              version. A change to what you agreed to will be sent to you by email before it
              applies.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
