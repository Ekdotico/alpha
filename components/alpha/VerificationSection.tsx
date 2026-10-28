import { SITE_META } from '@/lib/site';

export function VerificationSection() {
  return (
    <section className="section" aria-labelledby="verify-title">
      <h2 id="verify-title" className="section-heading">Public, accountless verification</h2>
      <div className="section-body">
        <p>
          Every sealed export includes a reference to the public verification endpoint. A supervisor, a journal editor, or a reviewer can retrieve the provenance report without an account, without an institutional agreement, and without contacting the student.
        </p>
        <code className="verify-endpoint">{SITE_META.verification}</code>
        <p>
          The verification view presents three panels: the document text in read-only form, the provenance report with its signature chain, and a video playback panel, which in version 1.0 states that playback is not yet available. Reconstruction of the writing session from the event log is planned for version 1.1. The event log that will support it is stored from the moment a document is created.
        </p>
      </div>
    </section>
  );
}
