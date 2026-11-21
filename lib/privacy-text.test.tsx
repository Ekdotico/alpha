import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// The privacy page's footer is a client component of the design package; the
// words under test are the page's own.
vi.mock('@/components/alpha/SiteFooter', () => ({ SiteFooter: () => null }));

const { default: PrivacyPage } = await import('@/app/(site)/privacy/page');

// The owner's approved wording, character for character (reports/texts-for-approval.md,
// items 1a, 1b and 1c). A later edit to any of it fails here and needs the owner.
const COUNTING_VISITS =
  'Counting visits. To learn how many people read this site and whether the form works, each page you open sends one short message to a measurement service. It says which page was opened (the home page, this page, the confirmation page, or another) and carries what your browser sends with any request, such as its name and version. When you send the form, a second message says whether it worked or failed, and never the address you entered. Nothing is stored in your browser for this. The messages of one visit share a random number that lasts only while the page is open, so there is no identifier that lasts beyond the page, and nothing links one visit to the next. The service does not receive your network address; it sees only that of the provider that hosts this site, and works out no location.';
const PROCESSOR_CLAUSE =
  'a measurement service in the European Union, which receives the messages described under "Counting visits" through this site\'s own address;';
const COOKIES =
  'Cookies. This site sets no advertising or analytics cookies. Your browser keeps a few settings for it, such as the appearance you choose.';

// The page's visible text, one string per paragraph, tags and entities gone.
function paragraphs(): string[] {
  const html = renderToStaticMarkup(<PrivacyPage />);
  return [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(([, inner]) =>
    inner
      .replace(/<[^>]+>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;|&apos;|&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

describe('the privacy page, counting visits', () => {
  it('carries the approved paragraph, whole, directly after "Where you signed up from"', () => {
    const all = paragraphs();
    const at = all.findIndex((p) => p.startsWith('Where you signed up from.'));
    expect(at).toBeGreaterThanOrEqual(0);
    expect(all[at + 1]).toBe(COUNTING_VISITS);
    expect(all[at + 2]).toMatch(/^Who holds it\./);
  });

  it('names the measurement service among the processors, after the host and before the spam check', () => {
    const handled = paragraphs().find((p) => p.startsWith('Who else handles it.')) ?? '';
    expect(handled).toContain(`the provider that hosts this site; ${PROCESSOR_CLAUSE} and a spam-check service`);
  });

  // The owner's approved basis sentence, and the changed last sentence, with
  // everything else in the paragraph as it was.
  it('states the basis for counting, and lets the reader object to any of the three', () => {
    const why = paragraphs().find((p) => p.startsWith('Why we may hold it.')) ?? '';
    expect(why).toBe(
      'Why we may hold it. For the waitlist and the testing email, your consent, given when you send the form and again when you open the confirmation link. You can withdraw it at any time through the unsubscribe link in any of our emails. For the spam check and for recording where you signed up from, our legitimate interest in keeping the form working and in knowing which posts reach people. For counting visits, our legitimate interest in knowing whether the site and its form work. You can object to any of these by writing to us.',
    );
  });

  // The owner's approved retention sentence, last in the paragraph, the rest as it was.
  it('keeps the counts for one year, as the last sentence of the retention paragraph', () => {
    expect(paragraphs()).toContain(
      'How long. Your address is kept until you unsubscribe or ask us to delete it, and no longer than the waitlist is needed for news of the opening; the testing list closes when testing ends, or with the waitlist. Records used to stop the form or the counting being misused are short-lived and deleted automatically. The counts of visits are kept for one year and then deleted.',
    );
  });

  it('shows the date the owner approved', () => {
    expect(renderToStaticMarkup(<PrivacyPage />)).toContain('21 November 2026');
  });

  it('leaves the cookie paragraph exactly as it was', () => {
    expect(paragraphs()).toContain(COOKIES);
  });

  it('has the paragraph once', () => {
    expect(paragraphs().filter((p) => p.startsWith('Counting visits.'))).toHaveLength(1);
  });
});
