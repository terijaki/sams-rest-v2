import { beforeAll, describe, expect, it } from "vite-plus/test";
import { createSamsClient } from "../create-sams-client";
import { SAMS_DEFAULT_BASE_URL } from "../constants";
import { assertTeamRosterHasMembers } from "../test-support/assert-team-roster";
import { LIVE_FIXTURES } from "../test-support/live-fixtures";

function requireSamsApiKey(): string {
  const apiKey = process.env.SAMS_API_KEY;
  if (!apiKey) {
    throw new Error("SAMS_API_KEY is not set. Live smoke test requires a key.");
  }
  return apiKey;
}

describe("SAMS smoke (live)", () => {
  let sams: ReturnType<typeof createSamsClient>;
  const capturedHeaders: Record<string, string> = {};

  beforeAll(() => {
    const fetchSpy = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const request = new Request(input, init);
      request.headers.forEach((value, key) => {
        capturedHeaders[key.toLowerCase()] = value;
      });
      return fetch(input, init);
    };

    sams = createSamsClient({
      baseUrl: SAMS_DEFAULT_BASE_URL,
      apiKey: requireSamsApiKey(),
      fetch: fetchSpy,
    });
  });

  it("getAllSeasons is public", async () => {
    const seasonsResult = await sams.getAllSeasons();
    expect(seasonsResult.response?.status).not.toBe(403);
    expect(seasonsResult.error).toBeUndefined();
    expect(capturedHeaders.accept).toBe("*/*");
    expect(capturedHeaders["x-api-key"]).toBeTruthy();
  }, 30_000);

  it("getTeamByUuid returns fixture team", async () => {
    const teamResult = await sams.getTeamByUuid({ path: { uuid: LIVE_FIXTURES.teamUuid } });
    expect(teamResult.response?.status).not.toBe(403);
    expect(teamResult.error).toBeUndefined();
    expect(teamResult.data?.uuid).toBe(LIVE_FIXTURES.teamUuid);
  }, 30_000);

  it("getTeamRosterByTeamUuid returns players for fixture team", async () => {
    const rosterResult = await sams.getTeamRosterByTeamUuid({
      path: { uuid: LIVE_FIXTURES.teamUuid },
    });
    expect(rosterResult.response?.status).not.toBe(403);
    expect(rosterResult.error).toBeUndefined();
    expect(rosterResult.data).toBeDefined();
    assertTeamRosterHasMembers(rosterResult.data!);
    expect(rosterResult.data?.players?.length ?? 0).toBeGreaterThan(0);
  }, 30_000);
});
