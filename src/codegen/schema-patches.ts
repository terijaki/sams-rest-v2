/**
 * OpenAPI schema patches applied before @hey-api/openapi-ts generates the client.
 *
 * Lifted from vcmuellheim `codegen/sams/generate-client.ts` (`parser.patch.schemas`).
 * These compensate for upstream SAMS spec/API mismatches; see docs/BUGS.md.
 *
 * When adding a patch for a newly discovered gap, include an inline comment with:
 *   - Bug # from docs/BUGS.md (add an entry there too)
 *   - `discovered YYYY-MM-DD` (date the live API / CI probe first surfaced it)
 *   - One line on spec vs actual behaviour
 *
 * Live probes: scripts/check-sams-bugs.ts (weekly CI + `vp run bugs`).
 */

export type SchemaObject = {
  properties?: Record<string, unknown>;
  required?: string[];
};

type SchemaPatch = (schema: SchemaObject) => void;

function asSchemaProperty(property: unknown): Record<string, unknown> | null {
  if (typeof property === "object" && property !== null) {
    return property as Record<string, unknown>;
  }
  return null;
}

function markAllPropertiesNullable(schema: SchemaObject): void {
  if (!schema.properties) return;
  for (const property of Object.values(schema.properties)) {
    const value = asSchemaProperty(property);
    if (value) value.nullable = true;
  }
}

function patchMatchDto(schema: SchemaObject): void {
  if (schema.properties) {
    schema.properties._embedded = {
      type: "object",
      properties: {
        team1: {
          type: "object",
          properties: {
            uuid: { type: "string" },
            name: { type: "string" },
            sportsclubUuid: { type: "string" },
          },
          required: ["uuid", "name", "sportsclubUuid"],
        },
        team2: {
          type: "object",
          properties: {
            uuid: { type: "string" },
            name: { type: "string" },
            sportsclubUuid: { type: "string" },
          },
          required: ["uuid", "name", "sportsclubUuid"],
        },
      },
    };
    for (const [key, property] of Object.entries(schema.properties)) {
      const value = asSchemaProperty(property);
      if (!value) continue;
      switch (key) {
        case "uuid":
          value.nullable = false;
          break;
        case "results":
        case "referees":
        case "location":
        case "team1Mvp":
        case "team2Mvp":
          // hey-api silently drops nullable:true when paired with $ref — wrap in allOf
          // so nullable:true is on a schema object (not a $ref), which the generator
          // correctly converts to z.union([zType, z.null()]).
          schema.properties[key] = { allOf: [property], nullable: true };
          break;
        default:
          value.nullable = true;
      }
    }
    schema.required = ["uuid"];
  }
  if (typeof schema.properties?.date === "object" && schema.properties.date !== null) {
    (schema.properties.date as { format?: string }).format = "date";
  }
}

/**
 * Named schema patches consumed by @hey-api/openapi-ts `parser.patch.schemas`.
 * Keep keys identical to upstream component schema names.
 */
export const schemaPatches: Record<string, SchemaPatch> = {
  // Match DTOs — discovered 2026-02-22 (docs/BUGS.md initial audit).
  // Bug #6: `date` is format date-time in spec but API returns YYYY-MM-DD (time is a separate field).
  // Bug #7: `referees`/`results`/`location`/MVPs use bare `$ref + nullable` (invalid OAS 3.0); API returns null.
  // `_embedded.team1/team2` are absent from upstream spec but present in live HAL responses.
  // NOTE: hey-api drops nullable on bare $ref — wrap in `{ allOf: [property], nullable: true }`.
  CompetitionMatchDto: patchMatchDto,
  LeagueMatchDto: patchMatchDto,
  RefereeTeamDto: markAllPropertiesNullable,
  Location: markAllPropertiesNullable,
  VolleyballMatchResultsDto: markAllPropertiesNullable,
  // Bug #3 (discovered 2026-02-22): pre-season `ballRatio`/`setRatio` can be the string "Infinity".
  LeagueRankingsEntryDto: (schema) => {
    if (!schema.properties) return;
    for (const [key, property] of Object.entries(schema.properties)) {
      const value = asSchemaProperty(property);
      if (!value) continue;
      switch (key) {
        case "uuid":
        case "rank":
          value.nullable = false;
          break;
        case "ballRatio":
        case "setRatio":
          value.nullable = true;
          value.additionalProperties = true;
          value.oneOf = [{ type: "number" }, { type: "string" }]; // pre-season values can be "Infinity"
          break;
        default:
          value.nullable = true;
      }
    }
  },
  Address: markAllPropertiesNullable,
  TeamDto: (schema) => {
    if (!schema.properties) return;
    for (const [key, property] of Object.entries(schema.properties)) {
      const value = asSchemaProperty(property);
      if (!value) continue;
      switch (key) {
        case "uuid":
        case "name":
          value.nullable = false;
          break;
        default:
          value.nullable = true;
      }
    }
  },
  // SAMS returns null (not omitted) for unset optional fields — discovered 2026-02-22 (roster probes).
  TeamPlayerDto: (schema) => {
    if (!schema.properties) return;
    for (const [key, property] of Object.entries(schema.properties)) {
      const value = asSchemaProperty(property);
      if (!value) continue;
      switch (key) {
        case "uuid":
        case "name":
          value.nullable = false;
          break;
        default:
          value.nullable = true;
      }
    }
  },
  TeamOfficialDto: (schema) => {
    if (!schema.properties) return;
    for (const [key, property] of Object.entries(schema.properties)) {
      const value = asSchemaProperty(property);
      if (!value) continue;
      switch (key) {
        case "uuid":
        case "name":
          value.nullable = false;
          break;
        default:
          value.nullable = true;
      }
    }
  },
  SportsclubDto: (schema) => {
    if (!schema.properties) return;
    schema.required = ["uuid", "name"];
    for (const [key, property] of Object.entries(schema.properties)) {
      const value = asSchemaProperty(property);
      if (!value) continue;
      switch (key) {
        case "uuid":
        case "name":
          value.nullable = false;
          break;
        default:
          value.nullable = true;
      }
    }
  },
  Association: (schema) => {
    if (!schema.properties) return;
    schema.required = ["uuid", "name"];
    for (const [key, property] of Object.entries(schema.properties)) {
      const value = asSchemaProperty(property);
      if (!value) continue;
      switch (key) {
        case "uuid":
        case "name":
          value.nullable = false;
          break;
        default:
          value.nullable = true;
      }
    }
  },
  // Bug #8 (discovered 2026-02-22): root nodes return `parentLeagueHierarchyUuid: null` but spec is non-null string.
  LeagueHierarchyDto: (schema) => {
    if (!schema.properties) return;
    for (const [key, property] of Object.entries(schema.properties)) {
      const value = asSchemaProperty(property);
      if (!value) continue;
      switch (key) {
        case "uuid":
          value.nullable = false;
          break;
        case "parentLeagueHierarchyUuid":
          value.nullable = true;
          break;
        default:
          break;
      }
    }
  },
  // Bug #9 (discovered 2026-08-27, PR #11 live CI `getAllCompetitions`): unset
  // `superCompetitionUuid` / `latestResultUpdate` / `latestStructuralUpdate` are null in responses
  // but upstream spec omits `nullable: true` → generated Zod rejects valid payloads.
  // Bug #10 (discovered 2026-08-27, PR #11 live CI `getAllSuperCompetitions`): `_embedded.sub_competitions`
  // is a JSON array; spec models `_embedded` values as objects (`additionalProperties: { type: object }`)
  // → generated Zod expects a record, not an array. Relax `_embedded` to accept any HAL shape.
  CompetitionDto: (schema) => {
    if (!schema.properties) return;
    schema.properties._embedded = {
      type: "object",
      additionalProperties: true,
    };
    for (const [key, property] of Object.entries(schema.properties)) {
      if (key === "_embedded") continue;
      const value = asSchemaProperty(property);
      if (!value) continue;
      switch (key) {
        case "uuid":
          value.nullable = false;
          break;
        case "superCompetitionUuid":
        case "latestResultUpdate":
        case "latestStructuralUpdate":
          value.nullable = true;
          break;
        default:
          value.nullable = true;
      }
    }
  },
  // Bug #9 + #10 — same CompetitionDto issues on super-competition list/detail (discovered 2026-08-27).
  SuperCompetitionDto: (schema) => {
    if (!schema.properties) return;
    schema.properties._embedded = {
      type: "object",
      additionalProperties: true,
    };
    for (const [key, property] of Object.entries(schema.properties)) {
      if (key === "_embedded") continue;
      const value = asSchemaProperty(property);
      if (!value) continue;
      switch (key) {
        case "uuid":
          value.nullable = false;
          break;
        case "superCompetitionUuid":
        case "latestResultUpdate":
        case "latestStructuralUpdate":
          value.nullable = true;
          break;
        default:
          value.nullable = true;
      }
    }
  },
  // Bug #9 (discovered 2026-08-27): `latestResultUpdate` / `latestStructuralUpdate` null when unset.
  LeagueDto: (schema) => {
    if (!schema.properties) return;
    for (const [key, property] of Object.entries(schema.properties)) {
      const value = asSchemaProperty(property);
      if (!value) continue;
      switch (key) {
        case "uuid":
          value.nullable = false;
          break;
        case "latestResultUpdate":
        case "latestStructuralUpdate":
          value.nullable = true;
          break;
        default:
          value.nullable = true;
      }
    }
  },
};
