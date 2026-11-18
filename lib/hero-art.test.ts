import { existsSync, readFileSync } from 'node:fs';
import { DEFAULT_THEME } from '@ekdotico/domico/theme';
import { themeNames } from '@ekdotico/domico/tokens';
import { describe, expect, it } from 'vitest';
import { HERO_ART_LARGE, RENDERED_MODES, heroArtFile, heroArtPreloads, heroFogFile } from './hero-art';

const css = readFileSync('app/globals.css', 'utf8');
const tokens = readFileSync('node_modules/@ekdotico/domico/tokens/generated/tokens.css', 'utf8');
const painted = (file: string) => existsSync(`public${file}`) && css.includes(`url('${file}')`);

// Every theme Domico offers, not a list kept here.
const pairs = themeNames.flatMap((theme) => RENDERED_MODES.map((mode) => [theme, mode] as const));

describe('hero art', () => {
  // Each theme has its own painting per mode, under the selectors tokens.css
  // uses (the default theme's are on .hero alone). The fog is one mask filled
  // with --bg-canvas, so a theme has it exactly when its tokens state that
  // colour for the mode.
  it.each(pairs)('%s %s has its painting, the fog and a page colour to fill it', (theme, mode) => {
    const dark = mode === 'dark';
    const rules =
      theme === DEFAULT_THEME
        ? [dark ? '[data-mode="dark"] .hero {' : '.hero {', ...(dark ? [':root:not([data-mode]) .hero {'] : [])]
        : [
            `[data-theme="${theme}"]${dark ? '[data-mode="dark"]' : ''} .hero {`,
            ...(dark ? [`[data-theme="${theme}"]:not([data-mode]) .hero {`] : []),
          ];
    for (const large of [false, true]) {
      const file = heroArtFile(theme, mode, large);
      expect(existsSync(`public${file}`), file).toBe(true);
      for (const rule of rules) {
        // Some block opened by exactly this selector names the file.
        const blocks = css.split(new RegExp(`(?<=\\n) *${rule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n`)).slice(1).map((b) => b.split('}')[0]);
        expect(blocks.some((b) => b.includes(`url('${file}')`)), `${rule} ${file}`).toBe(true);
      }
      expect(painted(heroFogFile(large)), heroFogFile(large)).toBe(true);
    }
    const selector = mode === 'dark' ? `[data-theme="${theme}"][data-mode="dark"] {` : `[data-theme="${theme}"] {`;
    expect(tokens, selector).toContain(selector);
    const block = tokens.slice(tokens.indexOf(selector)).split('}')[0];
    expect(block, `${selector} --bg-canvas`).toContain('--bg-canvas:');
    expect(css).toContain('background: var(--bg-canvas);');
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
    expect(heroArtPreloads({ theme: 'sepia', mode: 'dark' }).map((p) => p.href)).toEqual([
      '/hero/hero-sepia-dark-1440.avif',
      '/hero/hero-sepia-dark.avif',
    ]);
    expect(heroArtPreloads({ theme: 'library', mode: 'auto' })).toHaveLength(4);
  });
});
