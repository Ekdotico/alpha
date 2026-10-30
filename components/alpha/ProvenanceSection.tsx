export function ProvenanceSection() {
  return (
    <section className="section" aria-labelledby="provenance-title">
      <h2 id="provenance-title" className="section-heading">The provenance record</h2>
      <div className="section-body">
        <p>
          Every writing session generates an event log of keystrokes, paste events, source consultations, and AI invocations. The log is recorded as a factual account of how the document was written. The record collects five categories of signal: session chronology and active writing time, revision operations, source engagement, disclosed AI tool usage, and the cryptographic chain that binds them. Each session is signed with an Ed25519 signature as it closes, and a sealed export carries a provenance reference in its metadata: the document identifier, the document hash, and the verification address.
        </p>
        <p>
          The record describes the process; it does not score the writing. It does not classify a document as AI-written or human-written, and it computes no measure of how much of the text came from where. Ekdotico produces no AI detector score at any point, and that is a permanent design position rather than a feature still to come. Published studies report that AI text detectors misclassify writing by non-native English speakers (Liang et al., 2023) and perform poorly on texts that mix human and AI writing (Hadra et al., 2026). In practice, a detector&apos;s score cannot be checked against how the text was actually written (Bassett et al., 2026). The provenance record covers work done in Ekdotico only.
        </p>
        <p>
          Sources: Liang, W., Yuksekgonul, M., Mao, Y., Wu, E., and Zou, J. (2023), <cite>Patterns</cite>,{' '}
          <a href="https://doi.org/10.1016/j.patter.2023.100779">https://doi.org/10.1016/j.patter.2023.100779</a>. Hadra, M., Cambridge, K., and Mesbah, M. (2026), <cite>International Journal for Educational Integrity</cite>,{' '}
          <a href="https://doi.org/10.1007/s40979-026-00213-1">https://doi.org/10.1007/s40979-026-00213-1</a>. Bassett, M. A., Bradshaw, W., Bornsztejn, H., Hogg, A., Murdoch, K., Pearce, B., and Webber, C. (2026), <cite>Journal of Higher Education Policy and Management</cite>,{' '}
          <a href="https://doi.org/10.1080/1360080X.2026.2622146">https://doi.org/10.1080/1360080X.2026.2622146</a>.
        </p>
        <p>
          Documents in your personal workspace are not visible to any institution. On the Team Plan, documents you create in your institution&apos;s workspace can be read by its supervisors.
        </p>
      </div>
    </section>
  );
}
