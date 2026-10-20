'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Logo } from '@/components/Logo';

/*
 * The header lockup, linked home on every page but the homepage. On the
 * homepage a link would only point at the page the reader is already on, so
 * the lockup stays plain there.
 *
 * A client component for usePathname alone: the (site) layout renders the
 * header once for every page and is never told which page it is wrapping.
 *
 * The link is named outright rather than left to the lockup's visually hidden
 * "Ekdotico": the name then says where it goes, and does not depend on how a
 * given reader computes a name from clipped text.
 */
export function HeaderLogo() {
  if (usePathname() === '/') return <Logo />;
  return (
    <Link href="/" className="site-header-home" aria-label="Ekdotico home page">
      <Logo />
    </Link>
  );
}
