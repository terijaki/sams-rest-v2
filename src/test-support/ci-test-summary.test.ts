import { describe, expect, it } from "vite-plus/test";
import {
  extractGraphEndpointResults,
  extractLiveSmokeResults,
  formatLiveCiSummaryMarkdown,
  formatUnitCiSummaryMarkdown,
  type VitestReport,
} from "./ci-test-summary";

const sampleReport: VitestReport = {
  numTotalTests: 4,
  numPassedTests: 4,
  numFailedTests: 0,
  testResults: [
    {
      name: "src/msw/sams-client.msw.test.ts",
      assertionResults: [
        {
          ancestorTitles: ["createSamsClient against MSW", "SAMS API graph"],
          title: "getAllSeasons",
          status: "passed",
        },
        {
          ancestorTitles: ["createSamsClient against MSW", "SAMS API graph"],
          title: "getTeamRosterByTeamUuid",
          status: "passed",
        },
        {
          ancestorTitles: ["createSamsClient against MSW"],
          title: "getTeamByUuid returns error instead of throwing when throwOnError is false",
          status: "passed",
        },
      ],
    },
    {
      name: "src/live/sams-smoke.live.test.ts",
      assertionResults: [
        {
          ancestorTitles: ["SAMS smoke (live)"],
          title: "getAllSeasons is public",
          status: "passed",
        },
      ],
    },
  ],
};

describe("ci-test-summary", () => {
  it("extracts graph endpoint cases by suite title", () => {
    expect(extractGraphEndpointResults(sampleReport)).toEqual([
      { name: "getAllSeasons", status: "passed", suite: "SAMS API graph" },
      { name: "getTeamRosterByTeamUuid", status: "passed", suite: "SAMS API graph" },
    ]);
  });

  it("extracts live smoke endpoint cases", () => {
    expect(extractLiveSmokeResults(sampleReport)).toEqual([
      { name: "getAllSeasons is public", status: "passed", suite: "SAMS smoke (live)" },
    ]);
  });

  it("formats unit summary with endpoint table and baseline list", () => {
    const markdown = formatUnitCiSummaryMarkdown(sampleReport);
    expect(markdown).toContain("## Test summary");
    expect(markdown).toContain("**4/4 passed**");
    expect(markdown).toContain("| `getAllSeasons` | ✅ passed |");
    expect(markdown).toContain("`getTeamRosterByTeamUuid`");
    expect(markdown).toContain("### Baseline operations");
  });

  it("formats live summary with graph and smoke sections", () => {
    const markdown = formatLiveCiSummaryMarkdown(sampleReport);
    expect(markdown).toContain("## Live API test summary");
    expect(markdown).toContain("### SAMS API graph — production");
    expect(markdown).toContain("### Smoke & fixture checks");
  });
});
