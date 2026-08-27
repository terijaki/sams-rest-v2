import type { SamsClient } from "../create-sams-client";

/**
 * Baseline SAMS SDK operations for a typical club-site integration:
 * seasons, leagues, teams, rosters, rankings, matches, associations, and sportsclubs.
 *
 * The API graph test suite must exercise each of these. Extend the list when a
 * supported integration pattern needs additional operations.
 */
export const BASELINE_SAMS_OPERATIONS = [
  "getAllSeasons",
  "getSeasonByUuid",
  "getAllLeagueHierarchies",
  "getAllLeagues",
  "getLeagueByUuid",
  "getTeamsForLeague",
  "getTeamByUuid",
  "getTeamRosterByTeamUuid",
  "getRankingsForLeague",
  "getAllLeagueMatches",
  "getAssociations",
  "getAssociationByUuid",
  "getAllSportsclubs",
  "getSportsclub",
] as const satisfies readonly (keyof SamsClient)[];
