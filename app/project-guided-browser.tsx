"use client";

import { useState } from "react";
import type { PublicGuidedProject } from "../lib/projects-guided";
import { getGuidedProjectCategory } from "../lib/project-guided-filter";
import { pageCopy } from "../data/page-content";

type ProjectGuidedBrowserProps = {
  projects: PublicGuidedProject[];
};

const filters = ["ALL", "B.TECH", "M.TECH"] as const;

export default function ProjectGuidedBrowser({ projects }: ProjectGuidedBrowserProps) {
  const [selected, setSelected] = useState<(typeof filters)[number]>("ALL");
  const filteredProjects = selected === "ALL"
    ? projects
    : projects.filter((project) => getGuidedProjectCategory(project) === selected);

  return <>
    <div className="activity-filter-note" role="group" aria-label="Filter guided projects by degree">
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          className="activity-filter-chip"
          aria-pressed={selected === filter}
          onClick={() => setSelected(filter)}
        >{filter === "ALL" ? "All" : filter === "B.TECH" ? "B.Tech" : "M.Tech"}</button>
      ))}
    </div>

    <div className="projects-guided-grid" aria-live="polite">
      {filteredProjects.map((project, index) => (
        <article className="project-guided-card" key={project.id}>
          <div className="project-guided-topline">
            <span>{String(index + 1).padStart(2, "0")}</span>
            {project.projectLevel && <span>{project.projectLevel}</span>}
          </div>
          <h3>{project.projectTitle}</h3>
          {[project.degreeProgram, project.branch, project.academicYear, project.batch]
            .filter(Boolean).map((detail, detailIndex) => <p key={`${detailIndex}-${detail}`}>{detail}</p>)}
          {project.studentNames && <p><strong>{pageCopy.students}:</strong> {project.studentNames.join(", ")}</p>}
          {project.guideName && <p><strong>{pageCopy.guide}:</strong> {project.guideName}</p>}
          {project.coGuideNames && <p><strong>{pageCopy.coGuides}:</strong> {project.coGuideNames.join(", ")}</p>}
          {project.proofUrl && <div className="proof-row"><a href={project.proofUrl} target="_blank" rel="noopener noreferrer" className="proof-link">{pageCopy.proof}{pageCopy.linkArrowWithSpace}</a></div>}
        </article>
      ))}
      {filteredProjects.length === 0 && (
        <div className="projects-guided-empty-state" role="status">
          No {selected === "B.TECH" ? "B.Tech" : "M.Tech"} guided projects are available yet.
        </div>
      )}
    </div>
  </>;
}
