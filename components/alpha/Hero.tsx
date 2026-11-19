import { appearanceState } from '@ekdotico/domico/theme/server';
import { cookies } from 'next/headers';
import { WaitlistForm } from '@/components/alpha/WaitlistForm';
import { heroArtPreloads } from '@/lib/hero-art';

export async function Hero() {
  const preloads = heroArtPreloads(appearanceState(await cookies()));

  return (
    <section className="hero" aria-labelledby="hero-title">
      {/* React lifts these into the head. The landscape is a CSS background,
          which the browser would otherwise find only after the stylesheet. */}
      {preloads.map(({ href, media }) => (
        <link key={href} rel="preload" as="image" type="image/avif" href={href} media={media} fetchPriority="high" />
      ))}
      <div className="hero-body">
        <h1 id="hero-title" className="hero-title">
          {/* The spans carry no meaning: the clouds measure the wrapped lines from them. */}
          <span className="hero-title-text">A writing environment for theses, dissertations, and research articles</span>
        </h1>
        {/* The writing environment the title names, then the provenance record
            that brings this audience here, with its limit in the next sentence:
            a record claim never stands without it. Istorico is named in its own
            section below. The release status is AlphaNotice, in the site layout. */}
        <p className="hero-lede">
          <span className="hero-lede-text">Plan, research, write, and cite in one place, with a record of how each document was written there. The record covers work inside Ekdotico only, and it does not establish who wrote the document.</span>
        </p>
        <WaitlistForm />
      </div>
      {/* Decoration only: a background on an empty element, so a screen reader
          meets nothing here. It lies along the hero's lower edge; the
          padding in globals.css keeps the text off its painted parts. */}
      <div className="hero-cloud hero-cloud--left" aria-hidden="true" />
      <div className="hero-cloud hero-cloud--right" aria-hidden="true" />
      <div className="hero-art" aria-hidden="true" />
    </section>
  );
}
