import assert from "node:assert/strict";
import test from "node:test";
import { activities, activityTypes } from "../data/activities.ts";
import { filterActivities, groupActivitiesByYear } from "../lib/activity-filter.ts";

test("ALL returns the complete activity dataset in unchanged order", () => {
  const before = structuredClone(activities);
  const result = filterActivities(activities, "ALL");
  assert.equal(result.length, 46);
  assert.deepEqual(result, activities);
  assert.deepEqual(activities, before);
});

test("each activity category uses exact activity-type matching", () => {
  assert.deepEqual(activityTypes, ["Conference", "FDP", "Organizing", "Guest Lecture", "Training", "Workshop", "STTP", "Webinar", "Quiz", "Resource Person", "Seminar"]);
  for (const type of activityTypes) {
    const matching = filterActivities(activities, type);
    assert.ok(matching.length > 0, `${type} has current records`);
    assert.ok(matching.every((activity) => activity.type === type), `${type} returns only exact matches`);
    assert.deepEqual(matching, activities.filter((activity) => activity.type === type));
  }
  assert.deepEqual(filterActivities([{ ...activities[0], type: "conference" }], "Conference"), []);
});

test("year groups with no matching activity are hidden and remaining years stay descending", () => {
  const years = [...new Set(activities.map((activity) => activity.year))]
    .sort((a, b) => Number(b) - Number(a));
  const only = filterActivities(activities, "Quiz");
  const groups = groupActivitiesByYear(only, years);
  assert.ok(groups.length > 0);
  assert.ok(groups.every((group) => group.activities.length > 0));
  assert.deepEqual(groups.map((group) => group.year),
    [...groups.map((group) => group.year)].sort((a, b) => Number(b) - Number(a)));
  assert.ok(groups.flatMap((group) => group.activities).every((activity) => activity.type === "Quiz"));
});

test("switching back to ALL restores every original record and display position", () => {
  const before = activities.map((activity) => `${activity.year}:${activity.title}`);
  filterActivities(activities, "FDP");
  const restored = filterActivities(activities, "ALL");
  assert.deepEqual(restored.map((activity) => `${activity.year}:${activity.title}`), before);
});

test("filtering and grouping do not mutate activity fields or within-year order", () => {
  const snapshot = JSON.stringify(activities);
  const selected = filterActivities(activities, "Workshop");
  const years = [...new Set(activities.map((activity) => activity.year))]
    .sort((a, b) => Number(b) - Number(a));
  const groups = groupActivitiesByYear(selected, years);
  assert.deepEqual(groups.flatMap((group) => group.activities), selected);
  assert.equal(JSON.stringify(activities), snapshot);
});
