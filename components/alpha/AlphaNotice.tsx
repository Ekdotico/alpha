import { cookies } from 'next/headers';
import { Button } from '@ekdotico/domico/components';
import { acknowledgeAlphaNotice } from '@/app/(site)/actions';
import { ALPHA_NOTICE_COOKIE } from '@/lib/site';

// The release status, as a bar along the foot of the window until the reader
// acknowledges it. Read from a cookie on the server rather than from storage
// after hydration, so a reader who has acknowledged it never sees it flash, and
// dismissed through a server action, so the button works without JavaScript.
// The privacy notice already covers it: "Your browser keeps a few settings for
// it, such as the appearance you choose."
//
// First in the chrome after the skip link, so a screen reader meets it before
// the header, as it would a consent banner. A region rather than a dialog: it
// asks for nothing before the page can be read.
export async function AlphaNotice() {
  const store = await cookies();
  if (store.get(ALPHA_NOTICE_COOKIE)) return null;

  return (
    <section className="alpha-notice" aria-label="Release status">
      <div className="alpha-notice-inner">
        <p className="alpha-notice-text">
          This site describes Ekdotico as planned. As of November 2026, the software is in closed alpha and not yet open for use.
        </p>
        <form action={acknowledgeAlphaNotice}>
          <Button type="submit">I understand</Button>
        </form>
      </div>
    </section>
  );
}
