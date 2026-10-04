import type { ReactNode } from "react";
import { publications } from "../data/publications";
import {
  activities,
  activityTypes,
  activityYears,
} from "../data/activities";
import { certifications } from "../data/certifications";
import { profile } from "../data/profile";

const researchAreas = [
  {
    title: "Polymer Composite Gears",
    text: "Design, analysis, contact stress and wear behaviour of polymer and hybrid composite gears.",
  },
  {
    title: "Advanced Manufacturing",
    text: "Engineering analysis, manufacturing processes, material characterization and advanced manufacturing systems.",
  },
  {
    title: "Artificial Intelligence & Machine Learning",
    text: "Machine learning, intelligent prediction, data-driven modelling and engineering applications.",
  },
  {
    title: "Finite Element Analysis",
    text: "Structural, contact stress, fatigue and numerical analysis of mechanical engineering components.",
  },
  {
    title: "Optimization Techniques",
    text: "Multi-objective optimization, intelligent optimization algorithms and engineering design optimization.",
  },
  {
    title: "Electric & Hybrid Vehicles",
    text: "Electric vehicle systems, battery health, energy management and intelligent vehicle control.",
  },
];

const education = [
  {
    year: "February 2026",
    degree: "Doctor of Philosophy",
    institution: "Andhra University, Visakhapatnam",
    field: "Mechanical Engineering",
    detail: "Research topic: Polymer Composite Gears",
    proof:
      "https://drive.google.com/file/d/1l3ptgzeV6SJ6OuZT87A5wBh08N20rsET/view?usp=drive_link",
  },
  {
    year: "June 2026",
    degree: "Master of Technology",
    institution: "ANITS Engineering College",
    field: "AI-ML in CSE Department",
    proof:
      "https://drive.google.com/file/d/1zV9opR7XI6RlbW_fppAqsIyrvG3e_jID/view?usp=drive_link",
  },
  {
    year: "2010",
    degree: "Master of Engineering",
    institution: "GITAM Engineering College",
    field: "CAD/CAM",
    proof:
      "https://drive.google.com/file/d/1zV9opR7XI6RlbW_fppAqsIyrvG3e_jID/view?usp=drive_link",
    marksProof:
      "https://drive.google.com/file/d/11Z8AnTyeOosboc7Goq1L43miUQL4xqAl/view?usp=drive_link",
    
  },
  {
    year: "2005",
    degree: "Bachelor of Technology",
    institution: "SISTAM Engineering College, Srikakulam",
    field: "Mechanical Engineering",
    proof:
      "https://drive.google.com/file/d/1Y9KTMP0Ku-hv7BsPXQbXmxZQlFMoPTB/view?usp=drive_link",
    marksProof:
      "https://drive.google.com/file/d/1VI6zDS6c45rjbBvI1-lcno05B2XhgnRC/view?usp=drive_link",
    
  },
  {
    year: "2000",
    degree: "Intermediate",
    institution: "BVK Junior College, Visakhapatnam",
    field: "M.P.C",
    proof:
      "https://drive.google.com/file/d/1Tp9SSMSpy1ERr6-8sJ0gFW6NPtHJNC7C/view?usp=drive_link",
  },
  {
    year: "1998",
    degree: "School (X)",
    institution: "GNH School, Visakhapatnam",
    field: "School Education",
    proof:
      "https://drive.google.com/file/d/1Xru84LRQnTJxZrf5dhtpw1aJrk6NEgO/view?usp=drive_link",
  },
];

const experience = [
  {
    period: "Aug 2012 – Present",
    role: "Assistant Professor",
    institution:
      "Anil Neerukonda Institute of Technology and Sciences (ANITS)",
    department: "Department of Mechanical Engineering",
  },
  {
    period: "June 2010 – July 2012",
    role: "Assistant Professor",
    institution: "VIZAG Institute of Technology, Visakhapatnam",
    department: "Department of Mechanical Engineering",
  },
  {
    period: "June 2008 – May 2010",
    role: "Assistant Professor",
    institution: "Sri Vaishnavi College of Engineering, Srikakulam",
    department: "Mechanical Engineering",
  },
  {
    period: "Jan 2006 – July 2006",
    role: "Jr. CAD Engineer",
    institution: "Info Solutions Pvt. Ltd.",
    department: "CAD Engineering",
  },
];

const achievements = [
  {
    number: "01",
    title: "Best Paper Award",
    text: "Received the Best Paper Award at the International Conference on ICANITS-2026.",
    proof:
      "https://drive.google.com/file/d/1TzMj1rdlHN1mUZZqJ7dZEY4Jw9wt0aTT/view?usp=drive_link",
  },
  {
    number: "02",
    title: "NPTEL Discipline Star",
    text: "Received NPTEL Discipline Star Certificate from IIT Madras in 2026 and attended the NPTEL Star Event at IIT Tirupati.",
    proof:
      "https://drive.google.com/file/d/1G2s4OHeQUODHIHDrkOWu2pY1U6kQY0bf/view?usp=drive_link",
    extraProof:
      "https://drive.google.com/file/d/1SslACwcOG3n2UaOmu1QdAqh-4-JoPOvH/view?usp=drive_link",
  },
  {
    number: "03",
    title: "NPTEL Believer Certificate",
    text: "Received NPTEL Believer Certificate from IIT Madras in 2022.",
    proof:
      "https://drive.google.com/file/d/1Bh3tLtVVGmn9-REa0eZm5wesd6T5ggE2/view?usp=drive_link",
  },
  {
    number: "04",
    title: "Research Seed Money",
    text: "Sanctioned Rs. 1,50,000/- from ANITS for research on contact stresses and wear rate of plastic gears mounted on shafts with misalignment.",
    proof:
      "https://drive.google.com/drive/folders/1MndZ9k4UZH06eGZS1id8HpoVXMWl8pXm?usp=drive_link",
  },
];

const peerReviews = [
  "Diffusion-Based Generative Augmentation for Dataset Construction in Door-State Detection of Temporary Electrical Distribution Boxes on Construction Sites, Engineering Research Express (2026)",
  "Adaptive MPC with EKF-Based Obstacle Prediction for AGV Navigation, Engineering Research Express (2026)",
  "Enhanced Lichtenberg Optimization Algorithm for the Optimal Design and Control of MRWBLDC Motors, Proceedings of the Institution of Mechanical Engineers, Part G: Journal of Aerospace Engineering (2026)",
  "TIRP: A Topology-Informed Refinement Model for Multimodal Trajectory Prediction in Autonomous Driving, Measurement Science and Technology (2026)",
  "Parallel Hybrid Interval Type-2 Fuzzy NARX Network for Robust Line-Following Control of Autonomous Guided Vehicles, Measurement Science and Technology (2026)",
  "Effect of Stress Concentration Caused by 3D Surface Topography on Gear Bending Fatigue Life, Engineering Research Express (2025)",
  "Chaotic African Vultures Optimization Based Non-Linear FOPID Controller for Frequency Regulation in Standalone Microgrid System, Engineering Research Express (2025)",
  "CNN-BiLSTM-AM: A Hybrid Deep Learning Model for Real-Time Vehicle Longitudinal Control in Bench Testing, Engineering Research Express (2025)",
  "A Comparative Study on the Structural and Stress Performance of Phased and Non-Phased Gear Systems, Engineering Research Express (2025)",
  "Electric Vehicle Battery Pack State of Health Assessment by Signal Tracking Regularized Box Particle Filter, Engineering Research Express (2025)",
  "Effects of Discrete Fibre Reinforcements on the Wear Resistance Behaviour of Polyamide-Based Spur Gears, Physica Scripta (2024)",
];

function ExternalLink({
  url,
  children,
  className = "proof-link",
}: {
  url?: string;
  children: ReactNode;
  className?: string;
}) {
  if (!url) {
    return <span className="link-pending">{children}</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children} ↗
    </a>
  );
}

function PublicationPdfLink({
  url,
}: {
  url?: string;
}) {
  if (!url) {
    return (
      <span className="pdf-pending" title="Google Drive PDF link will be added here">
        PDF Proof will be updated soon
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="pdf-link"
    >
      PDF Proof ↗
    </a>
  );
}

export default function Home() {
  const publicationCount = publications.length;
  const activityCount = activities.length;
  const sortedPublications = [...publications].sort(
    (a, b) => Number(b.year) - Number(a.year) || a.id - b.id
  );

  const experienceYears = "20+";
  const peerReviewCount = 16;

  return (
    <main id="top">
      <header className="navbar">
        <div className="nav-container">
          <a href="#top" className="logo" aria-label="Home">
            PK
          </a>

          <a href="#top" className="nav-title">
            ACADEMIC PROFILE
          </a>

          <nav className="nav-links" aria-label="Primary navigation">
            <a href="#top">Home</a>
            <a href="#research">Research</a>
            <a href="#publications">Publications</a>
            <a href="#activities">Activities</a>
            <a href="#experience">Experience</a>
            <a href="#certifications">NPTEL</a>
            <a href="#peer-reviews">Peer Reviews</a>
            <a href="#achievements">Achievements</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      <section id="about" className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <p className="eyebrow">{profile.profileLabel}</p>

            <h1 className="hero-name">{profile.name}</h1>

            <h2 className="qualifications">{profile.qualifications}</h2>

            <p className="hero-role">
              {profile.designation} <b>·</b> {profile.department}
            </p>

            <p className="institution">{profile.institution}</p>

            <p className="hero-description">{profile.description}</p>

            <div className="hero-buttons">
              <a href="#research" className="button button-primary">
                Explore Research ↗
              </a>
              <a href="#contact" className="button button-secondary">
                Contact Me
              </a>
            </div>

            <div className="hero-stats">
              <div>
                <strong>40+</strong>
                <span>PUBLICATIONS</span>
              </div>
              <div>
                <strong>16+</strong>
                <span>PEER REVIEWS</span>
              </div>
              <div>
                <strong>{certifications.length}+</strong>
                <span>NPTEL RECORDS</span>
              </div>
              <div>
                <strong>{experienceYears}</strong>
                <span>YEARS EXPERIENCE</span>
              </div>
            </div>
          </div>

          <aside className="profile-card">
            <div className="profile-card-top">
              <span>ACADEMIC PROFILE</span>
              <span>PK / 2026</span>
            </div>

            <div className="photo-frame">
              <img src={profile.photo} alt={profile.name} />
            </div>

            <div className="profile-bottom">
              <div>
                <strong>{profile.name}</strong>
                <span>{profile.department}</span>
              </div>
              <div className="profile-initial">PK</div>
            </div>

            <div className="profile-socials">
              {profile.profileLinks.map((social) =>
                social.href ? (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.label}
                  >
                    <span>{social.label.slice(0, 2)}</span>
                    {social.label}
                  </a>
                ) : null
              )}
            </div>

            <a
              className="youtube-channel"
              href={profile.youtubeChannel.href}
              target="_blank"
              rel="noopener noreferrer"
              title={profile.youtubeChannel.title}
            >
              <img
                src={profile.youtubeChannel.image}
                alt="Code & CAD with PK YouTube channel"
              />
              <span className="youtube-channel-text">
                <strong>Code &amp; CAD with PK</strong>
                <small>YouTube Channel</small>
              </span>
              <span className="youtube-arrow">↗</span>
            </a>
          </aside>
        </div>
      </section>

      <section id="education" className="section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <p className="section-label">01 · EDUCATION</p>
              <h2>Academic Qualifications</h2>
              <p>
                Academic qualifications with supporting documents for
                verification.
              </p>
            </div>
            <div className="section-index">01</div>
          </div>

          <div className="education-grid">
            {education.map((item, index) => (
              <article className="education-card" key={`${item.degree}-${index}`}>
                <div className="card-topline">
                  
                  <span className="card-year">{item.year}</span>
                </div>

                <h3>{item.degree}</h3>
                <strong>{item.institution}</strong>
                <p>{item.field}</p>

                {item.detail && <p>{item.detail}</p>}
                

                <div className="proof-row">
                  <ExternalLink url={item.proof}>Proof</ExternalLink>
                  {item.marksProof && (
                    <ExternalLink url={item.marksProof}>
                      Marks Memo
                    </ExternalLink>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="research-profile" className="section">
        <div className="section-container">
          <div className="identity-panel">
            <div className="identity-heading">
              <div>
                <p className="section-label">ACADEMIC IDENTITY</p>
                <h2>Research Profile</h2>
              </div>
              <span className="section-index">02</span>
            </div>

            <div className="identity-grid">
              {profile.academicIdentity.map((item) => (
                <div className="identity-item" key={item.label}>
                  <span>{item.label}</span>
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.value} ↗
                    </a>
                  ) : (
                    <strong>{item.value}</strong>
                  )}
                </div>
              ))}
            </div>

            <div className="identity-links">
              <div>
                <p className="section-label">PROFILE LINKS</p>
                <h3>Connect &amp; Research</h3>
              </div>

              <div className="identity-socials">
                <a
                  href="/google-scholar-citations.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="citations-link"
                  aria-label="Citations: open Google Scholar citation screenshot in a new tab"
                  title="View Google Scholar citation table and graph"
                >
                  Citations ↗
                </a>
                {profile.profileLinks.map((link) =>
                  link.href ? (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label} ↗
                    </a>
                  ) : (
                    <span key={link.label}>{link.label}</span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="research" className="section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <p className="section-label">03 · RESEARCH</p>
              <h2>Research Areas</h2>
              <p>
                Current research interests and technical areas developed
                through academic and engineering research.
              </p>
            </div>
            <div className="section-index">03</div>
          </div>

          <div className="research-grid">
            {researchAreas.map((area, index) => (
              <article className="research-card" key={area.title}>
                <div className="research-card-top">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>↗</span>
                </div>
                <h3>{area.title}</h3>
                <p>{area.text}</p>
              </article>
            ))}
          </div>

          <div className="research-footer-grid">
            <div className="mini-panel">
              <p className="mini-label">RESEARCH INTERESTS</p>
              <div className="tag-list">
                {profile.researchInterests.map((interest) => (
                  <span key={interest}>{interest}</span>
                ))}
              </div>
            </div>

            <div className="mini-panel">
              <p className="mini-label">TECHNICAL TOOLS</p>
              <div className="tag-list">
                {profile.technicalTools.map((tool) => (
                  <span key={tool}>{tool}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="publications" className="section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <p className="section-label">04 · PUBLICATIONS</p>
              <h2>Research Publications</h2>
              <p>
                Journal articles, book chapters and conference proceedings
                covering composite materials, gears, AI, optimization,
                control and electric vehicles.
              </p>
            </div>
            <div className="big-stat">
              <strong>{publicationCount}+</strong>
              <span>RESEARCH PUBLICATIONS</span>
            </div>
          </div>

          <div className="publication-grid">
            {sortedPublications.map((publication) => {
              const articleUrl =
                publication.url ||
                (publication.doi
                  ? `https://doi.org/${publication.doi}`
                  : undefined);

              return (
                <article className="publication-card" key={publication.id}>
                  <div className="publication-tags">
                    <span>{publication.year}</span>

                    {publication.indexing.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}

                    {publication.impactFactor !== undefined && (
                      <span>IF {publication.impactFactor}</span>
                    )}
                  </div>

                  <h3>{publication.title}</h3>
                  <p className="publication-journal">{publication.journal}</p>

                  {publication.doi && (
                    <p className="publication-doi">DOI: {publication.doi}</p>
                  )}

                  <div className="publication-actions">
                    {articleUrl ? (
                      <a
                        href={articleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="article-link"
                      >
                        View Article ↗
                      </a>
                    ) : (
                      <span className="article-pending">
                        Article link will be updated soon
                      </span>
                    )}

                    <PublicationPdfLink url={publication.proof} />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="activities" className="section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <p className="section-label">05 · ACADEMIC ACTIVITIES</p>
              <h2>FDPs, Workshops &amp; Conferences</h2>
              <p>
                FDPs, workshops, training programmes, STTPs, seminars,
                conferences, guest lectures, webinars and related activities.
              </p>
            </div>
            <div className="big-stat">
              <strong>{activityCount}</strong>
              <span>ACADEMIC ACTIVITIES</span>
            </div>
          </div>

          <div className="activity-filter-note">
            <span>ALL</span>
            {activityTypes.map((type) => (
              <span key={type}>{type.toUpperCase()}</span>
            ))}
          </div>

          <div className="activity-years">
            {activityYears.map((year) => {
              const yearActivities = activities.filter(
                (activity) => activity.year === year
              );

              return (
                <div className="activity-year-block" key={year}>
                  <div className="year-heading">
                    <span>{year}</span>
                    <small>{yearActivities.length} activities</small>
                  </div>

                  <div className="activity-grid">
                    {yearActivities.map((activity, index) => (
                      <article
                        className="activity-card"
                        key={`${year}-${activity.title}-${index}`}
                      >
                        <div className="activity-card-top">
                          <span className="activity-index">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="activity-type">{activity.type}</span>
                        </div>

                        <h3>{activity.title}</h3>
                        <p className="activity-institution">
                          {activity.institution}
                        </p>

                        {activity.date && (
                          <p className="activity-date">{activity.date}</p>
                        )}

                        {activity.duration && (
                          <p className="activity-duration">
                            {activity.duration}
                          </p>
                        )}

                        {activity.details && (
                          <p className="activity-details">
                            {activity.details}
                          </p>
                        )}

                        <div className="proof-row">
                          {activity.proofUrl ? (
                            <ExternalLink url={activity.proofUrl}>
                              Certificate / Proof
                            </ExternalLink>
                          ) : (
                            <span className="link-pending">
                              Proof link will be updated soon
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="experience" className="section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <p className="section-label">06 · EXPERIENCE</p>
              <h2>Academic Experience</h2>
              <p>
                Academic teaching, research, student guidance, technical
                training and engineering experience.
              </p>
            </div>
            <div className="big-stat">
              <strong>20+</strong>
              <span>YEARS EXPERIENCE</span>
            </div>
          </div>

          <div className="experience-list">
            {experience.map((item, index) => (
              <article className="experience-item" key={item.period}>
                <div className="experience-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="experience-content">
                  <p className="experience-period">{item.period}</p>
                  <h3>{item.role}</h3>
                  <strong>{item.institution}</strong>
                  <p>{item.department}</p>
                  <span className="link-pending">
                    Experience proof will be updated soon
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="certifications" className="section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <p className="section-label">07 · NPTEL</p>
              <h2>NPTEL Certifications</h2>
              <p>
                NPTEL academic certifications and associated faculty
                development programme records.
              </p>
            </div>
            <div className="big-stat">
              <strong>{certifications.length}+</strong>
              <span>NPTEL RECORDS</span>
            </div>
          </div>

          <div className="certification-grid">
            {certifications.map((certificate) => (
              <article
                className="certification-card"
                key={certificate.number}
              >
                <div className="card-topline">
                  <span className="card-number">
                    {String(certificate.number).padStart(2, "0")}
                  </span>
                  <span className="card-badge">NPTEL</span>
                </div>

                <h3>{certificate.title}</h3>

                <div className="proof-row">
                  {certificate.certificateUrl ? (
                    <ExternalLink url={certificate.certificateUrl}>
                      Certificate
                    </ExternalLink>
                  ) : (
                    <span className="link-pending">
                      Certificate link will be updated soon
                    </span>
                  )}

                  {certificate.fdpUrl && (
                    <ExternalLink url={certificate.fdpUrl}>FDP</ExternalLink>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="peer-reviews" className="section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <p className="section-label">08 · PEER REVIEWS</p>
              <h2>Journal Peer Reviews</h2>
              <p>
                Manuscript review contributions for Web of Science indexed
                journals.
              </p>
            </div>
            <div className="big-stat">
              <strong>{peerReviewCount}</strong>
              <span>REVIEWS COMPLETED</span>
            </div>
          </div>

          <div className="review-grid">
            {peerReviews.map((review, index) => {
              const yearMatch = review.match(/\((\d{4})\)$/);
              const year = yearMatch ? yearMatch[1] : "";
              const text = year
                ? review.replace(/\s*\(\d{4}\)$/, "")
                : review;

              const separator = text.lastIndexOf(", ");
              const manuscript =
                separator > -1 ? text.slice(0, separator) : text;
              const journal =
                separator > -1 ? text.slice(separator + 2) : "";

              return (
                <article className="review-card" key={index}>
                  <div className="review-card-top">
                    <span className="review-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {year && <span className="review-year">{year}</span>}
                  </div>

                  <h3>{manuscript}</h3>
                  {journal && <p className="review-journal">{journal}</p>}

                  <div className="review-status">
                    <span>PEER REVIEW</span>
                    <span>JOURNAL MANUSCRIPT</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="achievements" className="section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <p className="section-label">09 · ACHIEVEMENTS</p>
              <h2>Academic Achievements</h2>
              <p>
                Awards, academic recognition and research funding with
                supporting proof documents.
              </p>
            </div>
            <div className="section-index">09</div>
          </div>

          <div className="achievement-grid">
            {achievements.map((achievement) => (
              <article className="achievement-card" key={achievement.number}>
                <div className="achievement-top">
                  <span className="achievement-number">
                    {achievement.number}
                  </span>
                  <span className="achievement-label">ACHIEVEMENT</span>
                </div>

                <h3>{achievement.title}</h3>
                <p>{achievement.text}</p>

                <div className="proof-row achievement-links">
                  <ExternalLink url={achievement.proof}>Proof</ExternalLink>

                  {achievement.extraProof && (
                    <ExternalLink url={achievement.extraProof}>
                      Event Proof
                    </ExternalLink>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="section contact-section">
        <div className="section-container">
          <div className="contact-box">
            <div className="contact-main">
              <p className="section-label">10 · CONTACT</p>
              <h2>Academic Collaboration</h2>

              <p>
                For academic collaboration, research discussion, student
                projects, technical consultation and professional
                communication, please use the contact details below.
              </p>

              <div className="hero-buttons">
                <a
                  href={`mailto:${profile.email}`}
                  className="button button-primary"
                >
                  Email Me →
                </a>
                <a href="#top" className="button button-secondary">
                  Home ↑
                </a>
              </div>
            </div>

            <div className="contact-details">
              <div>
                <span>EMAIL</span>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </div>

              <div>
                <span>PHONE</span>
                <a href={`tel:${profile.phone.replace(/\s+/g, "")}`}>
                  {profile.phone}
                </a>
              </div>

              <div>
                <span>INSTITUTION</span>
                <p>{profile.institution}</p>
              </div>

              <div>
                <span>DEPARTMENT</span>
                <p>{profile.department}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div>
          <strong>© 2026 Dr. Phani Kumar Simhadri</strong>
          <span>Academic &amp; Research Portfolio</span>
        </div>
        <a href="#top">Back to Home ↑</a>
      </footer>
    </main>
  );
}
