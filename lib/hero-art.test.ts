import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HERO_ART, HERO_ART_LARGE, heroArtFile, heroArtPreloads, heroFogFile } from './hero-art';

const css = readFileSync('app/globals.css', 'utf8');
const pairs = Object.entries(HERO_ART).flatMap(([theme, modes]) =>
  modes.map((mode) => [theme, mode] as const),
);

describe('hero art', () => {
  it.each(pairs)('%s %s has both sizes of picture and fog, and globals.css paints them', (theme, mode) => {
    for (const large of [false, true]) {
      const art = heroArtFile(mode, large);
      const fog = heroFogFile(theme as keyof typeof HERO_ART, mode, large);
      for (const file of [art, fog]) {
        expect(existsSync(`public${file}`), file).toBe(true);
        expect(css, file).toContain(`url('${file}')`);
      }
    }
  });

  it('swaps sizes at the same viewport as globals.css', () => {
    expect(css).toContain(`@media ${HERO_ART_LARGE}`);
  });

  it('preloads one painting for an explicit mode and both for Auto', () => {
    expect(heroArtPreloads({ theme: 'parchment', mode: 'dark' }).map((p) => p.href)).toEqual([
      '/hero/hero-parchment-dark-1440.avif',
      '/hero/hero-parchment-dark.avif',
    ]);
    expect(heroArtPreloads({ theme: 'parchment', mode: 'auto' })).toHaveLength(4);
  });

  it('preloads nothing where a theme has no picture for the mode', () => {
    expect(heroArtPreloads({ theme: 'sepia', mode: 'light' })).toEqual([]);
    expect(heroArtPreloads({ theme: 'library', mode: 'auto' })).toHaveLength(2);
  });
});
