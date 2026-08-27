import { describe, expect, it } from "vite-plus/test";
import { listSamsApiGraphOperations } from "./api-graph";
import { CONSUMER_SAMS_OPERATIONS } from "./consumer-endpoints";

describe("consumer SAMS endpoint coverage", () => {
  it("graph steps exercise every operation used by club site consumers", () => {
    const walked = listSamsApiGraphOperations();
    const missing = CONSUMER_SAMS_OPERATIONS.filter((operation) => !walked.includes(operation));

    expect(missing, `Add these to SAMS_API_GRAPH_STEPS: ${missing.join(", ")}`).toEqual([]);
  });

  it("includes team roster (players and officials) in the consumer manifest", () => {
    expect(CONSUMER_SAMS_OPERATIONS).toContain("getTeamRosterByTeamUuid");
  });
});
