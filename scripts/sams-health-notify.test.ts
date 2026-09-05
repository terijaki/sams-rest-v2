import { describe, expect, it } from "vite-plus/test";
import { buildHealthNotifyIssue, type HealthNotifyInput } from "./sams-health-notify";

const baseInput: HealthNotifyInput = {
  runUrl: "https://github.com/terijaki/sams-rest-v2/actions/runs/33943493787",
  date: "2026-09-05",
  hasDrift: false,
  hasFixed: false,
  fixedBugIds: [],
  checkFailedIds: [],
  regenFailed: false,
  failureStep: "",
  swaggerJobFailed: false,
  bugCheckJobFailed: false,
  regenJobFailed: false,
  prDriftJobFailed: false,
  driftPrUrl: "",
  driftSummaryMarkdown: "",
};

describe("buildHealthNotifyIssue", () => {
  it("does not blame a missing API key or invent still-present results when probes fail", () => {
    const issue = buildHealthNotifyIssue({
      ...baseInput,
      bugCheckJobFailed: true,
    });

    expect(issue.title).toContain("❌ bug check failed");
    expect(issue.body).toContain("Health: bug probes");
    expect(issue.body).toContain("SAMS_API_KEY: ***");
    expect(issue.body).not.toContain("Confirm that `SAMS_API_KEY` is set as a repository secret");
    expect(issue.body).not.toContain("⚠️ Still present");
    expect(issue.body).not.toContain("| # | Slug | Bug | Status |");
  });

  it("includes probe results when bugs were fixed", () => {
    const issue = buildHealthNotifyIssue({
      ...baseInput,
      hasFixed: true,
      fixedBugIds: [4],
    });

    expect(issue.title).toContain("✅ bugs fixed");
    expect(issue.body).toContain("| # | Slug | Bug | Status |");
    expect(issue.body).toContain("✅ Fixed");
    expect(issue.body).toContain("`accept-json-406`");
  });

  it("includes the still-present table when notifying for other successful jobs", () => {
    const issue = buildHealthNotifyIssue({
      ...baseInput,
      hasDrift: true,
      driftSummaryMarkdown: "- **changed** `foo.type`: `boolean` → `string`",
    });

    expect(issue.title).toContain("⚠️ swagger drift");
    expect(issue.body).toContain("⚠️ Still present");
    expect(issue.body).not.toContain("Bug Check Job Failed");
  });
});
