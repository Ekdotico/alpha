import { Callout } from '@ekdotico/domico/components';
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
        <p className="hero-lede">
          Istorico, the provenance system, records how a document was written inside Ekdotico. It does not establish who wrote the document, and it does not record activity outside Ekdotico.
        </p>
        {/* The release status, in the same view as the claims above it and
            before the first form. Body size, not a footnote. */}
        <Callout type="info" label="Status">
          Ekdotico is in alpha development. The first version is being built and is not yet open for use. November 2026.
        </Callout>
        <WaitlistForm />
      </div>
    </section>
  );
}
