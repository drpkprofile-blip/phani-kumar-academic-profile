"use client";

import { useState } from "react";
import type { AcademicActivity } from "../data/activities";
import { filterActivities, groupActivitiesByYear } from "../lib/activity-filter";

type ActivityBrowserProps = {
  activities: AcademicActivity[];
  activityTypes: string[];
  activityYears: string[];
  labels: {
    all: string;
    activityCountSuffix: string;
    certificateProof: string;
    proofLinkWillBeUpdatedSoon: string;
  };
};

export default function ActivityBrowser({ activities, activityTypes, activityYears, labels }: ActivityBrowserProps) {
  const [selected, setSelected] = useState("ALL");
  const filtered = filterActivities(activities, selected);
  const groups = groupActivitiesByYear(filtered, activityYears);
  const filters = ["ALL", ...activityTypes];

  return <>
    <div className="activity-filter-note" role="group" aria-label="Filter Activities by type">
      {filters.map((type) => (
        <button
          key={type}
          type="button"
          className="activity-filter-chip"
          aria-pressed={selected === type}
          onClick={() => setSelected(type)}
        >{type === "ALL" ? labels.all : type.toUpperCase()}</button>
      ))}
    </div>

    <div className="activity-years" aria-live="polite">
      {groups.map(({ year, activities: yearActivities }) => (
        <div className="activity-year-block" key={year}>
          <div className="year-heading">
            <span>{year}</span>
            <small>{yearActivities.length}{labels.activityCountSuffix}</small>
          </div>

          <div className="activity-grid">
            {yearActivities.map((activity, index) => (
              <article className="activity-card" key={`${year}-${activity.title}-${index}`}>
                <div className="activity-card-top">
                  <span className="activity-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="activity-type">{activity.type}</span>
                </div>

                <h3>{activity.title}</h3>
                <p className="activity-institution">{activity.institution}</p>
                {activity.date && <p className="activity-date">{activity.date}</p>}
                {activity.duration && <p className="activity-duration">{activity.duration}</p>}
                {activity.details && <p className="activity-details">{activity.details}</p>}

                <div className="proof-row">
                  {activity.proofUrl ? (
                    <a href={activity.proofUrl} target="_blank" rel="noopener noreferrer" className="proof-link">
                      {labels.certificateProof} ↗
                    </a>
                  ) : <span className="link-pending">{labels.proofLinkWillBeUpdatedSoon}</span>}
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  </>;
}
