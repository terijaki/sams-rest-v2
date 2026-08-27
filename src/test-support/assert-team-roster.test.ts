import { describe, expect, it } from "vite-plus/test";
import { assertTeamRosterHasMembers, assertTeamRosterStructure } from "./assert-team-roster";

describe("assertTeamRosterStructure", () => {
  it("accepts players and officials with uuid and name", () => {
    expect(() =>
      assertTeamRosterStructure({
        players: [
          {
            uuid: "player-1",
            name: "Max Mustermann",
            jerseyNumber: 7,
            position: null,
            portraitImageLink: null,
          },
        ],
        officials: [{ uuid: "official-1", name: "Coach Test", role: "headCoach" }],
      }),
    ).not.toThrow();
  });

  it("rejects players without a name", () => {
    expect(() =>
      assertTeamRosterStructure({
        players: [{ uuid: "player-1", name: "   " }],
      }),
    ).toThrow(/missing name/);
  });

  it("requires at least one player or official for hasMembers", () => {
    expect(() => assertTeamRosterHasMembers({ players: [], officials: [] })).toThrow(
      /no players or officials/,
    );
  });
});
