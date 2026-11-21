'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Logo } from '@/components/Logo';

/*
 * The page's one lockup, linked to the top of the page. On the homepage it
 * stands large over the hero's slot and travels into the bar as the reader
 * scrolls (the rules are in globals.css, "The header lockup, one object"); on
 * every other page it is simply in the bar.
 *
 * Where the browser has scroll-driven animations, data-travel hands the travel
 * to the stylesheet and nothing here runs after the first paint. Elsewhere an
 * IntersectionObserver on the hero's slot sets data-hero while the slot is on
 * screen, and the stylesheet joins the two states with a transition (or, under
 * reduced motion, with none). The default is docked, so a page that never
 * hydrates shows a bar-sized lockup in the bar, not a large one over the text.
 *
 * Exactly one lockup is exposed to a screen reader: this link carries the name
 * outright, and the copy that holds the bar's width is aria-hidden.
 *
 * A client component for usePathname and the observer: the (site) layout
 * renders the header once for every page and is never told which one it wraps.
 */
export function HeaderLogo() {
  const home = usePathname() === '/';
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    if (!home) return;
    const slot = document.getElementById('hero-lockup-slot');
    if (!slot) return;
    // The slot counts as on screen until it has scrolled up under the bar, so
    // the observer's top edge is the bar's own measured bottom.
    const bar = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0;
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), {
      rootMargin: `-${bar}px 0px 0px 0px`,
    });
    observer.observe(slot);
    return () => observer.disconnect();
  }, [home]);

  return (
    <>
      <span className="site-header-logo-slot" aria-hidden="true">
        <Logo />
      </span>
      <Link
        href="/"
        className="site-header-home"
        aria-label="Ekdotico home page"
        data-travel={home ? '' : undefined}
        data-hero={home && heroVisible ? '' : undefined}
      >
        <Logo />
      </Link>
    </>
  );
}
