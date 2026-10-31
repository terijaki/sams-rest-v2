import { describe, expect, it } from "vite-plus/test";
import {
  duplicateHealthIssues,
  healthIssueLabels,
  isSamsHealthTrackerIssue,
  pickCanonicalHealthIssue,
  type GitHubIssueListItem,
} from "./sams-health-github";

function issue(number: number, title: string, labels: string[] = []): GitHubIssueListItem {
  return {
    number,
    title,
    state: "open",
    labels: labels.map((name) => ({ name })),
  };
}

describe("sams-health-github", () => {
  it("recognizes legacy title-only and labeled trackers", () => {
    expect(isSamsHealthTrackerIssue({ title: "[SAMS] ⚠️ swagger drift — 2026-10-03" })).toBe(true);
    expect(isSamsHealthTrackerIssue({ title: "Other", labels: [{ name: "sams-health" }] })).toBe(
      true,
    );
    expect(isSamsHealthTrackerIssue({ title: "Random issue" })).toBe(false);
  });

  it("adds swagger-drift label only when drift is reported", () => {
    expect(healthIssueLabels({ hasDrift: false })).toEqual(["sams-health"]);
    expect(healthIssueLabels({ hasDrift: true })).toEqual(["sams-health", "swagger-drift"]);
  });

  it("keeps the lowest-number open issue as canonical", () => {
    const canonical = pickCanonicalHealthIssue([
      issue(30, "[SAMS] drift — 2026-10-17"),
      issue(28, "[SAMS] drift — 2026-10-03"),
      issue(29, "[SAMS] drift · bugs — 2026-10-10"),
    ]);
    expect(canonical?.number).toBe(28);
  });

  it("lists other open SAMS issues as duplicates", () => {
    const duplicates = duplicateHealthIssues(
      [issue(28, "[SAMS] a"), issue(29, "[SAMS] b"), issue(30, "[SAMS] c")],
      28,
    );
    expect(duplicates.map((entry) => entry.number)).toEqual([29, 30]);
  });
});
