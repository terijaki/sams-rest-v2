import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { CONSUMER_SAMS_OPERATIONS } from "./consumer-endpoints";

function walkedOperationsFromGraphSource(): string[] {
  const graphSource = readFileSync(new URL("./api-graph.ts", import.meta.url), "utf8");
  return [...graphSource.matchAll(/sams\s*\.\s*(get[A-Za-z]+)\s*\(/g)].map((match) => match[1]);
}

describe("consumer SAMS endpoint coverage", () => {
  it("walkSamsApiGraph exercises every operation used by club site consumers", () => {
    const walked = walkedOperationsFromGraphSource();
    const missing = CONSUMER_SAMS_OPERATIONS.filter((operation) => !walked.includes(operation));

    expect(missing, `Add these to walkSamsApiGraph: ${missing.join(", ")}`).toEqual([]);
  });

  it("includes team roster (players and officials) in the consumer manifest", () => {
    expect(CONSUMER_SAMS_OPERATIONS).toContain("getTeamRosterByTeamUuid");
  });
});
