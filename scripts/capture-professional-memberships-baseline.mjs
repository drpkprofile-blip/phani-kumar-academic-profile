import { writeFileSync } from "node:fs";
import { root } from "./publication-seed.mjs";
import { mapProfessionalMemberships } from "./professional-membership-seed.mjs";
import { readCommittedPublications } from "./publication-seed.mjs";
import { compareProfile } from "../tests/helpers/render-profile.mjs";

const publications = readCommittedPublications().sort((a,b) => Number(b.year)-Number(a.year) || a.id-b.id);
const rendered = await compareProfile({ publications, heroPublications: "40+" });
const sectionHtml = rendered.current.match(/<section id="professional-bodies".*?<\/section>/s)?.[0];
if (!sectionHtml) throw new Error("The Professional Bodies section did not render.");
writeFileSync(`${root}/supabase/baselines/professional-memberships.json`, `${JSON.stringify({ rows: mapProfessionalMemberships(), sectionHtml }, null, 2)}\n`);
console.log("Professional Bodies baseline captured from the supplied one-record data file.");
