import { WaitlistForm } from '@/components/alpha/WaitlistForm';

// The closing call to action, above the footer: the same form as the hero, for
// the reader who has read the page through before deciding.
export function WaitlistSection() {
  return (
    <section className="section" aria-labelledby="waitlist-title">
      <p className="section-eyebrow">Waitlist</p>
      <h2 id="waitlist-title" className="section-heading">Hear when Ekdotico opens</h2>
      <div className="section-body">
        <p>
          Leave an email address and you will hear from us when Ekdotico opens. The first
          message asks you to confirm the address; after that, only news of the launch.
        </p>
      </div>
      <WaitlistForm headingLevel={3} />
    </section>
  );
}
