import { describe, expect, it } from "vite-plus/test";
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

describe("live SAMS team roster", () => {
  it("returns players and officials for the fixture team", async () => {
    const sams = createSamsClient({
      baseUrl: SAMS_DEFAULT_BASE_URL,
      apiKey: requireSamsApiKey(),
      throwOnError: true,
    });

    const { data: roster } = await sams.getTeamRosterByTeamUuid({
      path: { uuid: LIVE_FIXTURES.teamUuid },
    });

    expect(roster).toBeDefined();
    assertTeamRosterStructure(roster!);
    assertTeamRosterHasMembers(roster!);

    const players = roster!.players ?? [];
    expect(players.length).toBeGreaterThan(0);
    expect(players.every((player) => player.uuid && player.name?.trim())).toBe(true);

    for (const player of players) {
      expect(player).toEqual(
        expect.objectContaining({
          uuid: expect.any(String),
          name: expect.any(String),
        }),
      );
    }
  }, 30_000);
});
