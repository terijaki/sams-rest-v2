import type { SamsClient } from "../create-sams-client";
import { assertTeamRosterStructure } from "./assert-team-roster";
import {
  createSamsApiGraphContext,
  firstFromPage,
  firstOptionalUuid,
  firstUuid,
  firstUuidFromCalls,
  pageItems,
  SAMS_GRAPH_DISCOVERY_PAGE_SIZE,
  SAMS_GRAPH_PAGE_SIZE,
  type SamsApiGraphContext,
  type UuidCarrier,
} from "./sams-api-graph-context";

export type SamsApiGraphStep = {
  /** Vitest case title — usually the primary SDK operation name. */
  name: string;
  /** SDK operations invoked by this step (including fallbacks). */
  operations: string[];
  run: (sams: SamsClient, ctx: SamsApiGraphContext) => Promise<void>;
};

export const SAMS_API_GRAPH_STEPS: SamsApiGraphStep[] = [
  {
    name: "getApiBaseLinks",
    operations: ["getApiBaseLinks"],
    run: async (sams) => {
      await sams.getApiBaseLinks();
    },
  },
  {
    name: "getAllSeasons",
    operations: ["getAllSeasons"],
    run: async (sams, ctx) => {
      const { data: seasons } = await sams.getAllSeasons();
      ctx.seasonUuid = firstFromPage(seasons, "season");
    },
  },
  {
    name: "getSeasonByUuid",
    operations: ["getSeasonByUuid"],
    run: async (sams, ctx) => {
      await sams.getSeasonByUuid({ path: { uuid: ctx.seasonUuid! } });
    },
  },
  {
    name: "getLeagueHierarchiesForSeason",
    operations: ["getLeagueHierarchiesForSeason"],
    run: async (sams, ctx) => {
      const { data: hierarchiesForSeason } = await sams.getLeagueHierarchiesForSeason({
        path: { uuid: ctx.seasonUuid! },
        query: { size: SAMS_GRAPH_DISCOVERY_PAGE_SIZE },
      });
      ctx.hierarchies = pageItems(hierarchiesForSeason);
      ctx.hierarchyUuid = firstUuid(ctx.hierarchies, "league hierarchy");
    },
  },
  {
    name: "getLeagueHierarchyByUuid",
    operations: ["getLeagueHierarchyByUuid"],
    run: async (sams, ctx) => {
      await sams.getLeagueHierarchyByUuid({ path: { uuid: ctx.hierarchyUuid! } });
    },
  },
  {
    name: "getLeaguesByLeagueHierarchy",
    operations: ["getLeaguesByLeagueHierarchy", "getAllLeagues"],
    run: async (sams, ctx) => {
      ctx.leagueUuid = await firstUuidFromCalls("league", [
        ...ctx.hierarchies
          .filter((hierarchy): hierarchy is UuidCarrier & { uuid: string } =>
            Boolean(hierarchy.uuid),
          )
          .map(
            (hierarchy) => () =>
              sams
                .getLeaguesByLeagueHierarchy({
                  path: { uuid: hierarchy.uuid },
                  query: { size: SAMS_GRAPH_PAGE_SIZE },
                })
                .then(({ data }) => data),
          ),
        () =>
          sams
            .getAllLeagues({ query: { size: SAMS_GRAPH_PAGE_SIZE, season: ctx.seasonUuid! } })
            .then(({ data }) => data),
      ]);
    },
  },
  {
    name: "getCompetitionsByLeagueHierarchy",
    operations: ["getCompetitionsByLeagueHierarchy", "getAllCompetitions"],
    run: async (sams, ctx) => {
      ctx.competitionUuid = await firstUuidFromCalls("competition", [
        () =>
          sams
            .getCompetitionsByLeagueHierarchy({
              path: { uuid: ctx.hierarchyUuid! },
              query: { size: SAMS_GRAPH_PAGE_SIZE },
            })
            .then(({ data }) => data),
        () =>
          sams
            .getAllCompetitions({
              query: { size: SAMS_GRAPH_PAGE_SIZE, season: ctx.seasonUuid! },
            })
            .then(({ data }) => data),
      ]);
    },
  },
  {
    name: "getSuperCompetitionsByLeagueHierarchy",
    operations: ["getSuperCompetitionsByLeagueHierarchy", "getAllSuperCompetitions"],
    run: async (sams, ctx) => {
      ctx.superCompetitionUuid = await firstUuidFromCalls("super-competition", [
        () =>
          sams
            .getSuperCompetitionsByLeagueHierarchy({
              path: { uuid: ctx.hierarchyUuid! },
              query: { size: SAMS_GRAPH_PAGE_SIZE },
            })
            .then(({ data }) => data),
        () =>
          sams
            .getAllSuperCompetitions({
              query: { size: SAMS_GRAPH_PAGE_SIZE, season: ctx.seasonUuid! },
            })
            .then(({ data }) => data),
      ]);
    },
  },
  {
    name: "getLeagueByUuid",
    operations: ["getLeagueByUuid"],
    run: async (sams, ctx) => {
      await sams.getLeagueByUuid({ path: { uuid: ctx.leagueUuid! } });
    },
  },
  {
    name: "getMatchDaysForLeague",
    operations: ["getMatchDaysForLeague", "getAllMatchDays"],
    run: async (sams, ctx) => {
      ctx.matchDayUuid = await firstUuidFromCalls("match-day", [
        () =>
          sams
            .getMatchDaysForLeague({
              path: { uuid: ctx.leagueUuid! },
              query: { size: SAMS_GRAPH_PAGE_SIZE },
            })
            .then(({ data }) => data),
        () =>
          sams.getAllMatchDays({ query: { size: SAMS_GRAPH_PAGE_SIZE } }).then(({ data }) => data),
      ]);
    },
  },
  {
    name: "getRankingsForLeague",
    operations: ["getRankingsForLeague"],
    run: async (sams, ctx) => {
      await sams.getRankingsForLeague({ path: { uuid: ctx.leagueUuid! } });
    },
  },
  {
    name: "getTeamsForLeague",
    operations: ["getTeamsForLeague", "getAllTeams"],
    run: async (sams, ctx) => {
      ctx.teamUuid = await firstUuidFromCalls("team", [
        () =>
          sams
            .getTeamsForLeague({
              path: { uuid: ctx.leagueUuid! },
              query: { size: SAMS_GRAPH_PAGE_SIZE },
            })
            .then(({ data }) => data),
        () => sams.getAllTeams({ query: { size: SAMS_GRAPH_PAGE_SIZE } }).then(({ data }) => data),
      ]);
    },
  },
  {
    name: "getMatchDayByUuid",
    operations: ["getMatchDayByUuid"],
    run: async (sams, ctx) => {
      await sams.getMatchDayByUuid({ path: { uuid: ctx.matchDayUuid! } });
    },
  },
  {
    name: "getMatchesByMatchDay",
    operations: ["getMatchesByMatchDay", "getAllLeagueMatches"],
    run: async (sams, ctx) => {
      ctx.leagueMatchUuid = await firstUuidFromCalls("league match", [
        () =>
          sams
            .getMatchesByMatchDay({
              path: { uuid: ctx.matchDayUuid! },
              query: { size: SAMS_GRAPH_PAGE_SIZE },
            })
            .then(({ data }) => data),
        () =>
          sams
            .getAllLeagueMatches({
              query: { size: SAMS_GRAPH_PAGE_SIZE, "for-league": ctx.leagueUuid! },
            })
            .then(({ data }) => data),
      ]);
    },
  },
  {
    name: "getLeagueMatchByUuid",
    operations: ["getLeagueMatchByUuid"],
    run: async (sams, ctx) => {
      await sams.getLeagueMatchByUuid({ path: { uuid: ctx.leagueMatchUuid! } });
    },
  },
  {
    name: "getAllLeagueMatches",
    operations: ["getAllLeagueMatches"],
    run: async (sams, ctx) => {
      await sams.getAllLeagueMatches({
        query: { size: SAMS_GRAPH_PAGE_SIZE, "for-league": ctx.leagueUuid! },
      });
    },
  },
  {
    name: "getTeamByUuid",
    operations: ["getTeamByUuid"],
    run: async (sams, ctx) => {
      await sams.getTeamByUuid({ path: { uuid: ctx.teamUuid! } });
    },
  },
  {
    name: "getTeamRosterByTeamUuid",
    operations: ["getTeamRosterByTeamUuid"],
    run: async (sams, ctx) => {
      const { data: roster } = await sams.getTeamRosterByTeamUuid({
        path: { uuid: ctx.teamUuid! },
      });
      if (roster) {
        assertTeamRosterStructure(roster);
      }
    },
  },
  {
    name: "getCompetitionByUuid",
    operations: ["getCompetitionByUuid"],
    run: async (sams, ctx) => {
      await sams.getCompetitionByUuid({ path: { uuid: ctx.competitionUuid! } });
    },
  },
  {
    name: "getMatchGroupsForCompetition",
    operations: ["getMatchGroupsForCompetition"],
    run: async (sams, ctx) => {
      await sams.getMatchGroupsForCompetition({
        path: { uuid: ctx.competitionUuid! },
        query: { size: SAMS_GRAPH_PAGE_SIZE },
      });
    },
  },
  {
    name: "getRankingsForCompetition",
    operations: ["getRankingsForCompetition"],
    run: async (sams, ctx) => {
      await sams.getRankingsForCompetition({ path: { uuid: ctx.competitionUuid! } });
    },
  },
  {
    name: "getTeamsForCompetition",
    operations: ["getTeamsForCompetition"],
    run: async (sams, ctx) => {
      await sams.getTeamsForCompetition({
        path: { uuid: ctx.competitionUuid! },
        query: { size: SAMS_GRAPH_PAGE_SIZE },
      });
    },
  },
  {
    name: "getAllCompetitionMatchesWithFilter",
    operations: ["getAllCompetitionMatchesWithFilter"],
    run: async (sams, ctx) => {
      ctx.competitionMatchUuid = await firstUuidFromCalls("competition match", [
        () =>
          sams
            .getAllCompetitionMatchesWithFilter({
              query: { size: SAMS_GRAPH_PAGE_SIZE, "for-competition": ctx.competitionUuid! },
            })
            .then(({ data }) => data),
      ]);
    },
  },
  {
    name: "getCompetitionMatchByUuid",
    operations: ["getCompetitionMatchByUuid"],
    run: async (sams, ctx) => {
      await sams.getCompetitionMatchByUuid({ path: { uuid: ctx.competitionMatchUuid! } });
    },
  },
  {
    name: "getSuperCompetitionByUuid",
    operations: ["getSuperCompetitionByUuid"],
    run: async (sams, ctx) => {
      await sams.getSuperCompetitionByUuid({ path: { uuid: ctx.superCompetitionUuid! } });
    },
  },
  {
    name: "getAllLeagues",
    operations: ["getAllLeagues"],
    run: async (sams) => {
      await sams.getAllLeagues({ query: { size: SAMS_GRAPH_PAGE_SIZE } });
    },
  },
  {
    name: "getAllLeagueHierarchies",
    operations: ["getAllLeagueHierarchies"],
    run: async (sams) => {
      await sams.getAllLeagueHierarchies({ query: { size: SAMS_GRAPH_PAGE_SIZE } });
    },
  },
  {
    name: "getAllMatchDays",
    operations: ["getAllMatchDays"],
    run: async (sams) => {
      await sams.getAllMatchDays({ query: { size: SAMS_GRAPH_PAGE_SIZE } });
    },
  },
  {
    name: "getAllMatchGroups",
    operations: ["getAllMatchGroups"],
    run: async (sams, ctx) => {
      ctx.matchGroupUuid = await firstUuidFromCalls("match group", [
        () =>
          sams
            .getAllMatchGroups({ query: { size: SAMS_GRAPH_PAGE_SIZE } })
            .then(({ data }) => data),
      ]);
    },
  },
  {
    name: "getMatchGroupByUuid",
    operations: ["getMatchGroupByUuid"],
    run: async (sams, ctx) => {
      await sams.getMatchGroupByUuid({ path: { uuid: ctx.matchGroupUuid! } });
    },
  },
  {
    name: "getMatchesByMatchGroup",
    operations: ["getMatchesByMatchGroup"],
    run: async (sams, ctx) => {
      await sams.getMatchesByMatchGroup({
        path: { uuid: ctx.matchGroupUuid! },
        query: { size: SAMS_GRAPH_PAGE_SIZE },
      });
    },
  },
  {
    name: "getAllCompetitions",
    operations: ["getAllCompetitions"],
    run: async (sams) => {
      await sams.getAllCompetitions({ query: { size: SAMS_GRAPH_PAGE_SIZE } });
    },
  },
  {
    name: "getAllSuperCompetitions",
    operations: ["getAllSuperCompetitions"],
    run: async (sams) => {
      await sams.getAllSuperCompetitions({ query: { size: SAMS_GRAPH_PAGE_SIZE } });
    },
  },
  {
    name: "getAllTeams",
    operations: ["getAllTeams"],
    run: async (sams) => {
      await sams.getAllTeams({ query: { size: SAMS_GRAPH_PAGE_SIZE } });
    },
  },
  {
    name: "getAllSportsclubs",
    operations: ["getAllSportsclubs"],
    run: async (sams, ctx) => {
      ctx.sportsclubUuid = await firstUuidFromCalls("sportsclub", [
        () =>
          sams
            .getAllSportsclubs({ query: { size: SAMS_GRAPH_PAGE_SIZE } })
            .then(({ data }) => data),
      ]);
    },
  },
  {
    name: "getSportsclub",
    operations: ["getSportsclub"],
    run: async (sams, ctx) => {
      await sams.getSportsclub({ path: { uuid: ctx.sportsclubUuid! } });
    },
  },
  {
    name: "getAssociations",
    operations: ["getAssociations"],
    run: async (sams, ctx) => {
      ctx.associationUuid = await firstUuidFromCalls("association", [
        () =>
          sams.getAssociations({ query: { size: SAMS_GRAPH_PAGE_SIZE } }).then(({ data }) => data),
      ]);
    },
  },
  {
    name: "getAssociationByUuid",
    operations: ["getAssociationByUuid"],
    run: async (sams, ctx) => {
      await sams.getAssociationByUuid({ path: { uuid: ctx.associationUuid! } });
    },
  },
  {
    name: "getCommitteesForAssociation",
    operations: ["getCommitteesForAssociation"],
    run: async (sams, ctx) => {
      const { data: committeesForAssociation } = await sams.getCommitteesForAssociation({
        path: { uuid: ctx.associationUuid! },
        query: { size: SAMS_GRAPH_PAGE_SIZE },
      });
      ctx.committeeUuid = firstOptionalUuid(pageItems(committeesForAssociation));
    },
  },
  {
    name: "getSportsclubsForAssociation",
    operations: ["getSportsclubsForAssociation"],
    run: async (sams, ctx) => {
      await sams.getSportsclubsForAssociation({
        path: { uuid: ctx.associationUuid! },
        query: { size: SAMS_GRAPH_PAGE_SIZE },
      });
    },
  },
  {
    name: "getCommittee",
    operations: ["getCommittee"],
    run: async (sams, ctx) => {
      if (!ctx.committeeUuid) return;
      await sams.getCommittee({ path: { uuid: ctx.committeeUuid } });
    },
  },
  {
    name: "getAllLocations",
    operations: ["getAllLocations"],
    run: async (sams, ctx) => {
      ctx.locationUuid = await firstUuidFromCalls("location", [
        () =>
          sams.getAllLocations({ query: { size: SAMS_GRAPH_PAGE_SIZE } }).then(({ data }) => data),
      ]);
    },
  },
  {
    name: "getLocationByUuid",
    operations: ["getLocationByUuid"],
    run: async (sams, ctx) => {
      await sams.getLocationByUuid({ path: { uuid: ctx.locationUuid! } });
    },
  },
  {
    name: "getEventTypes",
    operations: ["getEventTypes"],
    run: async (sams, ctx) => {
      const { data: eventTypes } = await sams.getEventTypes();
      ctx.eventTypeUuid = firstFromPage(
        Array.isArray(eventTypes) ? eventTypes : [eventTypes as UuidCarrier],
        "event type",
      );
    },
  },
  {
    name: "getEventTypeByUuid",
    operations: ["getEventTypeByUuid"],
    run: async (sams, ctx) => {
      await sams.getEventTypeByUuid({ path: { uuid: ctx.eventTypeUuid! } });
    },
  },
];

/** Unique SDK operation names exercised by the graph (includes fallback calls). */
export function listSamsApiGraphOperations(
  steps: readonly SamsApiGraphStep[] = SAMS_API_GRAPH_STEPS,
): string[] {
  return [...new Set(steps.flatMap((step) => step.operations))];
}

export async function runSamsApiGraphSteps(
  sams: SamsClient,
  steps: readonly SamsApiGraphStep[] = SAMS_API_GRAPH_STEPS,
): Promise<SamsApiGraphContext> {
  const ctx = createSamsApiGraphContext();
  for (const step of steps) {
    await step.run(sams, ctx);
  }
  return ctx;
}
