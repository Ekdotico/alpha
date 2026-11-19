import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HERO_ART_LARGE, RENDERED_MODES, heroArtFile, heroArtPreloads } from './hero-art';

const css = readFileSync('app/globals.css', 'utf8');
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
const painted = (file: string) => existsSync(`public${file}`) && css.includes(`url('${file}')`);

describe('hero art', () => {
  // The picture is chosen by mode alone and is transparent, so every theme has
  // it. A rule here that names a theme would break that, and fails.
  it.each(RENDERED_MODES)('%s has its picture in both sizes', (mode) => {
    for (const large of [false, true]) {
      expect(painted(heroArtFile(mode, large)), heroArtFile(mode, large)).toBe(true);
    }
    expect(css, 'no hero rule may depend on a theme').not.toMatch(/\[data-theme[^\]]*\][^{]*\.hero/);
  });

  it('keeps nothing of the landscape, its fog or its clouds', () => {
    expect(readdirSync('public/hero').sort()).toEqual(
      RENDERED_MODES.flatMap((mode) => [false, true].map((large) => heroArtFile(mode, large).split('/').pop())).sort(),
    );
    expect(rules).not.toMatch(/hero-cloud|fog|parchment/);
  });

  // The text never meets the picture: under it the padding is the picture's
  // whole height, and where the text stands in the picture's empty middle the
  // column is 36% of the page and ends at half the picture's height.
  it('keeps the text clear of the picture', () => {
    expect(rules).toContain('--hero-art-h: calc(var(--page-w) * 1098 / 2576);');
    expect(rules).toMatch(/\.hero \{[^}]*padding: [^;]* calc\(var\(--hero-art-h\) \+ var\(--sp-5\)\);/);
    const wide = rules.slice(rules.indexOf('@media (min-width: 1100px)')).split('@media')[1];
    expect(wide).toContain('.hero { padding-bottom: calc(var(--hero-art-h) * 0.5); }');
    expect(wide).toContain('.hero-body { width: min(var(--content-w), var(--page-w) * 0.36); }');
  });

  // A transform or translate on the tooltip's wrapper makes a stacking context,
  // and the panel's own layer then counts only inside it: the next positioned
  // row paints over the open tooltip.
  it('leaves the info marks out of a stacking context', () => {
    const marks = [...rules.matchAll(/\.waitlist-info[^{]*\{([^}]*)\}/g)].map((m) => m[1]).join('\n');
    expect(marks).not.toMatch(/\b(translate|transform|z-index|opacity|filter|isolation)\s*:/);
  });

  it('swaps sizes at the same viewport as globals.css', () => {
    expect(css).toContain(`@media ${HERO_ART_LARGE}`);
  });

  it('preloads one picture for an explicit mode and both for Auto', () => {
    expect(heroArtPreloads({ mode: 'dark' }).map((p) => p.href)).toEqual([
      '/hero/hero-v2-dark-1288.avif',
      '/hero/hero-v2-dark.avif',
    ]);
    expect(heroArtPreloads({ mode: 'auto' })).toHaveLength(4);
  });
});
