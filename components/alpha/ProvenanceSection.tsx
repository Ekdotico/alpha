export function ProvenanceSection() {
  return (
    <section className="section" aria-labelledby="provenance-title">
      <p className="section-eyebrow">The provenance system</p>
      <h2 id="provenance-title" className="section-heading">The provenance record</h2>
      <div className="section-body">
        <p>
          Every writing session generates an event log of keystrokes, paste events, source consultations, and AI invocations. The log is recorded as a factual account of how the document was written. The record collects five categories of signal: session chronology and active writing time, revision operations, source engagement, disclosed AI tool usage, and the cryptographic chain that binds them. Each session is signed with an Ed25519 signature as it closes, and a sealed export carries a provenance reference in its metadata: the document identifier, the document hash, and the verification address.
        </p>
        <p>
          The record describes the process; it does not score the writing. It does not classify a document as AI-written or human-written, and it computes no measure of how much of the text came from where. Ekdotico produces no AI detector score at any point, and that is a permanent design position rather than a feature still to come: the published evidence on detectors records unverifiable outputs and systematic false positives against non-native English writers (Liang et al., 2023).
        </p>
        <p>
          The provenance record is the student&apos;s document. On the Student Plan, it stays private until the student chooses to share it. On the Team Plan, supervisors receive read access to records created under the institution, on the consent the student gives at enrolment.
        </p>
      </div>
    </section>
  );
}
