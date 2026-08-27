import { describe, expect, it } from "vite-plus/test";
import { listSamsApiGraphOperations } from "./api-graph";
import { BASELINE_SAMS_OPERATIONS } from "./baseline-endpoints";

describe("baseline SAMS endpoint coverage", () => {
  it("graph steps exercise every baseline operation", () => {
    const walked = listSamsApiGraphOperations();
    const missing = BASELINE_SAMS_OPERATIONS.filter((operation) => !walked.includes(operation));

    expect(missing, `Add these to SAMS_API_GRAPH_STEPS: ${missing.join(", ")}`).toEqual([]);
  });

  it("includes team roster in the baseline", () => {
    expect(BASELINE_SAMS_OPERATIONS).toContain("getTeamRosterByTeamUuid");
  });
});
