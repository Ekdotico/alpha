import { SITE_META } from '@/lib/site';

// In the future tense: the checker is designed, not running, and its host
// serves nothing yet. The host is named once, in a sentence, and not set out as
// an endpoint a reader would try to visit.
export function VerificationSection() {
  return (
    <section className="section" aria-labelledby="verify-title">
      <h2 id="verify-title" className="section-heading">Verification without an account</h2>
      <div className="section-body">
        <p>
          Anyone will be able to check a provenance record at {SITE_META.verification}, without an account. The checker will need the document or its document hash.
        </p>
        <p>
          The verification view will present two panels: the document text in read-only form, and the provenance report with its signature chain. Session replay is planned for version 1.1, from an event log kept from the moment a document is created.
        </p>
      </div>
    </section>
  );
}
