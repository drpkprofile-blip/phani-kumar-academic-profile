import type { ReactNode } from "react";
import { researchAreas } from "../data/research";
import { education } from "../data/education";
import { experience } from "../data/experience";
import { peerReviews } from "../data/peer-reviews";
import { counters } from "../data/counters";
import { pageCopy, pageLinks } from "../data/page-content";
import { getPublicPublications } from "../lib/publications";
import { getPublicActivities } from "../lib/activities";
import { getPublicCertifications } from "../lib/certifications";
import { getPublicAchievements } from "../lib/achievements";
import { getPublicProfessionalMemberships } from "../lib/professional-memberships";
import { getPublicSubjectsTaught } from "../lib/subjects-taught";
import { profile } from "../data/profile";

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
      {children}{pageCopy.linkArrowWithSpace}</a>
  );
}

function PublicationPdfLink({
  url,
}: {
  url?: string;
}) {
  if (!url) {
    return (
      <span className="pdf-pending" title={pageCopy.googleDrivePdfLinkWillBeAddedHere}>{pageCopy.pdfProofWillBeUpdatedSoon}</span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="pdf-link"
    >{pageCopy.pdfProof}</a>
  );
}

export default async function Home() {
  const { publications: sortedPublications, heroPublications } = await getPublicPublications();
  const { activities, activityTypes, activityYears } = await getPublicActivities();
  const certifications = await getPublicCertifications();
  const achievements = await getPublicAchievements();
  const professionalMemberships = await getPublicProfessionalMemberships();
  const subjectsTaught = await getPublicSubjectsTaught();
  const certificationCount = certifications.length;

  return (
    <main id="top">
      <header className="navbar">
        <div className="nav-container">
          <a href={pageLinks.top} className="logo" aria-label={pageCopy.home}>{pageCopy.pk}</a>

          <a href={pageLinks.top} className="nav-title">{pageCopy.academicProfile}</a>

          <nav className="nav-links" aria-label={pageCopy.primaryNavigation}>
            <a href={pageLinks.top}>{pageCopy.home}</a>
            <a href={pageLinks.research}>{pageCopy.research}</a>
            <a href={pageLinks.publications}>{pageCopy.publications}</a>
            <a href={pageLinks.activities}>{pageCopy.activities}</a>
            <a href={pageLinks.experience}>{pageCopy.experience}</a>
            <a href={pageLinks.certifications}>{pageCopy.nptel}</a>
            <a href={pageLinks.peerReviews}>{pageCopy.peerReviews}</a>
            <a href={pageLinks.achievements}>{pageCopy.achievements}</a>
            <a href={pageLinks.professionalBodies}>{pageCopy.professionalBodies}</a>
            <a href={pageLinks.subjectsTaught}>{pageCopy.subjectsTaught}</a>
            <a href={pageLinks.contact}>{pageCopy.contact}</a>
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
              {profile.designation} <b>{pageCopy.roleSeparator}</b> {profile.department}
            </p>

            <p className="institution">{profile.institution}</p>

            <p className="hero-description">{profile.description}</p>

            <div className="hero-buttons">
              <a href={pageLinks.research} className="button button-primary">{pageCopy.exploreResearch}</a>
              <a href={pageLinks.contact} className="button button-secondary">{pageCopy.contactMe}</a>
            </div>

            <div className="hero-stats">
              <div>
                <strong>{heroPublications}</strong>
                <span>{pageCopy.publicationsLabel}</span>
              </div>
              <div>
                <strong>{counters.heroPeerReviews}</strong>
                <span>{pageCopy.peerReviewsLabel}</span>
              </div>
              <div>
                <strong>{certificationCount}{pageCopy.counterSuffix}</strong>
                <span>{pageCopy.nptelRecords}</span>
              </div>
              <div>
                <strong>{counters.experienceYears}</strong>
                <span>{pageCopy.yearsExperience}</span>
              </div>
            </div>
          </div>

          <aside className="profile-card">
            <div className="profile-card-top">
              <span>{pageCopy.academicProfile}</span>
              <span>{pageCopy.pk2026}</span>
            </div>

            <div className="photo-frame">
              <img src={profile.photo} alt={profile.name} />
            </div>

            <div className="profile-bottom">
              <div>
                <strong>{profile.name}</strong>
                <span>{profile.department}</span>
              </div>
              <div className="profile-initial">{pageCopy.pk}</div>
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
                alt={pageCopy.codeCadWithPkYoutubeChannel}
              />
              <span className="youtube-channel-text">
                <strong>{pageCopy.codeCadWithPk}</strong>
                <small>{pageCopy.youtubeChannel}</small>
              </span>
              <span className="youtube-arrow">{pageCopy.linkArrow}</span>
            </a>
          </aside>
        </div>
      </section>

      <section id="education" className="section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <p className="section-label">{pageCopy.section01Education}</p>
              <h2>{pageCopy.academicQualifications}</h2>
              <p>{pageCopy.educationDescription}</p>
            </div>
            <div className="section-index">{pageCopy.section01}</div>
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
                  <ExternalLink url={item.proof}>{pageCopy.proof}</ExternalLink>
                  {item.marksProof && (
                    <ExternalLink url={item.marksProof}>{pageCopy.marksMemo}</ExternalLink>
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
                <p className="section-label">{pageCopy.academicIdentity}</p>
                <h2>{pageCopy.researchProfile}</h2>
              </div>
              <span className="section-index">{pageCopy.section02}</span>
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
                      {item.value}{pageCopy.linkArrowWithSpace}</a>
                  ) : (
                    <strong>{item.value}</strong>
                  )}
                </div>
              ))}
            </div>

            <div className="identity-links">
              <div>
                <p className="section-label">{pageCopy.profileLinks}</p>
                <h3>{pageCopy.connectResearch}</h3>
              </div>

              <div className="identity-socials">
                <a
                  href={pageLinks.citationsImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="citations-link"
                  aria-label={pageCopy.citationsAccessibleLabel}
                  title={pageCopy.citationsTitle}
                >{pageCopy.citations}</a>
                {profile.profileLinks.map((link) =>
                  link.href ? (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}{pageCopy.linkArrowWithSpace}</a>
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
              <p className="section-label">{pageCopy.section03Research}</p>
              <h2>{pageCopy.researchAreas}</h2>
              <p>{pageCopy.researchDescription}</p>
            </div>
            <div className="section-index">{pageCopy.section03}</div>
          </div>

          <div className="research-grid">
            {researchAreas.map((area, index) => (
              <article className="research-card" key={area.title}>
                <div className="research-card-top">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{pageCopy.linkArrow}</span>
                </div>
                <h3>{area.title}</h3>
                <p>{area.text}</p>
              </article>
            ))}
          </div>

          <div className="research-footer-grid">
            <div className="mini-panel">
              <p className="mini-label">{pageCopy.researchInterests}</p>
              <div className="tag-list">
                {profile.researchInterests.map((interest) => (
                  <span key={interest}>{interest}</span>
                ))}
              </div>
            </div>

            <div className="mini-panel">
              <p className="mini-label">{pageCopy.technicalTools}</p>
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
              <p className="section-label">{pageCopy.section04Publications}</p>
              <h2>{pageCopy.researchPublications}</h2>
              <p>{pageCopy.publicationsDescription}</p>
            </div>
            <div className="big-stat">
              <strong>{sortedPublications.length}{pageCopy.counterSuffix}</strong>
              <span>{pageCopy.researchPublicationsLabel}</span>
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
                      <span>{pageCopy.if}{publication.impactFactor}</span>
                    )}
                  </div>

                  <h3>{publication.title}</h3>
                  <p className="publication-journal">{publication.journal}</p>

                  {publication.doi && (
                    <p className="publication-doi">{pageCopy.doi}{publication.doi}</p>
                  )}

                  <div className="publication-actions">
                    {articleUrl ? (
                      <a
                        href={articleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="article-link"
                      >{pageCopy.viewArticle}</a>
                    ) : (
                      <span className="article-pending">{pageCopy.articleLinkWillBeUpdatedSoon}</span>
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
              <p className="section-label">{pageCopy.section05AcademicActivities}</p>
              <h2>{pageCopy.fdpsWorkshopsConferences}</h2>
              <p>{pageCopy.activitiesDescription}</p>
            </div>
            <div className="big-stat">
              <strong>{activities.length}</strong>
              <span>{pageCopy.academicActivities}</span>
            </div>
          </div>

          <div className="activity-filter-note">
            <span>{pageCopy.all}</span>
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
                    <small>{yearActivities.length}{pageCopy.activityCountSuffix}</small>
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
                            <ExternalLink url={activity.proofUrl}>{pageCopy.certificateProof}</ExternalLink>
                          ) : (
                            <span className="link-pending">{pageCopy.proofLinkWillBeUpdatedSoon}</span>
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
              <p className="section-label">{pageCopy.section06Experience}</p>
              <h2>{pageCopy.academicExperience}</h2>
              <p>{pageCopy.experienceDescription}</p>
            </div>
            <div className="big-stat">
              <strong>{counters.experienceYears}</strong>
              <span>{pageCopy.yearsExperience}</span>
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
                  <span className="link-pending">{pageCopy.experienceProofWillBeUpdatedSoon}</span>
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
              <p className="section-label">{pageCopy.section07Nptel}</p>
              <h2>{pageCopy.nptelCertifications}</h2>
              <p>{pageCopy.certificationsDescription}</p>
            </div>
            <div className="big-stat">
              <strong>{certificationCount}{pageCopy.counterSuffix}</strong>
              <span>{pageCopy.nptelRecords}</span>
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
                  <span className="card-badge">{pageCopy.nptel}</span>
                </div>

                <h3>{certificate.title}</h3>

                <div className="proof-row">
                  {certificate.certificateUrl ? (
                    <ExternalLink url={certificate.certificateUrl}>{pageCopy.certificate}</ExternalLink>
                  ) : (
                    <span className="link-pending">{pageCopy.certificateLinkWillBeUpdatedSoon}</span>
                  )}

                  {certificate.fdpUrl && (
                    <ExternalLink url={certificate.fdpUrl}>{pageCopy.fdp}</ExternalLink>
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
              <p className="section-label">{pageCopy.section08PeerReviews}</p>
              <h2>{pageCopy.journalPeerReviews}</h2>
              <p>{pageCopy.peerReviewsDescription}</p>
            </div>
            <div className="big-stat">
              <strong>{counters.peerReviewCount}</strong>
              <span>{pageCopy.reviewsCompleted}</span>
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
                    <span>{pageCopy.peerReview}</span>
                    <span>{pageCopy.journalManuscript}</span>
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
              <p className="section-label">{pageCopy.section09Achievements}</p>
              <h2>{pageCopy.academicAchievements}</h2>
              <p>{pageCopy.achievementsDescription}</p>
            </div>
            <div className="section-index">{pageCopy.section09}</div>
          </div>

          <div className="achievement-grid">
            {achievements.map((achievement) => (
              <article className="achievement-card" key={achievement.number}>
                <div className="achievement-top">
                  <span className="achievement-number">
                    {achievement.number}
                  </span>
                  <span className="achievement-label">{pageCopy.achievement}</span>
                </div>

                <h3>{achievement.title}</h3>
                <p>{achievement.text}</p>

                <div className="proof-row achievement-links">
                  <ExternalLink url={achievement.proof}>{pageCopy.proof}</ExternalLink>

                  {achievement.extraProof && (
                    <ExternalLink url={achievement.extraProof}>{pageCopy.eventProof}</ExternalLink>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="professional-bodies" className="section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <p className="section-label">{pageCopy.professionalBodiesLabel}</p>
              <h2>{pageCopy.professionalBodiesTitle}</h2>
              <p>{pageCopy.professionalBodiesDescription}</p>
            </div>
          </div>

          <div className="professional-membership-grid">
            {professionalMemberships.map((membership) => (
              <article className="professional-membership-card" key={`${membership.displayOrder}-${membership.organizationName}`}>
                <div className="membership-topline">
                  <span className="membership-number">{String(membership.displayOrder).padStart(2, "0")}</span>
                  {membership.membershipType && <span className="membership-type">{membership.membershipType}</span>}
                </div>
                <h3>{membership.organizationName}</h3>
                {membership.membershipNumber && <p>Membership no.: {membership.membershipNumber}</p>}
                {membership.dateText && <p>{membership.dateText}</p>}
                {membership.validityText && <p>{membership.validityText}</p>}
                {membership.designation && <p>{membership.designation}</p>}
                {membership.chapter && <p>{membership.chapter}</p>}
                {membership.proofUrl && <div className="proof-row"><ExternalLink url={membership.proofUrl}>{pageCopy.proof}</ExternalLink></div>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="subjects-taught" className="section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <p className="section-label">{pageCopy.subjectsTaughtLabel}</p>
              <h2>{pageCopy.subjectsTaughtTitle}</h2>
              <p>{pageCopy.subjectsTaughtDescription}</p>
            </div>
          </div>

          {subjectsTaught.length === 0 ? (
            <div className="subjects-empty-state" role="status">{pageCopy.subjectsTaughtEmpty}</div>
          ) : (
            <div className="subjects-taught-grid">
              {subjectsTaught.map((subject) => (
                <article className="subject-taught-card" key={subject.id}>
                  <div className="subject-taught-topline">
                    <span>{String(subject.displayOrder).padStart(2, "0")}</span>
                    {subject.subjectType && <span>{subject.subjectType}</span>}
                  </div>
                  <h3>{subject.subjectName}</h3>
                  {[subject.courseCode && `${pageCopy.courseCode}: ${subject.courseCode}`,
                    subject.program && `${pageCopy.program}: ${subject.program}`,
                    subject.branch && `${pageCopy.branch}: ${subject.branch}`,
                    subject.semester && `${pageCopy.semester}: ${subject.semester}`,
                    subject.academicYear && `${pageCopy.academicYear}: ${subject.academicYear}`]
                    .filter(Boolean).map((detail) => <p key={detail}>{detail}</p>)}
                  {subject.proofUrl && <div className="proof-row"><ExternalLink url={subject.proofUrl}>{pageCopy.proof}</ExternalLink></div>}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="contact" className="section contact-section">
        <div className="section-container">
          <div className="contact-box">
            <div className="contact-main">
              <p className="section-label">{pageCopy.section10Contact}</p>
              <h2>{pageCopy.academicCollaboration}</h2>

              <p>{pageCopy.contactDescription}</p>

              <div className="hero-buttons">
                <a
                  href={`mailto:${profile.email}`}
                  className="button button-primary"
                >{pageCopy.emailMe}</a>
                <a href={pageLinks.top} className="button button-secondary">{pageCopy.homeButton}</a>
              </div>
            </div>

            <div className="contact-details">
              <div>
                <span>{pageCopy.email}</span>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </div>

              <div>
                <span>{pageCopy.phone}</span>
                <a href={`tel:${profile.phone.replace(/\s+/g, "")}`}>
                  {profile.phone}
                </a>
              </div>

              <div>
                <span>{pageCopy.institution}</span>
                <p>{profile.institution}</p>
              </div>

              <div>
                <span>{pageCopy.department}</span>
                <p>{profile.department}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div>
          <strong>{pageCopy.copyright}</strong>
          <span>{pageCopy.academicResearchPortfolio}</span>
        </div>
        <a href={pageLinks.top}>{pageCopy.backToHome}</a>
      </footer>
    </main>
  );
}
