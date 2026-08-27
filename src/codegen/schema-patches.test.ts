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

  it("covers the same schema names as vcmuellheim generate-client.ts", () => {
    expect(Object.keys(schemaPatches).sort()).toEqual(
      [
        "Address",
        "Association",
        "CompetitionDto",
        "CompetitionMatchDto",
        "LeagueDto",
        "LeagueHierarchyDto",
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
