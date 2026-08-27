import type { SamsClient } from "../create-sams-client";

/**
 * SAMS SDK operations used by terijaki/vcmuellheim and terijaki/markgraefler-volleys.
 *
 * Sources (2026-08): teams sync lambda, clubs sync lambda, match loader, rankings,
 * and server functions that read synced DynamoDB data originally populated via these calls.
 *
 * Update this list when consumer apps add or remove SAMS dependencies.
 */
export const CONSUMER_SAMS_OPERATIONS = [
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
