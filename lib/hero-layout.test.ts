import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('app/globals.css', 'utf8');
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('hero', () => {
  it('has no illustration left', () => {
    expect(rules).not.toMatch(/hero-art|\/hero\//);
  });

  // The lockup's place is stated once; the slot, the hero and the lockup read it.
  it('states the lockup place once, as --hero-pad', () => {
    expect(rules.match(/--hero-pad:/g)).toHaveLength(1);
    expect(rules).toMatch(/\.hero \{[^}]*padding: var\(--hero-pad\)/);
    expect(rules).toMatch(/top: calc\(100% \+ var\(--hero-pad\)\)/);
  });

  // A transform or translate on the tooltip's wrapper makes a stacking context,
  // and the panel's own layer then counts only inside it: the next positioned
  // row paints over the open tooltip.
  it('leaves the info marks out of a stacking context', () => {
    const marks = [...rules.matchAll(/\.waitlist-info[^{]*\{([^}]*)\}/g)].map((m) => m[1]).join('\n');
    expect(marks).not.toMatch(/\b(translate|transform|z-index|opacity|filter|isolation)\s*:/);
  });
});
