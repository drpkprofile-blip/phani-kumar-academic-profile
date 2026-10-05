import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { root } from "./publication-seed.mjs";

// Collect every TAP assertion because CLI db query returns only the last result set.
// The original authorization tests and their rollback are preserved.
const management = process.argv.includes("--management");
const activities = process.argv.includes("--activities");
const certifications = process.argv.includes("--certifications");
const achievements = process.argv.includes("--achievements");
const peerReviews = process.argv.includes("--peer-reviews");
const peerReviewSettings = process.argv.includes("--peer-review-settings");
const achievementManagement = process.argv.includes("--management") && achievements;
const selected = [activities, certifications, achievements, peerReviews, peerReviewSettings].filter(Boolean).length;
if (selected > 1) throw new Error("Select only one RLS test module.");
const testName = peerReviews
  ? "peer_reviews_rls"
  : peerReviewSettings
    ? "peer_review_settings_rls"
    : achievements
  ? achievementManagement ? "achievements_management" : "achievements_rls"
  : certifications
    ? management ? "certifications_management" : "certifications_rls"
    : activities
    ? management ? "activities_management" : "activities_rls"
    : management ? "publications_management" : "publications_rls";
let sql = readFileSync(`${root}/supabase/tests/${testName}.sql`, "utf8");
sql = sql.replace(/select plan\((\d+)\);/, (_, count) => `create temporary table phase2c_tap (result text);\ngrant select, insert on table phase2c_tap to anon, authenticated;\ninsert into phase2c_tap select plan(${count});`);
sql = sql.replace(/^select (is\(|ok\(|throws_ok\(|lives_ok\()/gm, (_, call) => `insert into phase2c_tap select ${call}`);
sql = sql.replace("select * from finish();", "reset role;\ninsert into phase2c_tap select * from finish();\nselect jsonb_agg(result order by ctid) as tap_results from phase2c_tap;");
mkdirSync(`${root}/supabase/.temp`, { recursive: true });
writeFileSync(`${root}/supabase/.temp/${testName.replaceAll("_", "-")}-validation.sql`, sql);
console.log("Prepared ignored transactional RLS test output aggregation.");
