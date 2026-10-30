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
          A complete academic writing environment with a verifiable record of how it was written
        </h1>
        <p className="hero-lede">
          Ekdotico is a browser-based platform designed for advanced undergraduate students, graduate students, and researchers. It is a writing environment for theses, dissertations, and research articles. Every sealed export carries a reference to the signed record of how it was written.
        </p>
        <WaitlistForm />
      </div>
    </section>
  );
}
