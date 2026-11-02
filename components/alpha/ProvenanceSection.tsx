export function ProvenanceSection() {
  return (
    <section className="section" aria-labelledby="provenance-title">
      <h2 id="provenance-title" className="section-heading">Istorico, the provenance system</h2>
      <div className="section-body">
        <p>
          As designed, every writing session generates an event log of keystrokes, paste events, source consultations, and AI invocations. Documents you create belong to your account, not to an institution.
        </p>
        <p>
          Each session is signed with Ed25519, a public-key signature scheme. A change to a signed record is detectable.
        </p>
        <p>
          The provenance record contains no score, flag, or verdict. Ekdotico does not use AI text detectors. Published studies report that these detectors misclassify writing by non-native English speakers as AI-generated (<a href="https://doi.org/10.1016/j.patter.2023.100779">Liang et al., 2023</a>). The provenance record covers work done in Ekdotico only.
        </p>
        <p>
          On the Team Plan, supervisors can read documents created in the institution&apos;s workspace while you are enrolled. Documents in your personal workspace stay outside institutional access. Read access to documents created during enrolment continues for the institution&apos;s declared review period after unenrolment.
        </p>
      </div>
    </section>
  );
}
