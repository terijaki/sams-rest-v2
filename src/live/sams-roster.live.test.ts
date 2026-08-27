import { beforeAll, describe, expect, it } from "vite-plus/test";
import { createSamsClient } from "../create-sams-client";
import { SAMS_DEFAULT_BASE_URL } from "../constants";
import {
  assertTeamRosterHasMembers,
  assertTeamRosterStructure,
} from "../test-support/assert-team-roster";
import { LIVE_FIXTURES } from "../test-support/live-fixtures";

function requireSamsApiKey(): string {
  const apiKey = process.env.SAMS_API_KEY;
  if (!apiKey) {
    throw new Error("SAMS_API_KEY is not set. Live roster test requires a key.");
  }
  return apiKey;
}

describe("SAMS team roster (live fixture)", () => {
  let sams: ReturnType<typeof createSamsClient>;

  beforeAll(() => {
    sams = createSamsClient({
      baseUrl: SAMS_DEFAULT_BASE_URL,
      apiKey: requireSamsApiKey(),
      throwOnError: true,
    });
  });

  it("getTeamRosterByTeamUuid returns a roster document", async () => {
    const { data: roster } = await sams.getTeamRosterByTeamUuid({
      path: { uuid: LIVE_FIXTURES.teamUuid },
    });
    expect(roster).toBeDefined();
    assertTeamRosterStructure(roster!);
    assertTeamRosterHasMembers(roster!);
  }, 30_000);

  it("getTeamRosterByTeamUuid players have uuid and name", async () => {
    const { data: roster } = await sams.getTeamRosterByTeamUuid({
      path: { uuid: LIVE_FIXTURES.teamUuid },
    });
    const players = roster?.players ?? [];
    expect(players.length).toBeGreaterThan(0);
    expect(players.every((player) => player.uuid && player.name?.trim())).toBe(true);
  }, 30_000);
});
