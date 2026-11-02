import { LinkedInIcon } from "@/components/icons/LinkedInIcon";

export function TeamSection() {
  return (
    <section className="section" aria-labelledby="team-title">
      <h2 id="team-title" className="section-heading">Who is building Ekdotico</h2>
      <div className="section-body">
        <p>
          Ekdotico is in alpha development, by two undergraduate students at the American College of Greece.
        </p>
        <dl className="team-list">
          <dt>
            <span>Stavros Apostolou</span>
            <a
              className="team-social"
              href="https://www.linkedin.com/in/stavros-apostolou-a72a9b216/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Stavros Apostolou on LinkedIn (opens in a new tab)"
            >
              <LinkedInIcon />
            </a>
          </dt>
          <dd>Undergraduate, American College of Greece</dd>
          <dt>
            <span>Aimilios Zacharakis</span>
            <a
              className="team-social"
              href="https://www.linkedin.com/in/aimilios-zacharakis-4a15a5383/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Aimilios Zacharakis on LinkedIn (opens in a new tab)"
            >
              <LinkedInIcon />
            </a>
          </dt>
          <dd>Undergraduate, American College of Greece</dd>
        </dl>
      </div>
    </section>
  );
}
