/**
 * OpenAPI schema patches applied before @hey-api/openapi-ts generates the client.
 *
 * Lifted from vcmuellheim `codegen/sams/generate-client.ts` (`parser.patch.schemas`).
 * These compensate for upstream SAMS spec/API mismatches; see docs/BUGS.md.
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
  // _embedded (team1/team2) is not in the upstream spec — injected here based on actual API responses.
  // results: null when no match has been played; referees: null when none assigned;
  // team1Mvp/team2Mvp: null when no MVP is assigned (typical for unplayed matches).
  //   NOTE: hey-api no longer respects nullable:true on $ref fields — must use explicit allOf+nullable instead.
  // date.format corrected to "date" (upstream uses "date-time" which generates wrong Zod type).
  CompetitionMatchDto: patchMatchDto,
  LeagueMatchDto: patchMatchDto,
  RefereeTeamDto: markAllPropertiesNullable,
  Location: markAllPropertiesNullable,
  VolleyballMatchResultsDto: markAllPropertiesNullable,
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
  // SAMS returns null (not omitted) for unset optional player/official fields.
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
          // Upstream may return null for root hierarchy nodes.
          value.nullable = true;
          break;
        default:
          break;
      }
    }
  },
};
