/**
 * Canonical registry of documented upstream SAMS API defects.
 *
 * Human-readable catalogue: docs/BUGS.md
 * Live probes: src/upstream/bug-probes.ts (`vp run bugs`)
 *
 * Prefer referencing bugs by `slug` in code comments and patches.
 * Numeric `id` is stable for weekly CI reports and issue history.
 */

export type UpstreamBug = {
  /** Stable number used in docs/BUGS.md and weekly reports. */
  id: number;
  /** Short kebab-case identifier for code and patches. */
  slug: string;
  /** One-line summary for tables and JSON output. */
  summary: string;
  /** ISO date when the defect was first verified (optional for legacy entries). */
  discovered?: string;
  /** Whether `vp run bugs` has a live probe for this entry. */
  probed: boolean;
};

export const UPSTREAM_BUGS = [
  {
    id: 1,
    slug: "sbvv-missing-from-associations",
    summary: "SBVV absent from GET /associations paginated list",
    discovered: "2026-02-22",
    probed: false,
  },
  {
    id: 2,
    slug: "team-logo-screen-null",
    summary: "logoImageForScreenOutputLink always null on GET /teams/{uuid}",
    discovered: "2026-02-22",
    probed: true,
  },
  {
    id: 3,
    slug: "rankings-score-including-losses-null",
    summary: "scoreIncludingLosses always null in GET /leagues/{uuid}/rankings",
    discovered: "2026-02-22",
    probed: true,
  },
  {
    id: 4,
    slug: "accept-json-406",
    summary: "Accept: application/json returns HTTP 406 instead of 200",
    discovered: "2026-02-22",
    probed: true,
  },
  {
    id: 5,
    slug: "team-empty-string-nullables",
    summary: 'shortName/clubCode return "" instead of null on GET /teams/{uuid}',
    discovered: "2026-02-22",
    probed: true,
  },
  {
    id: 6,
    slug: "match-date-format",
    summary: "`date` declared as `date-time` but API returns YYYY-MM-DD",
    discovered: "2026-02-22",
    probed: true,
  },
  {
    id: 7,
    slug: "match-ref-results-nullable-ref",
    summary: "`referees`/`results` use invalid `$ref + nullable: true` OpenAPI syntax",
    discovered: "2026-02-22",
    probed: true,
  },
  {
    id: 8,
    slug: "hierarchy-parent-null",
    summary: "LeagueHierarchyDto.parentLeagueHierarchyUuid null on root nodes",
    discovered: "2026-02-22",
    probed: true,
  },
  {
    id: 9,
    slug: "competition-null-timestamps",
    summary: "Competition/League/SuperCompetition unset fields return null but spec omits nullable",
    discovered: "2026-08-27",
    probed: true,
  },
  {
    id: 10,
    slug: "embedded-sub-competitions-array",
    summary: "SuperCompetitionDto._embedded.sub_competitions is an array but spec expects objects",
    discovered: "2026-08-27",
    probed: true,
  },
  {
    id: 11,
    slug: "matchday-date-format",
    summary: "LeagueMatchDayDto.matchdate declared as date-time but API returns YYYY-MM-DD",
    discovered: "2026-08-27",
    probed: true,
  },
  {
    id: 12,
    slug: "event-types-array-response",
    summary: "GET /event-types returns an array but spec declares a single EventType",
    discovered: "2026-08-27",
    probed: true,
  },
] as const satisfies readonly UpstreamBug[];

export type UpstreamBugSlug = (typeof UPSTREAM_BUGS)[number]["slug"];

export const PROBED_UPSTREAM_BUGS = UPSTREAM_BUGS.filter((bug) => bug.probed);

export const UPSTREAM_BUG_BY_SLUG = Object.fromEntries(
  UPSTREAM_BUGS.map((bug) => [bug.slug, bug]),
) as Record<UpstreamBugSlug, UpstreamBug>;

export const UPSTREAM_BUG_BY_ID = Object.fromEntries(
  UPSTREAM_BUGS.map((bug) => [bug.id, bug]),
) as Record<number, UpstreamBug>;
