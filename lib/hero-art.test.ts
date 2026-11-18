import { existsSync, readFileSync } from 'node:fs';
import { themeNames } from '@ekdotico/domico/tokens';
import { describe, expect, it } from 'vitest';
import { HERO_ART_LARGE, RENDERED_MODES, heroArtFile, heroArtPreloads, heroFogFile } from './hero-art';

const css = readFileSync('app/globals.css', 'utf8');
const tokens = readFileSync('node_modules/@ekdotico/domico/tokens/generated/tokens.css', 'utf8');
const painted = (file: string) => existsSync(`public${file}`) && css.includes(`url('${file}')`);

// Every theme Domico offers, not a list kept here.
const pairs = themeNames.flatMap((theme) => RENDERED_MODES.map((mode) => [theme, mode] as const));

describe('hero art', () => {
  // The painting is chosen by mode alone and the fog is one mask filled with
  // --bg-canvas, so a theme has both exactly when its tokens state that colour
  // for the mode. A rule here that names a theme would break that, and fails.
  it.each(pairs)('%s %s has the painting, the fog and a page colour to fill it', (theme, mode) => {
    for (const large of [false, true]) {
      expect(painted(heroArtFile(mode, large)), heroArtFile(mode, large)).toBe(true);
      expect(painted(heroFogFile(large)), heroFogFile(large)).toBe(true);
    }
    const selector = mode === 'dark' ? `[data-theme="${theme}"][data-mode="dark"] {` : `[data-theme="${theme}"] {`;
    expect(tokens, selector).toContain(selector);
    const block = tokens.slice(tokens.indexOf(selector)).split('}')[0];
    expect(block, `${selector} --bg-canvas`).toContain('--bg-canvas:');
    expect(css).toContain('background: var(--bg-canvas);');
    expect(css, 'no hero rule may depend on a theme').not.toMatch(/\[data-theme[^\]]*\][^{]*\.hero/);
  });

  it.each(['left-light', 'right-light', 'left-dark', 'right-dark'])('cloud %s is a file globals.css paints', (name) => {
    expect(painted(`/hero/cloud-${name}.avif`)).toBe(true);
  });

  it('sizes the clouds from the laid-out text, not from a breakpoint', () => {
    for (const name of ['--hero-body', '--hero-title-text', '--hero-lede-text', '--hero-form']) {
      expect(css, name).toContain(`anchor-name: ${name};`);
      expect(css, name).toContain(`anchor(${name} `);
    }
    expect(css).toContain('@container (min-height: 3rem) or (min-width: 4.5rem)');
  });

  // A transform or translate on the tooltip's wrapper makes a stacking context,
  // and the panel's own layer then counts only inside it: the next positioned
  // row paints over the open tooltip.
  it('leaves the info marks out of a stacking context', () => {
    const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.waitlist-info[^{]*\{([^}]*)\}/g)].map((m) => m[1]).join('\n');
    expect(rules).not.toMatch(/\b(translate|transform|z-index|opacity|filter|isolation)\s*:/);
  });

  it('swaps sizes at the same viewport as globals.css', () => {
    expect(css).toContain(`@media ${HERO_ART_LARGE}`);
  });

  it('preloads one painting for an explicit mode and both for Auto', () => {
    expect(heroArtPreloads({ mode: 'dark' }).map((p) => p.href)).toEqual([
      '/hero/hero-parchment-dark-1440.avif',
      '/hero/hero-parchment-dark.avif',
    ]);
    expect(heroArtPreloads({ mode: 'auto' })).toHaveLength(4);
  });
});
