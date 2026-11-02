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
        {/* The lede stays on the writing environment the title names. Istorico
            opens its own section, where its record claim keeps its limit beside
            it. The release status is AlphaNotice, in the site layout. */}
        <p className="hero-lede">
          Plan, research, write, and cite in one place, from the first outline to the final bibliography.
        </p>
        <WaitlistForm />
      </div>
    </section>
  );
}
