import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import type { BugProbeRun } from "../src/upstream/bug-probes";
import { formatBugCheckGithubOutput, formatBugCheckStepSummary } from "./sams-bug-check";

const sampleRun: BugProbeRun = {
  checkedAt: "2026-09-05T04:03:00.000Z",
  bugs: [
    {
      id: 2,
      slug: "team-logo-screen-null",
      summary: "logoImageForScreenOutputLink always null on GET /teams/{uuid}",
      status: "still_present",
    },
    {
      id: 4,
      slug: "accept-json-406",
      summary: "Accept: application/json returns HTTP 406 instead of 200",
      status: "fixed",
    },
    {
      id: 6,
      slug: "match-date-format",
      summary: "`date` declared as `date-time` but API returns YYYY-MM-DD",
      status: "check_failed",
    },
  ],
};

describe("bug-check GitHub Actions helpers", () => {
  it("writes has_fixed and id lists for job outputs", () => {
    const output = formatBugCheckGithubOutput(sampleRun);

    expect(output).toContain("has_fixed=true");
    expect(output).toContain("fixed_bug_ids=4");
    expect(output).toContain("check_failed_ids=6");
  });

  it("sets has_fixed=false when no probes are fixed", () => {
    const output = formatBugCheckGithubOutput({
      ...sampleRun,
      bugs: sampleRun.bugs.filter((bug) => bug.status !== "fixed"),
    });

    expect(output).toContain("has_fixed=false");
    expect(output).toContain("fixed_bug_ids=");
    expect(output).toContain("check_failed_ids=6");
  });

  it("formats a step summary table from probe results", () => {
    const summary = formatBugCheckStepSummary(sampleRun);

    expect(summary).toContain("## Bug check results");
    expect(summary).toContain("team-logo-screen-null");
    expect(summary).toContain("⚠️ Still present");
    expect(summary).toContain("✅ Fixed");
    expect(summary).toContain("❌ Check failed");
    expect(summary).toContain("2026-09-05T04:03:00.000Z");
  });
});

describe("weekly bug-check workflow", () => {
  it("does not redirect vp run bugs stdout into a JSON file", () => {
    const weekly = readFileSync(".github/workflows/weekly.yml", "utf8");

    expect(weekly).toContain("vp run bugs");
    expect(weekly).not.toContain("vp run bugs >");
    expect(weekly).not.toContain("bug-results.json");
    expect(weekly).toContain("steps.bugs.outputs.has_fixed");
  });

  it("documents that Vite+ stdout is not parseable JSON", () => {
    const weekly = readFileSync(".github/workflows/weekly.yml", "utf8");
    const checkScript = readFileSync("scripts/check-sams-bugs.ts", "utf8");

    expect(weekly).toContain("not valid JSON");
    expect(checkScript).toContain("GITHUB_OUTPUT");
  });
});

describe("vp run bugs stdout", () => {
  it("is not valid JSON when Vite+ prepends its command banner", () => {
    const banner = "$ bun ./scripts/check-sams-bugs.ts ⊘ cache disabled\n";
    const json = JSON.stringify({ bugs: [], checkedAt: sampleRun.checkedAt });

    expect(() => JSON.parse(banner + json)).toThrow(/Unexpected token/);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
