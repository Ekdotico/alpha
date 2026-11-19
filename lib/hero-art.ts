import type { AppearanceState, RenderedMode } from '@ekdotico/domico/theme';

// The hero illustration: one transparent picture for the light mode and one
// for the dark, the same in every theme, drawn straight on the page colour.
// The files are in public/hero/ and are painted by the rules in
// app/globals.css, under the same [data-mode] selectors as the tokens, so the
// picture changes with the page.
//
// This module holds only what the server needs to preload the right file. A
// CSS background is found late, after the stylesheet, and the illustration is
// the largest paint on the first screen.

export const RENDERED_MODES: readonly RenderedMode[] = ['light', 'dark'];

// The viewport at which globals.css swaps the 1288-wide file for the 2576-wide
// one: wider than the small file, or a dense screen past phone width.
export const HERO_ART_LARGE = '(min-width: 1289px) or ((min-width: 644px) and (min-resolution: 1.5dppx))';

export function heroArtFile(mode: RenderedMode, large: boolean): string {
  return `/hero/hero-v2-${mode}${large ? '' : '-1288'}.avif`;
}

export interface HeroArtPreload {
  href: string;
  media: string;
}

// One entry per file the browser might paint first. An explicit mode names one
// picture; Auto names both, each behind its own prefers-color-scheme query, so
// only the one that will be painted is fetched.
export function heroArtPreloads({ mode }: Pick<AppearanceState, 'mode'>): HeroArtPreload[] {
  const modes = RENDERED_MODES.filter((m) => mode === 'auto' || m === mode);
  return modes.flatMap((m) => {
    const scheme = mode === 'auto' ? `(prefers-color-scheme: ${m}) and ` : '';
    return [
      { href: heroArtFile(m, false), media: `${scheme}(not (${HERO_ART_LARGE}))` },
      { href: heroArtFile(m, true), media: `${scheme}(${HERO_ART_LARGE})` },
    ];
  });
}
