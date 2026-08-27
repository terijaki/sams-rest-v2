import type { SamsClient } from "../create-sams-client";

const PAGE_SIZE = 5;

type UuidCarrier = { uuid?: string };

function firstUuid(items: UuidCarrier[] | undefined, label: string): string {
  const uuid = items?.find((item) => item.uuid)?.uuid;
  if (!uuid) {
    throw new Error(`No ${label} uuid found in live response`);
  }
  return uuid;
}

function firstFromPage<T extends UuidCarrier>(
  page: { content?: T[] } | T[] | undefined,
  label: string,
): string {
  const items = Array.isArray(page) ? page : page?.content;
  return firstUuid(items, label);
}

/**
 * Walk the public SAMS GET graph through the bound SDK client.
 * Used by MSW contract tests and live API tests.
 */
export async function walkSamsApiGraph(sams: SamsClient): Promise<void> {
  await sams.getApiBaseLinks();

  const { data: seasons } = await sams.getAllSeasons();
  const seasonUuid = firstFromPage(seasons, "season");

  await sams.getSeasonByUuid({ path: { uuid: seasonUuid } });

  const { data: hierarchiesForSeason } = await sams.getLeagueHierarchiesForSeason({
    path: { uuid: seasonUuid },
    query: { size: PAGE_SIZE },
  });
  const hierarchyUuid = firstFromPage(hierarchiesForSeason, "league hierarchy");

  await sams.getLeagueHierarchyByUuid({ path: { uuid: hierarchyUuid } });

  const { data: leaguesByHierarchy } = await sams.getLeaguesByLeagueHierarchy({
    path: { uuid: hierarchyUuid },
    query: { size: PAGE_SIZE },
  });
  const leagueUuid = firstFromPage(leaguesByHierarchy, "league");

  const { data: competitionsByHierarchy } = await sams.getCompetitionsByLeagueHierarchy({
    path: { uuid: hierarchyUuid },
    query: { size: PAGE_SIZE },
  });
  const competitionUuid = firstFromPage(competitionsByHierarchy, "competition");

  const { data: superCompetitionsByHierarchy } = await sams.getSuperCompetitionsByLeagueHierarchy({
    path: { uuid: hierarchyUuid },
    query: { size: PAGE_SIZE },
  });
  const superCompetitionUuid = firstFromPage(superCompetitionsByHierarchy, "super-competition");

  await sams.getLeagueByUuid({ path: { uuid: leagueUuid } });

  const { data: matchDaysForLeague } = await sams.getMatchDaysForLeague({
    path: { uuid: leagueUuid },
    query: { size: PAGE_SIZE },
  });
  const matchDayUuid = firstFromPage(matchDaysForLeague, "match-day");

  await sams.getRankingsForLeague({ path: { uuid: leagueUuid } });

  const { data: teamsForLeague } = await sams.getTeamsForLeague({
    path: { uuid: leagueUuid },
    query: { size: PAGE_SIZE },
  });
  const teamUuid = firstFromPage(teamsForLeague, "team");

  await sams.getMatchDayByUuid({ path: { uuid: matchDayUuid } });

  const { data: matchesByMatchDay } = await sams.getMatchesByMatchDay({
    path: { uuid: matchDayUuid },
    query: { size: PAGE_SIZE },
  });
  const leagueMatchUuid = firstFromPage(matchesByMatchDay, "league match");

  await sams.getLeagueMatchByUuid({ path: { uuid: leagueMatchUuid } });

  await sams.getAllLeagueMatches({
    query: { size: PAGE_SIZE, "for-league": leagueUuid },
  });

  await sams.getTeamByUuid({ path: { uuid: teamUuid } });
  await sams.getTeamRosterByTeamUuid({ path: { uuid: teamUuid } });

  await sams.getCompetitionByUuid({ path: { uuid: competitionUuid } });
  await sams.getMatchGroupsForCompetition({
    path: { uuid: competitionUuid },
    query: { size: PAGE_SIZE },
  });
  await sams.getRankingsForCompetition({ path: { uuid: competitionUuid } });
  await sams.getTeamsForCompetition({
    path: { uuid: competitionUuid },
    query: { size: PAGE_SIZE },
  });

  const { data: competitionMatches } = await sams.getAllCompetitionMatchesWithFilter({
    query: { size: PAGE_SIZE, "for-competition": competitionUuid },
  });
  const competitionMatchUuid = firstFromPage(competitionMatches, "competition match");
  await sams.getCompetitionMatchByUuid({ path: { uuid: competitionMatchUuid } });

  await sams.getSuperCompetitionByUuid({ path: { uuid: superCompetitionUuid } });

  await sams.getAllLeagues({ query: { size: PAGE_SIZE } });
  await sams.getAllLeagueHierarchies({ query: { size: PAGE_SIZE } });
  await sams.getAllMatchDays({ query: { size: PAGE_SIZE } });

  const { data: allMatchGroups } = await sams.getAllMatchGroups({ query: { size: PAGE_SIZE } });
  const matchGroupUuid = firstFromPage(allMatchGroups, "match group");

  await sams.getMatchGroupByUuid({ path: { uuid: matchGroupUuid } });
  await sams.getMatchesByMatchGroup({
    path: { uuid: matchGroupUuid },
    query: { size: PAGE_SIZE },
  });

  await sams.getAllCompetitions({ query: { size: PAGE_SIZE } });
  await sams.getAllSuperCompetitions({ query: { size: PAGE_SIZE } });
  await sams.getAllTeams({ query: { size: PAGE_SIZE } });

  const { data: allSportsclubs } = await sams.getAllSportsclubs({ query: { size: PAGE_SIZE } });
  const sportsclubUuid = firstFromPage(allSportsclubs, "sportsclub");
  await sams.getSportsclub({ path: { uuid: sportsclubUuid } });

  const { data: allAssociations } = await sams.getAssociations({ query: { size: PAGE_SIZE } });
  const associationUuid = firstFromPage(allAssociations, "association");

  await sams.getAssociationByUuid({ path: { uuid: associationUuid } });
  await sams.getCommitteesForAssociation({
    path: { uuid: associationUuid },
    query: { size: PAGE_SIZE },
  });
  await sams.getSportsclubsForAssociation({
    path: { uuid: associationUuid },
    query: { size: PAGE_SIZE },
  });

  const { data: allCommittees } = await sams.getAllCommittees({ query: { size: PAGE_SIZE } });
  const committeeUuid = firstFromPage(allCommittees, "committee");
  await sams.getCommittee({ path: { uuid: committeeUuid } });

  const { data: allLocations } = await sams.getAllLocations({ query: { size: PAGE_SIZE } });
  const locationUuid = firstFromPage(allLocations, "location");
  await sams.getLocationByUuid({ path: { uuid: locationUuid } });

  const { data: allEvents } = await sams.getAllEvents({ query: { size: PAGE_SIZE } });
  const eventUuid = firstFromPage(allEvents, "event");
  await sams.getEventByUuid({ path: { uuid: eventUuid } });

  const { data: eventTypes } = await sams.getEventTypes();
  const eventTypeUuid =
    eventTypes && typeof eventTypes === "object" && "uuid" in eventTypes && eventTypes.uuid
      ? eventTypes.uuid
      : firstFromPage(
          Array.isArray(eventTypes) ? eventTypes : [eventTypes as UuidCarrier],
          "event type",
        );
  await sams.getEventTypeByUuid({ path: { uuid: eventTypeUuid } });
}
