import { WaitlistForm } from '@/components/alpha/WaitlistForm';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      {/* The room the large lockup stands in. The lockup itself is the header's
          (HeaderLogo), which carries it from here into the bar as the page
          scrolls; this is only the gap it leaves, and hidden from a screen reader. */}
      <div id="hero-lockup-slot" className="hero-lockup-slot" aria-hidden="true" />
      <div className="hero-body">
        <h1 id="hero-title" className="hero-title">
          A writing environment for theses, dissertations, and research articles
        </h1>
        {/* The writing environment the title names, then the provenance record
            that brings this audience here, with its limit in the next sentence:
            a record claim never stands without it. Istorico is named in its own
            section below. The release status is AlphaNotice, in the site layout. */}
        <p className="hero-lede">
          Plan, research, write, and cite in one place, with a record of how each document was written there. The record covers work inside Ekdotico only, and it does not establish who wrote the document.
        </p>
        <WaitlistForm />
      </div>
    </section>
  );
}
