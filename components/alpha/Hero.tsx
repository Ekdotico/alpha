import { LogoMark } from '@/components/Logo';
import { WaitlistForm } from '@/components/alpha/WaitlistForm';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-body">
        {/* Decorative: the h1 beneath it says what the product is, and a named
            mark read "Ekdotico mark, image" before every visit's first line. */}
        <LogoMark size={80} variant="solid" className="hero-logo" title="" />
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
