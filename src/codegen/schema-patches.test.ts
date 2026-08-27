import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { schemaPatches, type SchemaObject } from "./schema-patches";

type PatchableSchema = SchemaObject & {
  properties: Record<string, Record<string, unknown>>;
};

describe("schemaPatches", () => {
  it("patches match DTO date format to date and wraps $ref fields in allOf+nullable", () => {
    const schema: PatchableSchema = {
      properties: {
        uuid: { type: "string" },
        date: { type: "string", format: "date-time" },
        results: { $ref: "#/components/schemas/VolleyballMatchResultsDto" },
        referees: { $ref: "#/components/schemas/RefereeTeamDto" },
        location: { $ref: "#/components/schemas/Location" },
        team1Mvp: { $ref: "#/components/schemas/PlayerDto" },
        team2Mvp: { $ref: "#/components/schemas/PlayerDto" },
        name: { type: "string" },
      },
    };

    schemaPatches.LeagueMatchDto(schema);

    expect(schema.properties.date.format).toBe("date");
    expect(schema.required).toEqual(["uuid"]);
    expect(schema.properties.uuid.nullable).toBe(false);
    expect(schema.properties.name.nullable).toBe(true);
    expect(schema.properties.results).toEqual({
      allOf: [{ $ref: "#/components/schemas/VolleyballMatchResultsDto" }],
      nullable: true,
    });
    expect(schema.properties.referees).toEqual({
      allOf: [{ $ref: "#/components/schemas/RefereeTeamDto" }],
      nullable: true,
    });
    expect(schema.properties._embedded).toMatchObject({
      type: "object",
      properties: {
        team1: { required: ["uuid", "name", "sportsclubUuid"] },
        team2: { required: ["uuid", "name", "sportsclubUuid"] },
      },
    });

    const competitionSchema: PatchableSchema = {
      properties: {
        uuid: { type: "string" },
        date: { type: "string", format: "date-time" },
        results: { $ref: "#/components/schemas/VolleyballMatchResultsDto" },
      },
    };
    schemaPatches.CompetitionMatchDto(competitionSchema);
    expect(competitionSchema.properties.date.format).toBe("date");
    expect(competitionSchema.properties.results).toEqual({
      allOf: [{ $ref: "#/components/schemas/VolleyballMatchResultsDto" }],
      nullable: true,
    });
  });

  it("allows LeagueRankingsEntryDto ratios to be number or Infinity string", () => {
    const schema: PatchableSchema = {
      properties: {
        uuid: { type: "string" },
        rank: { type: "integer" },
        ballRatio: { type: "number" },
        setRatio: { type: "number" },
        points: { type: "integer" },
      },
    };

    schemaPatches.LeagueRankingsEntryDto(schema);

    expect(schema.properties.uuid.nullable).toBe(false);
    expect(schema.properties.rank.nullable).toBe(false);
    expect(schema.properties.ballRatio.oneOf).toEqual([{ type: "number" }, { type: "string" }]);
    expect(schema.properties.setRatio.nullable).toBe(true);
    expect(schema.properties.points.nullable).toBe(true);
  });

  it("makes SportsclubDto uuid and name required and non-null", () => {
    const schema: PatchableSchema = {
      properties: {
        uuid: { type: "string" },
        name: { type: "string" },
        logo: { type: "string" },
      },
    };

    schemaPatches.SportsclubDto(schema);

    expect(schema.required).toEqual(["uuid", "name"]);
    expect(schema.properties.uuid.nullable).toBe(false);
    expect(schema.properties.name.nullable).toBe(false);
    expect(schema.properties.logo.nullable).toBe(true);
  });

  it("marks LeagueHierarchyDto.parentLeagueHierarchyUuid nullable", () => {
    const schema: PatchableSchema = {
      properties: {
        uuid: { type: "string" },
        parentLeagueHierarchyUuid: { type: "string" },
      },
    };

    schemaPatches.LeagueHierarchyDto(schema);

    expect(schema.properties.uuid.nullable).toBe(false);
    expect(schema.properties.parentLeagueHierarchyUuid.nullable).toBe(true);
  });

  it("relaxes CompetitionDto and SuperCompetitionDto _embedded and nullable timestamp fields", () => {
    const competitionSchema: PatchableSchema = {
      properties: {
        uuid: { type: "string" },
        _embedded: {
          type: "object",
          additionalProperties: { type: "object" },
        },
        superCompetitionUuid: { type: "string" },
        latestResultUpdate: { type: "string", format: "date-time" },
        latestStructuralUpdate: { type: "string", format: "date-time" },
        name: { type: "string" },
      },
    };

    schemaPatches.CompetitionDto(competitionSchema);

    expect(competitionSchema.properties._embedded).toEqual({
      type: "object",
      additionalProperties: true,
    });
    expect(competitionSchema.properties.superCompetitionUuid.nullable).toBe(true);
    expect(competitionSchema.properties.latestResultUpdate.nullable).toBe(true);
    expect(competitionSchema.properties.latestStructuralUpdate.nullable).toBe(true);

    const superSchema: PatchableSchema = {
      properties: {
        uuid: { type: "string" },
        _embedded: {
          type: "object",
          additionalProperties: { type: "object" },
        },
        latestResultUpdate: { type: "string", format: "date-time" },
      },
    };

    schemaPatches.SuperCompetitionDto(superSchema);

    expect(superSchema.properties._embedded).toEqual({
      type: "object",
      additionalProperties: true,
    });
    expect(superSchema.properties.latestResultUpdate.nullable).toBe(true);
  });

  it("marks LeagueDto latest update fields nullable (competition-null-timestamps)", () => {
    const schema: PatchableSchema = {
      properties: {
        uuid: { type: "string" },
        latestResultUpdate: { type: "string", format: "date-time" },
        latestStructuralUpdate: { type: "string", format: "date-time" },
        name: { type: "string" },
      },
    };

    schemaPatches.LeagueDto(schema);

    expect(schema.properties.uuid.nullable).toBe(false);
    expect(schema.properties.latestResultUpdate.nullable).toBe(true);
    expect(schema.properties.latestStructuralUpdate.nullable).toBe(true);
    expect(schema.properties.name.nullable).toBe(true);
  });

  it("patches LeagueMatchDayDto matchdate format to date (matchday-date-format)", () => {
    const schema: PatchableSchema = {
      properties: {
        uuid: { type: "string" },
        matchdate: { type: "string", format: "date-time" },
        name: { type: "string" },
      },
    };

    schemaPatches.LeagueMatchDayDto(schema);

    expect(schema.properties.matchdate.format).toBe("date");
    expect(schema.properties.matchdate.nullable).toBe(true);
    expect(schema.properties.uuid.nullable).toBe(false);
    expect(schema.properties.name.nullable).toBe(true);
  });

  it("lists every patched schema name", () => {
    expect(Object.keys(schemaPatches).sort()).toEqual(
      [
        "Address",
        "Association",
        "CompetitionDto",
        "CompetitionMatchDto",
        "LeagueDto",
        "LeagueHierarchyDto",
        "LeagueMatchDayDto",
        "LeagueMatchDto",
        "LeagueRankingsEntryDto",
        "Location",
        "RefereeTeamDto",
        "SportsclubDto",
        "SuperCompetitionDto",
        "TeamDto",
        "TeamOfficialDto",
        "TeamPlayerDto",
        "VolleyballMatchResultsDto",
      ].sort(),
    );
  });
});

describe("generate-client.ts", () => {
  it("fetches the public swagger URL and does not reference SAMS_API_KEY as a request header", () => {
    const source = readFileSync(
      new URL("../../scripts/generate-client.ts", import.meta.url),
      "utf8",
    );
    expect(source).toContain("SAMS_SWAGGER_URL");
    expect(source).toContain("delete process.env.SAMS_API_KEY");
    expect(source).not.toMatch(/headers:[\s\S]{0,200}X-API-Key/);
    expect(source).not.toMatch(/Authorization/);
  });
});
