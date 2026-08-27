import { SAMS_DEFAULT_BASE_URL } from "../constants";
import { LIVE_FIXTURES } from "../test-support/live-fixtures";
import { PROBED_UPSTREAM_BUGS, UPSTREAM_BUG_BY_SLUG, type UpstreamBugSlug } from "./bugs";

const BASE_URL = SAMS_DEFAULT_BASE_URL;

const NULLABLE_COMPETITION_FIELDS = [
  "superCompetitionUuid",
  "latestResultUpdate",
  "latestStructuralUpdate",
] as const;

export type BugProbeStatus = "still_present" | "fixed" | "check_failed";

export type BugProbeResult = {
  id: number;
  slug: UpstreamBugSlug;
  summary: string;
  status: BugProbeStatus;
  detail?: string;
};

export type BugProbeRun = {
  bugs: BugProbeResult[];
  checkedAt: string;
};

type BugProbe = (apiKey: string) => Promise<BugProbeResult>;

function bugResult(slug: UpstreamBugSlug, status: BugProbeStatus, detail?: string): BugProbeResult {
  const bug = UPSTREAM_BUG_BY_SLUG[slug];
  return { id: bug.id, slug: bug.slug, summary: bug.summary, status, detail };
}

async function samsGet(
  path: string,
  apiKey: string,
  overrideHeaders?: HeadersInit,
): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: "*/*",
      "X-API-Key": apiKey,
      ...overrideHeaders,
    },
  });
}

async function fetchSwaggerSpec(): Promise<Record<string, unknown> | null> {
  const specRes = await fetch(`${BASE_URL}/swagger.json`, { headers: { Accept: "*/*" } });
  if (!specRes.ok) return null;
  return (await specRes.json()) as Record<string, unknown>;
}

async function getCurrentSeasonUuid(apiKey: string): Promise<string | null> {
  const seasonRes = await samsGet("/seasons", apiKey);
  if (!seasonRes.ok) return null;
  const seasons = (await seasonRes.json()) as Array<{ uuid?: string; currentSeason?: boolean }>;
  return seasons.find((season) => season.currentSeason)?.uuid ?? null;
}

function specFieldAllowsNull(field: unknown): boolean {
  if (typeof field !== "object" || field === null) return false;
  const value = field as { nullable?: boolean; oneOf?: unknown; anyOf?: unknown };
  return value.nullable === true || Array.isArray(value.oneOf) || Array.isArray(value.anyOf);
}

function schemaProperties(
  spec: Record<string, unknown>,
  schemaName: string,
): Record<string, unknown> | undefined {
  const components = spec.components as
    | { schemas?: Record<string, { properties?: Record<string, unknown> }> }
    | undefined;
  return components?.schemas?.[schemaName]?.properties;
}

const bugProbes: Partial<Record<UpstreamBugSlug, BugProbe>> = {
  "team-logo-screen-null": async (apiKey) => {
    try {
      const res = await samsGet(`/teams/${LIVE_FIXTURES.teamUuid}`, apiKey);
      if (!res.ok) {
        return bugResult("team-logo-screen-null", "check_failed", `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { logoImageForScreenOutputLink?: string | null };
      const isFixed =
        data.logoImageForScreenOutputLink !== null &&
        data.logoImageForScreenOutputLink !== undefined;
      return bugResult("team-logo-screen-null", isFixed ? "fixed" : "still_present");
    } catch (error) {
      return bugResult("team-logo-screen-null", "check_failed", String(error));
    }
  },

  "rankings-score-including-losses-null": async (apiKey) => {
    try {
      const res = await samsGet(`/leagues/${LIVE_FIXTURES.leagueUuid}/rankings`, apiKey);
      if (!res.ok) {
        return bugResult(
          "rankings-score-including-losses-null",
          "check_failed",
          `HTTP ${res.status}`,
        );
      }
      const data = (await res.json()) as
        | { content?: Array<{ scoreIncludingLosses: unknown }> }
        | Array<{ scoreIncludingLosses: unknown }>;
      const entries = Array.isArray(data) ? data : (data.content ?? []);
      const isFixed = entries.some(
        (entry) => entry.scoreIncludingLosses !== null && entry.scoreIncludingLosses !== undefined,
      );
      return bugResult("rankings-score-including-losses-null", isFixed ? "fixed" : "still_present");
    } catch (error) {
      return bugResult("rankings-score-including-losses-null", "check_failed", String(error));
    }
  },

  "accept-json-406": async () => {
    try {
      const res = await fetch(`${BASE_URL}/seasons`, {
        headers: { Accept: "application/json" },
      });
      return bugResult(
        "accept-json-406",
        res.status === 200 ? "fixed" : "still_present",
        res.status === 200 ? undefined : `Status: ${res.status}`,
      );
    } catch (error) {
      return bugResult("accept-json-406", "check_failed", String(error));
    }
  },

  "team-empty-string-nullables": async (apiKey) => {
    try {
      const res = await samsGet(`/teams/${LIVE_FIXTURES.teamUuid}`, apiKey);
      if (!res.ok) {
        return bugResult("team-empty-string-nullables", "check_failed", `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { shortName?: string | null; clubCode?: string | null };
      const bugPresent = data.shortName === "" || data.clubCode === "";
      return bugResult("team-empty-string-nullables", bugPresent ? "still_present" : "fixed");
    } catch (error) {
      return bugResult("team-empty-string-nullables", "check_failed", String(error));
    }
  },

  "match-date-format": async (apiKey) => {
    try {
      const mdRes = await samsGet(`/leagues/${LIVE_FIXTURES.leagueUuid}/match-days?size=1`, apiKey);
      if (!mdRes.ok) {
        return bugResult(
          "match-date-format",
          "check_failed",
          `HTTP ${mdRes.status} fetching match-days`,
        );
      }
      const mdData = (await mdRes.json()) as { content?: Array<{ uuid: string }> };
      const matchDayUuid = mdData.content?.[0]?.uuid;
      if (!matchDayUuid) {
        return bugResult("match-date-format", "check_failed", "No match-day found");
      }
      const matchRes = await samsGet(`/match-days/${matchDayUuid}/league-matches?size=1`, apiKey);
      if (!matchRes.ok) {
        return bugResult(
          "match-date-format",
          "check_failed",
          `HTTP ${matchRes.status} fetching matches`,
        );
      }
      const matchData = (await matchRes.json()) as { content?: Array<{ date?: string }> };
      const date = matchData.content?.[0]?.date;
      if (!date) {
        return bugResult("match-date-format", "check_failed", "No match found");
      }
      return bugResult("match-date-format", !date.includes("T") ? "still_present" : "fixed");
    } catch (error) {
      return bugResult("match-date-format", "check_failed", String(error));
    }
  },

  "match-ref-results-nullable-ref": async (apiKey) => {
    try {
      const specRes = await fetch(`${BASE_URL}/swagger.json`, { headers: { Accept: "*/*" } });
      if (!specRes.ok) {
        return bugResult(
          "match-ref-results-nullable-ref",
          "check_failed",
          `HTTP ${specRes.status} fetching swagger.json`,
        );
      }
      const spec = (await specRes.json()) as {
        components?: {
          schemas?: {
            LeagueMatchDto?: { properties?: { referees?: { $ref?: string; allOf?: unknown } } };
          };
        };
      };
      const refereesSpec = spec.components?.schemas?.LeagueMatchDto?.properties?.referees;
      const specFixed = !refereesSpec?.$ref && refereesSpec?.allOf !== undefined;

      const matchRes = await samsGet(
        `/league-matches?size=20&for-league=${LIVE_FIXTURES.leagueUuid}`,
        apiKey,
      );
      if (!matchRes.ok) {
        return bugResult(
          "match-ref-results-nullable-ref",
          "check_failed",
          `HTTP ${matchRes.status} fetching league matches`,
        );
      }
      const matchData = (await matchRes.json()) as {
        content?: Array<{ referees?: unknown; results?: unknown }>;
      };
      const hasNullField =
        matchData.content?.some((match) => match.referees === null || match.results === null) ??
        false;
      const bugPresent = !specFixed || hasNullField;
      const detail = [
        !specFixed ? "spec still uses bare $ref + nullable" : null,
        hasNullField ? "API returns null for referees/results" : null,
      ]
        .filter(Boolean)
        .join("; ");
      return bugResult(
        "match-ref-results-nullable-ref",
        bugPresent ? "still_present" : "fixed",
        detail || undefined,
      );
    } catch (error) {
      return bugResult("match-ref-results-nullable-ref", "check_failed", String(error));
    }
  },

  "hierarchy-parent-null": async (apiKey) => {
    try {
      const spec = await fetchSwaggerSpec();
      if (!spec) {
        return bugResult("hierarchy-parent-null", "check_failed", "Failed to fetch swagger.json");
      }
      const parentField = schemaProperties(spec, "LeagueHierarchyDto")?.parentLeagueHierarchyUuid;
      const specDeclaresNullable = specFieldAllowsNull(parentField);
      const currentSeasonUuid = await getCurrentSeasonUuid(apiKey);
      if (!currentSeasonUuid) {
        return bugResult("hierarchy-parent-null", "check_failed", "Current season not found");
      }
      const hierarchyRes = await samsGet(
        `/league-hierarchies?for-season=${currentSeasonUuid}&size=100`,
        apiKey,
      );
      if (!hierarchyRes.ok) {
        return bugResult(
          "hierarchy-parent-null",
          "check_failed",
          `HTTP ${hierarchyRes.status} fetching league-hierarchies`,
        );
      }
      const hierarchyData = (await hierarchyRes.json()) as {
        content?: Array<{ parentLeagueHierarchyUuid?: string | null }>;
      };
      const apiReturnsNullParent =
        hierarchyData.content?.some((entry) => entry.parentLeagueHierarchyUuid === null) ?? false;
      const bugPresent = !specDeclaresNullable && apiReturnsNullParent;
      const detail = [
        !specDeclaresNullable ? "spec still declares non-null string" : null,
        apiReturnsNullParent ? "API returns null parentLeagueHierarchyUuid" : null,
      ]
        .filter(Boolean)
        .join("; ");
      return bugResult(
        "hierarchy-parent-null",
        bugPresent ? "still_present" : "fixed",
        detail || undefined,
      );
    } catch (error) {
      return bugResult("hierarchy-parent-null", "check_failed", String(error));
    }
  },

  "competition-null-timestamps": async (apiKey) => {
    try {
      const spec = await fetchSwaggerSpec();
      if (!spec) {
        return bugResult(
          "competition-null-timestamps",
          "check_failed",
          "Failed to fetch swagger.json",
        );
      }
      const specOmitsNullable = ["CompetitionDto", "LeagueDto", "SuperCompetitionDto"].some(
        (schemaName) => {
          const properties = schemaProperties(spec, schemaName);
          if (!properties) return false;
          return NULLABLE_COMPETITION_FIELDS.some(
            (field) => properties[field] !== undefined && !specFieldAllowsNull(properties[field]),
          );
        },
      );
      const currentSeasonUuid = await getCurrentSeasonUuid(apiKey);
      if (!currentSeasonUuid) {
        return bugResult("competition-null-timestamps", "check_failed", "Current season not found");
      }
      const [competitionsRes, leagueRes, superCompetitionsRes] = await Promise.all([
        samsGet(`/competitions?size=50&season=${currentSeasonUuid}`, apiKey),
        samsGet(`/leagues/${LIVE_FIXTURES.leagueUuid}`, apiKey),
        samsGet(`/super-competitions?size=50&season=${currentSeasonUuid}`, apiKey),
      ]);
      if (!competitionsRes.ok) {
        return bugResult(
          "competition-null-timestamps",
          "check_failed",
          `HTTP ${competitionsRes.status} fetching competitions`,
        );
      }
      if (!leagueRes.ok) {
        return bugResult(
          "competition-null-timestamps",
          "check_failed",
          `HTTP ${leagueRes.status} fetching league`,
        );
      }
      if (!superCompetitionsRes.ok) {
        return bugResult(
          "competition-null-timestamps",
          "check_failed",
          `HTTP ${superCompetitionsRes.status} fetching super-competitions`,
        );
      }
      const competitionsData = (await competitionsRes.json()) as {
        content?: Array<Record<string, unknown>>;
      };
      const leagueData = (await leagueRes.json()) as Record<string, unknown>;
      const superCompetitionsData = (await superCompetitionsRes.json()) as {
        content?: Array<Record<string, unknown>>;
      };
      const payloads = [
        ...(competitionsData.content ?? []),
        leagueData,
        ...(superCompetitionsData.content ?? []),
      ];
      const apiReturnsNull = payloads.some((entry) =>
        NULLABLE_COMPETITION_FIELDS.some((field) => entry[field] === null),
      );
      const bugPresent = specOmitsNullable && apiReturnsNull;
      const detail = [
        specOmitsNullable ? "spec still omits nullable on timestamp/uuid fields" : null,
        apiReturnsNull ? "API returns null for unset fields" : null,
      ]
        .filter(Boolean)
        .join("; ");
      return bugResult(
        "competition-null-timestamps",
        bugPresent ? "still_present" : "fixed",
        detail || undefined,
      );
    } catch (error) {
      return bugResult("competition-null-timestamps", "check_failed", String(error));
    }
  },

  "embedded-sub-competitions-array": async (apiKey) => {
    try {
      const spec = await fetchSwaggerSpec();
      if (!spec) {
        return bugResult(
          "embedded-sub-competitions-array",
          "check_failed",
          "Failed to fetch swagger.json",
        );
      }
      const embeddedSpec = schemaProperties(spec, "SuperCompetitionDto")?._embedded as
        | { additionalProperties?: { type?: string } }
        | undefined;
      const specExpectsObjectValues = embeddedSpec?.additionalProperties?.type === "object";
      const currentSeasonUuid = await getCurrentSeasonUuid(apiKey);
      if (!currentSeasonUuid) {
        return bugResult(
          "embedded-sub-competitions-array",
          "check_failed",
          "Current season not found",
        );
      }
      const superCompetitionsRes = await samsGet(
        `/super-competitions?size=50&season=${currentSeasonUuid}`,
        apiKey,
      );
      if (!superCompetitionsRes.ok) {
        return bugResult(
          "embedded-sub-competitions-array",
          "check_failed",
          `HTTP ${superCompetitionsRes.status} fetching super-competitions`,
        );
      }
      const superCompetitionsData = (await superCompetitionsRes.json()) as {
        content?: Array<{ _embedded?: Record<string, unknown> }>;
      };
      const apiReturnsArray = superCompetitionsData.content?.some((entry) => {
        const embedded = entry._embedded;
        if (!embedded || typeof embedded !== "object") return false;
        return Object.values(embedded).some((value) => Array.isArray(value));
      });
      const bugPresent = specExpectsObjectValues && Boolean(apiReturnsArray);
      const detail = [
        specExpectsObjectValues ? "spec still models _embedded values as objects" : null,
        apiReturnsArray ? "API returns array under _embedded" : null,
      ]
        .filter(Boolean)
        .join("; ");
      return bugResult(
        "embedded-sub-competitions-array",
        bugPresent ? "still_present" : "fixed",
        detail || undefined,
      );
    } catch (error) {
      return bugResult("embedded-sub-competitions-array", "check_failed", String(error));
    }
  },

  "matchday-date-format": async (apiKey) => {
    try {
      const spec = await fetchSwaggerSpec();
      if (!spec) {
        return bugResult("matchday-date-format", "check_failed", "Failed to fetch swagger.json");
      }
      const matchdateSpec = schemaProperties(spec, "LeagueMatchDayDto")?.matchdate as
        | { format?: string }
        | undefined;
      const specUsesDateTime = matchdateSpec?.format === "date-time";
      const matchDaysRes = await samsGet(
        `/leagues/${LIVE_FIXTURES.leagueUuid}/match-days?size=5`,
        apiKey,
      );
      if (!matchDaysRes.ok) {
        return bugResult(
          "matchday-date-format",
          "check_failed",
          `HTTP ${matchDaysRes.status} fetching match-days`,
        );
      }
      const matchDaysData = (await matchDaysRes.json()) as {
        content?: Array<{ matchdate?: string }>;
      };
      const matchdate = matchDaysData.content?.find((entry) => entry.matchdate)?.matchdate;
      if (!matchdate) {
        return bugResult(
          "matchday-date-format",
          "check_failed",
          "No match-day with matchdate found",
        );
      }
      const apiReturnsDateOnly = !matchdate.includes("T");
      const bugPresent = specUsesDateTime && apiReturnsDateOnly;
      const detail = [
        specUsesDateTime ? "spec still declares format: date-time" : null,
        apiReturnsDateOnly ? "API returns date-only matchdate" : null,
      ]
        .filter(Boolean)
        .join("; ");
      return bugResult(
        "matchday-date-format",
        bugPresent ? "still_present" : "fixed",
        detail || undefined,
      );
    } catch (error) {
      return bugResult("matchday-date-format", "check_failed", String(error));
    }
  },

  "event-types-array-response": async (apiKey) => {
    try {
      const spec = await fetchSwaggerSpec();
      if (!spec) {
        return bugResult(
          "event-types-array-response",
          "check_failed",
          "Failed to fetch swagger.json",
        );
      }
      const paths = spec.paths as Record<string, { get?: { responses?: Record<string, unknown> } }>;
      const response200 = paths["/event-types"]?.get?.responses?.["200"] as
        | { content?: Record<string, { schema?: { type?: string; $ref?: string } }> }
        | undefined;
      const schema = response200?.content?.["application/hal+json; charset=UTF-8"]?.schema;
      const specDeclaresObject = Boolean(schema?.$ref) && schema?.type !== "array";
      const eventTypesRes = await samsGet("/event-types", apiKey);
      if (!eventTypesRes.ok) {
        return bugResult(
          "event-types-array-response",
          "check_failed",
          `HTTP ${eventTypesRes.status} fetching event-types`,
        );
      }
      const eventTypes = (await eventTypesRes.json()) as unknown;
      const apiReturnsArray = Array.isArray(eventTypes);
      const bugPresent = specDeclaresObject && apiReturnsArray;
      const detail = [
        specDeclaresObject ? "spec still declares single EventType response" : null,
        apiReturnsArray ? "API returns JSON array" : null,
      ]
        .filter(Boolean)
        .join("; ");
      return bugResult(
        "event-types-array-response",
        bugPresent ? "still_present" : "fixed",
        detail || undefined,
      );
    } catch (error) {
      return bugResult("event-types-array-response", "check_failed", String(error));
    }
  },
};

/** Slugs executed by `vp run bugs` (excludes documented-only entries). */
export const PROBED_BUG_SLUGS = PROBED_UPSTREAM_BUGS.map((bug) => bug.slug);

export async function runUpstreamBugProbes(apiKey: string): Promise<BugProbeRun> {
  const bugs = await Promise.all(
    PROBED_BUG_SLUGS.map((slug) => {
      const probe = bugProbes[slug];
      if (!probe) {
        return Promise.resolve(
          bugResult(slug, "check_failed", "No live probe implemented for slug"),
        );
      }
      return probe(apiKey);
    }),
  );
  return { bugs, checkedAt: new Date().toISOString() };
}
