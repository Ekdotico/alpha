import { SITE_META } from '@/lib/site';

export function VerificationSection() {
  return (
    <section className="section" aria-labelledby="verify-title">
      <h2 id="verify-title" className="section-heading">Public, accountless verification</h2>
      <div className="section-body">
        <p>
          Anyone can check a provenance record at {SITE_META.verification}, without an account. The checker needs the document or its document hash.
        </p>
        <code className="verify-endpoint">{SITE_META.verification}</code>
        <p>
          The verification view presents two panels: the document text in read-only form, and the provenance report with its signature chain. Session replay is planned for version 1.1. The event log that will support it is stored from the moment a document is created.
        </p>
      </div>
    </section>
  );
}
