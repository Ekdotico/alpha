import { describe, expect, it } from 'vitest';
import { attributionAttributes, cleanAttribution, referrerHost } from './attribution';

describe('cleanAttribution', () => {
  it('lower-cases, trims, and keeps only [a-z0-9._-]', () => {
    expect(cleanAttribution('  W1-Page_Intro.v2 ')).toBe('w1-page_intro.v2');
    expect(cleanAttribution('Test<script>')).toBe('testscript');
  });

  it('caps a value at 100 characters', () => {
    expect(cleanAttribution('a'.repeat(500))).toBe('a'.repeat(100));
  });

  it('drops a value with nothing valid left, and anything not a string', () => {
    expect(cleanAttribution('<>"\' ')).toBeNull();
    expect(cleanAttribution('')).toBeNull();
    expect(cleanAttribution(null)).toBeNull();
    expect(cleanAttribution(new File([], 'x'))).toBeNull();
  });
});

describe('referrerHost', () => {
  const own = 'alpha.ekdoti.co';

  it('keeps the host name alone, never the path or query', () => {
    expect(referrerHost('https://www.linkedin.com/feed/?trk=abc', own)).toBe('www.linkedin.com');
    expect(referrerHost('https://lnkd.in/eXyZ', own)).toBe('lnkd.in');
  });

  it('is empty for no referrer, an unparseable one, or one of our own hosts', () => {
    expect(referrerHost('', own)).toBeNull();
    expect(referrerHost('not a url', own)).toBeNull();
    expect(referrerHost('https://alpha.ekdoti.co/privacy', own)).toBeNull();
    expect(referrerHost('https://ekdoti.co/', own)).toBeNull();
    expect(referrerHost('https://icai.ekdoti.co/', own)).toBeNull();
    expect(referrerHost('http://localhost:3000/', 'localhost')).toBeNull();
  });

  it('does not mistake a look-alike for our domain', () => {
    expect(referrerHost('https://notekdoti.co/', own)).toBe('notekdoti.co');
  });
});

describe('attributionAttributes', () => {
  it('maps form fields to Brevo attributes, cleaning again and omitting empties', () => {
    const form = new FormData();
    form.set('utm_source', 'LinkedIn');
    form.set('utm_medium', 'page');
    form.set('utm_campaign', '');
    form.set('utm_content', '<>');
    form.set('signup_referrer', 'www.linkedin.com');
    form.set('UTM_CONTENT', 'ignored');
    expect(attributionAttributes(form)).toEqual({
      UTM_SOURCE: 'linkedin',
      UTM_MEDIUM: 'page',
      SIGNUP_REFERRER: 'www.linkedin.com',
    });
  });
});
