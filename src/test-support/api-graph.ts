import type { SamsClient } from "../create-sams-client";
import { assertTeamRosterStructure } from "./assert-team-roster";

const PAGE_SIZE = 5;
const DISCOVERY_PAGE_SIZE = 100;

type UuidCarrier = { uuid?: string };

function pageItems<T>(page: { content?: T[] } | T[] | undefined): T[] {
  return Array.isArray(page) ? page : (page?.content ?? []);
}

function firstUuid(items: UuidCarrier[] | undefined, label: string): string {
  const uuid = items?.find((item) => item.uuid)?.uuid;
  if (!uuid) {
    throw new Error(`No ${label} uuid found in live response`);
  }
  return uuid;
}

function firstOptionalUuid(items: UuidCarrier[] | undefined): string | undefined {
  return items?.find((item) => item.uuid)?.uuid;
}

function firstFromPage<T extends UuidCarrier>(
  page: { content?: T[] } | T[] | undefined,
  label: string,
): string {
  return firstUuid(pageItems(page), label);
}

async function firstUuidFromCalls(
  label: string,
  calls: Array<() => Promise<{ content?: UuidCarrier[] } | UuidCarrier[] | undefined>>,
): Promise<string> {
  for (const call of calls) {
    const page = await call();
    const uuid = pageItems(page).find((item) => item.uuid)?.uuid;
    if (uuid) return uuid;
  }
  throw new Error(`No ${label} uuid found in live response`);
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
    query: { size: DISCOVERY_PAGE_SIZE },
  });
  const hierarchies = pageItems(hierarchiesForSeason);
  const hierarchyUuid = firstUuid(hierarchies, "league hierarchy");

  await sams.getLeagueHierarchyByUuid({ path: { uuid: hierarchyUuid } });

  const leagueUuid = await firstUuidFromCalls("league", [
    ...hierarchies
      .filter((hierarchy): hierarchy is UuidCarrier & { uuid: string } => Boolean(hierarchy.uuid))
      .map(
        (hierarchy) => () =>
          sams
            .getLeaguesByLeagueHierarchy({
              path: { uuid: hierarchy.uuid },
              query: { size: PAGE_SIZE },
            })
            .then(({ data }) => data),
      ),
    () =>
      sams
        .getAllLeagues({ query: { size: PAGE_SIZE, season: seasonUuid } })
        .then(({ data }) => data),
  ]);

  const competitionUuid = await firstUuidFromCalls("competition", [
    () =>
      sams
        .getCompetitionsByLeagueHierarchy({
          path: { uuid: hierarchyUuid },
          query: { size: PAGE_SIZE },
        })
        .then(({ data }) => data),
    () =>
      sams
        .getAllCompetitions({ query: { size: PAGE_SIZE, season: seasonUuid } })
        .then(({ data }) => data),
  ]);

  const superCompetitionUuid = await firstUuidFromCalls("super-competition", [
    () =>
      sams
        .getSuperCompetitionsByLeagueHierarchy({
          path: { uuid: hierarchyUuid },
          query: { size: PAGE_SIZE },
        })
        .then(({ data }) => data),
    () =>
      sams
        .getAllSuperCompetitions({ query: { size: PAGE_SIZE, season: seasonUuid } })
        .then(({ data }) => data),
  ]);

  await sams.getLeagueByUuid({ path: { uuid: leagueUuid } });

  const matchDayUuid = await firstUuidFromCalls("match-day", [
    () =>
      sams
        .getMatchDaysForLeague({ path: { uuid: leagueUuid }, query: { size: PAGE_SIZE } })
        .then(({ data }) => data),
    () => sams.getAllMatchDays({ query: { size: PAGE_SIZE } }).then(({ data }) => data),
  ]);

  await sams.getRankingsForLeague({ path: { uuid: leagueUuid } });

  const teamUuid = await firstUuidFromCalls("team", [
    () =>
      sams
        .getTeamsForLeague({ path: { uuid: leagueUuid }, query: { size: PAGE_SIZE } })
        .then(({ data }) => data),
    () => sams.getAllTeams({ query: { size: PAGE_SIZE } }).then(({ data }) => data),
  ]);

  await sams.getMatchDayByUuid({ path: { uuid: matchDayUuid } });

  const leagueMatchUuid = await firstUuidFromCalls("league match", [
    () =>
      sams
        .getMatchesByMatchDay({ path: { uuid: matchDayUuid }, query: { size: PAGE_SIZE } })
        .then(({ data }) => data),
    () =>
      sams
        .getAllLeagueMatches({ query: { size: PAGE_SIZE, "for-league": leagueUuid } })
        .then(({ data }) => data),
  ]);

  await sams.getLeagueMatchByUuid({ path: { uuid: leagueMatchUuid } });

  await sams.getAllLeagueMatches({
    query: { size: PAGE_SIZE, "for-league": leagueUuid },
  });

  await sams.getTeamByUuid({ path: { uuid: teamUuid } });
  const { data: roster } = await sams.getTeamRosterByTeamUuid({ path: { uuid: teamUuid } });
  if (roster) {
    assertTeamRosterStructure(roster);
  }

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

  const competitionMatchUuid = await firstUuidFromCalls("competition match", [
    () =>
      sams
        .getAllCompetitionMatchesWithFilter({
          query: { size: PAGE_SIZE, "for-competition": competitionUuid },
        })
        .then(({ data }) => data),
  ]);
  await sams.getCompetitionMatchByUuid({ path: { uuid: competitionMatchUuid } });

  await sams.getSuperCompetitionByUuid({ path: { uuid: superCompetitionUuid } });

  await sams.getAllLeagues({ query: { size: PAGE_SIZE } });
  await sams.getAllLeagueHierarchies({ query: { size: PAGE_SIZE } });
  await sams.getAllMatchDays({ query: { size: PAGE_SIZE } });

  const matchGroupUuid = await firstUuidFromCalls("match group", [
    () => sams.getAllMatchGroups({ query: { size: PAGE_SIZE } }).then(({ data }) => data),
  ]);

  await sams.getMatchGroupByUuid({ path: { uuid: matchGroupUuid } });
  await sams.getMatchesByMatchGroup({
    path: { uuid: matchGroupUuid },
    query: { size: PAGE_SIZE },
  });

  await sams.getAllCompetitions({ query: { size: PAGE_SIZE } });
  await sams.getAllSuperCompetitions({ query: { size: PAGE_SIZE } });
  await sams.getAllTeams({ query: { size: PAGE_SIZE } });

  const sportsclubUuid = await firstUuidFromCalls("sportsclub", [
    () => sams.getAllSportsclubs({ query: { size: PAGE_SIZE } }).then(({ data }) => data),
  ]);
  await sams.getSportsclub({ path: { uuid: sportsclubUuid } });

  const associationUuid = await firstUuidFromCalls("association", [
    () => sams.getAssociations({ query: { size: PAGE_SIZE } }).then(({ data }) => data),
  ]);

  await sams.getAssociationByUuid({ path: { uuid: associationUuid } });
  const { data: committeesForAssociation } = await sams.getCommitteesForAssociation({
    path: { uuid: associationUuid },
    query: { size: PAGE_SIZE },
  });
  await sams.getSportsclubsForAssociation({
    path: { uuid: associationUuid },
    query: { size: PAGE_SIZE },
  });

  const committeeUuid = firstOptionalUuid(pageItems(committeesForAssociation));
  if (committeeUuid) {
    await sams.getCommittee({ path: { uuid: committeeUuid } });
  }

  const locationUuid = await firstUuidFromCalls("location", [
    () => sams.getAllLocations({ query: { size: PAGE_SIZE } }).then(({ data }) => data),
  ]);
  await sams.getLocationByUuid({ path: { uuid: locationUuid } });

  const { data: eventTypes } = await sams.getEventTypes();
  const eventTypeUuid = firstFromPage(
    Array.isArray(eventTypes) ? eventTypes : [eventTypes as UuidCarrier],
    "event type",
  );
  await sams.getEventTypeByUuid({ path: { uuid: eventTypeUuid } });
}
