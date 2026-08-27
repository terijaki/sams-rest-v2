import { describe, expect, it } from "vite-plus/test";
import {
  zCompetitionDto,
  zLeagueHierarchyDto,
  zLeagueMatchDto,
  zLeagueRankingsEntryDto,
  zSportsclubDto,
  zTeamDto,
} from "./generated/zod.gen";

describe("patched generated Zod schemas", () => {
  it("accepts a date-only match date and null referees/results", () => {
    const parsed = zLeagueMatchDto.parse({
      uuid: "match-1",
      date: "2025-10-04",
      time: "14:00",
      referees: null,
      results: null,
      location: null,
      team1Mvp: null,
      team2Mvp: null,
      _embedded: {
        team1: { uuid: "t1", name: "Home", sportsclubUuid: "c1" },
        team2: { uuid: "t2", name: "Guest", sportsclubUuid: "c2" },
      },
    });

    expect(parsed.uuid).toBe("match-1");
    expect(parsed.date).toBe("2025-10-04");
    expect(parsed.referees).toBeNull();
    expect(parsed.results).toBeNull();
  });

  it("accepts null parentLeagueHierarchyUuid on root nodes", () => {
    const parsed = zLeagueHierarchyDto.parse({
      uuid: "hierarchy-1",
      name: "Verbandsliga",
      parentLeagueHierarchyUuid: null,
    });
    expect(parsed.parentLeagueHierarchyUuid).toBeNull();
  });

  it("accepts pre-season Infinity ratio strings", () => {
    const parsed = zLeagueRankingsEntryDto.parse({
      uuid: "team-1",
      rank: 1,
      ballRatio: "Infinity",
      setRatio: "Infinity",
    });
    expect(parsed.ballRatio).toBe("Infinity");
    expect(parsed.setRatio).toBe("Infinity");
  });

  it("accepts null team logoImageForScreenOutputLink", () => {
    const parsed = zTeamDto.parse({
      uuid: "team-1",
      name: "VC Test 1",
      logoImageForScreenOutputLink: null,
      shortName: "",
      clubCode: "",
    });
    expect(parsed.logoImageForScreenOutputLink).toBeNull();
  });

  it("requires sportsclub uuid and name", () => {
    expect(() => zSportsclubDto.parse({ name: "VC Test" })).toThrow();
    expect(zSportsclubDto.parse({ uuid: "club-1", name: "VC Test", logo: null }).uuid).toBe(
      "club-1",
    );
  });

  it("accepts null superCompetitionUuid and latestResultUpdate on competitions", () => {
    const parsed = zCompetitionDto.parse({
      uuid: "competition-1",
      name: "Pokal",
      superCompetitionUuid: null,
      latestResultUpdate: null,
    });
    expect(parsed.superCompetitionUuid).toBeNull();
    expect(parsed.latestResultUpdate).toBeNull();
  });
});
