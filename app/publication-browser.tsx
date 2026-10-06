"use client";

import { useState } from "react";
import { pageCopy } from "../data/page-content";
import type { Publication } from "../data/publications";
import { filterPublications, getPublicationYears } from "../lib/publication-filter";

type PublicationBrowserProps = {
  publications: Publication[];
};

function PublicationPdfLink({ url }: { url?: string }) {
  if (!url) {
    return (
      <span className="pdf-pending" title={pageCopy.googleDrivePdfLinkWillBeAddedHere}>
        {pageCopy.pdfProofWillBeUpdatedSoon}
      </span>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="pdf-link">
      {pageCopy.pdfProof}
    </a>
  );
}

export default function PublicationBrowser({ publications }: PublicationBrowserProps) {
  const [selectedYear, setSelectedYear] = useState("ALL");
  const years = getPublicationYears(publications);
  const visiblePublications = filterPublications(publications, selectedYear);

  return (
    <>
      <div className="publication-filter-note" role="group" aria-label="Filter Publications by year">
        <button
          type="button"
          aria-pressed={selectedYear === "ALL"}
          onClick={() => setSelectedYear("ALL")}
        >{pageCopy.all}</button>
        {years.map((year) => (
          <button
            key={year}
            type="button"
            aria-pressed={selectedYear === year}
            onClick={() => setSelectedYear(year)}
          >{year}</button>
        ))}
      </div>

      <div className="publication-grid">
        {visiblePublications.map((publication) => {
          const articleUrl = publication.url || (publication.doi ? `https://doi.org/${publication.doi}` : undefined);

          return (
            <article className="publication-card" key={publication.id}>
              <div className="publication-tags">
                <span>{publication.year}</span>
                {publication.indexing.map((tag) => <span key={tag}>{tag}</span>)}
                {publication.impactFactor !== undefined && <span>{pageCopy.if}{publication.impactFactor}</span>}
              </div>

              <h3>{publication.title}</h3>
              <p className="publication-journal">{publication.journal}</p>

              {publication.doi && <p className="publication-doi">{pageCopy.doi}{publication.doi}</p>}

              <div className="publication-actions">
                {articleUrl ? (
                  <a href={articleUrl} target="_blank" rel="noopener noreferrer" className="article-link">
                    {pageCopy.viewArticle}
                  </a>
                ) : (
                  <span className="article-pending">{pageCopy.articleLinkWillBeUpdatedSoon}</span>
                )}
                <PublicationPdfLink url={publication.proof} />
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
