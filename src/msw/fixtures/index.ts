import idsJson from "./ids.json";
import {
  zGetAllCommitteesResponse,
  zGetAllCompetitionMatchesWithFilterResponse,
  zGetAllCompetitionsResponse,
  zGetAllEventsResponse,
  zGetAllLeagueHierarchiesResponse,
  zGetAllLeagueMatchesResponse,
  zGetAllLeaguesResponse,
  zGetAllLocationsResponse,
  zGetAllMatchDaysResponse,
  zGetAllMatchGroupsResponse,
  zGetAllSeasonsResponse,
  zGetAllSportsclubsResponse,
  zGetAllSuperCompetitionsResponse,
  zGetAllTeamsResponse,
  zGetAssociationByUuidResponse,
  zGetAssociationsResponse,
  zGetCommitteeResponse,
  zGetCommitteesForAssociationResponse,
  zGetCompetitionByUuidResponse,
  zGetCompetitionMatchByUuidResponse,
  zGetCompetitionsByLeagueHierarchyResponse,
  zGetEventByUuidResponse,
  zGetEventTypeByUuidResponse,
  zGetEventTypesResponse,
  zGetLeagueByUuidResponse,
  zGetLeagueHierarchiesForSeasonResponse,
  zGetLeagueHierarchyByUuidResponse,
  zGetLeagueMatchByUuidResponse,
  zGetLeaguesByLeagueHierarchyResponse,
  zGetLocationByUuidResponse,
  zGetMatchDayByUuidResponse,
  zGetMatchDaysForLeagueResponse,
  zGetMatchGroupByUuidResponse,
  zGetMatchGroupsForCompetitionResponse,
  zGetMatchesByMatchDayResponse,
  zGetMatchesByMatchGroupResponse,
  zGetRankingsForCompetitionResponse,
  zGetRankingsForLeagueResponse,
  zGetSeasonByUuidResponse,
  zGetSportsclubResponse,
  zGetSportsclubsForAssociationResponse,
  zGetSuperCompetitionByUuidResponse,
  zGetSuperCompetitionsByLeagueHierarchyResponse,
  zGetTeamByUuidResponse,
  zGetTeamRosterByTeamUuidResponse,
  zGetTeamsForCompetitionResponse,
  zGetTeamsForLeagueResponse,
} from "../../generated/zod.gen";

export const ids = idsJson as Record<
  | "season"
  | "hierarchy"
  | "league"
  | "matchDay"
  | "leagueMatch"
  | "team"
  | "teamGuest"
  | "sportsclub"
  | "sportsclubGuest"
  | "association"
  | "committee"
  | "location"
  | "competition"
  | "matchGroup"
  | "competitionMatch"
  | "superCompetition"
  | "event"
  | "eventType",
  string
>;

function page<T>(content: T[]) {
  return {
    content,
    totalElements: content.length,
    numberOfElements: content.length,
    totalPages: 1,
    first: true,
    last: true,
    empty: content.length === 0,
  };
}

const embeddedTeams = {
  team1: { uuid: ids.team, name: "VC Test 1", sportsclubUuid: ids.sportsclub },
  team2: { uuid: ids.teamGuest, name: "VC Test 2", sportsclubUuid: ids.sportsclubGuest },
};

export const fixtures = {
  apiBaseLinks: {
    _links: {
      self: { href: "https://www.volleyball-baden.de/api/v2/" },
      seasons: { href: "https://www.volleyball-baden.de/api/v2/seasons" },
    },
  },
  seasons: [
    {
      uuid: ids.season,
      name: "2025/26",
      currentSeason: true,
      startDate: "2025-07-01",
      endDate: "2026-06-30",
    },
  ],
  season: {
    uuid: ids.season,
    name: "2025/26",
    currentSeason: true,
    startDate: "2025-07-01",
    endDate: "2026-06-30",
  },
  hierarchy: {
    uuid: ids.hierarchy,
    name: "Verbandsliga",
    parentLeagueHierarchyUuid: null,
    seasonUuid: ids.season,
    associationUuid: ids.association,
  },
  league: {
    uuid: ids.league,
    name: "Verbandsliga Herren",
    shortName: "VL H",
    gender: "MALE" as const,
    leagueHierarchyUuid: ids.hierarchy,
    seasonUuid: ids.season,
    associationUuid: ids.association,
  },
  competition: {
    uuid: ids.competition,
    name: "Pokal Herren",
    shortName: "Pokal",
    gender: "MALE" as const,
    seasonUuid: ids.season,
    associationUuid: ids.association,
    leagueHierarchyUuid: ids.hierarchy,
    superCompetitionUuid: null,
    latestResultUpdate: null,
  },
  superCompetition: {
    uuid: ids.superCompetition,
    name: "Super Cup",
    shortName: "SC",
    gender: "MALE" as const,
    seasonUuid: ids.season,
    associationUuid: ids.association,
    leagueHierarchyUuid: ids.hierarchy,
  },
  matchDay: {
    uuid: ids.matchDay,
    name: "1. Spieltag",
    matchdate: "2025-10-04",
    seasonUuid: ids.season,
    leagueUuid: ids.league,
    associationUuid: ids.association,
  },
  leagueMatch: {
    uuid: ids.leagueMatch,
    date: "2025-10-04",
    time: "14:00",
    referees: null,
    results: null,
    location: null,
    team1Mvp: null,
    team2Mvp: null,
    _embedded: embeddedTeams,
  },
  competitionMatch: {
    uuid: ids.competitionMatch,
    date: "2025-11-01",
    time: "16:00",
    _embedded: embeddedTeams,
  },
  matchGroup: {
    uuid: ids.matchGroup,
    name: "Gruppe A",
    seasonUuid: ids.season,
    competitionUuid: ids.competition,
    associationUuid: ids.association,
  },
  team: {
    uuid: ids.team,
    name: "VC Test 1",
    shortName: "",
    clubCode: "",
    logoImageForScreenOutputLink: null,
    sportsclubUuid: ids.sportsclub,
    associationUuid: ids.association,
  },
  teamGuest: {
    uuid: ids.teamGuest,
    name: "VC Test 2",
    shortName: "",
    clubCode: "",
    logoImageForScreenOutputLink: null,
    sportsclubUuid: ids.sportsclubGuest,
    associationUuid: ids.association,
  },
  roster: {
    uuid: ids.team,
    teamUuid: ids.team,
    players: [
      {
        uuid: "player-1",
        name: "Max Mustermann",
        jerseyNumber: 7,
        position: null,
        portraitImageLink: null,
        firstName: null,
        lastName: null,
        birthdate: null,
        nationality: null,
        height: null,
        userId: null,
      },
    ],
    officials: [
      {
        uuid: "official-1",
        name: "Coach Test",
        role: "headCoach",
        firstName: null,
        lastName: null,
        birthdate: null,
        nationality: null,
        portraitImageLink: null,
        userId: null,
      },
    ],
  },
  sportsclub: {
    uuid: ids.sportsclub,
    name: "VC Test",
    logo: null,
    associationUuid: ids.association,
  },
  sportsclubGuest: {
    uuid: ids.sportsclubGuest,
    name: "VC Guest",
    logo: null,
    associationUuid: ids.association,
  },
  association: {
    uuid: ids.association,
    name: "Badischer Volleyball-Verband",
    shortname: "BVV",
    parentUuid: null,
    level: 0,
  },
  committee: {
    uuid: ids.committee,
    name: "Sportausschuss",
    associationUuid: ids.association,
    members: [],
  },
  location: {
    uuid: ids.location,
    name: "Sporthalle Test",
    address: { city: "Freiburg", postcode: "79098", country: "DE" },
  },
  event: {
    uuid: ids.event,
    name: "Referee Course",
    shortname: "Ref",
    associationUuid: ids.association,
    canceled: false,
    dateNotYetKnown: false,
  },
  eventType: {
    uuid: ids.eventType,
    name: "Training",
    description: "Training event",
    associationUuid: ids.association,
  },
  leagueRankingsPage: page([
    {
      uuid: ids.team,
      rank: 1,
      ballRatio: "Infinity",
      setRatio: "Infinity",
      scoreIncludingLosses: null,
      wins: 1,
      losses: 0,
      points: 2,
    },
  ]),
  competitionRankingsPage: page([
    {
      uuid: ids.matchGroup,
      matchGroupName: "Gruppe A",
      rankings: [
        {
          uuid: ids.team,
          rank: 1,
          ballRatio: "Infinity",
          setRatio: "Infinity",
        },
      ],
    },
  ]),
} as const;

const validated = {
  seasons: zGetAllSeasonsResponse.parse(fixtures.seasons),
  season: zGetSeasonByUuidResponse.parse(fixtures.season),
  hierarchiesForSeason: zGetLeagueHierarchiesForSeasonResponse.parse(page([fixtures.hierarchy])),
  hierarchy: zGetLeagueHierarchyByUuidResponse.parse(fixtures.hierarchy),
  leaguesByHierarchy: zGetLeaguesByLeagueHierarchyResponse.parse(page([fixtures.league])),
  competitionsByHierarchy: zGetCompetitionsByLeagueHierarchyResponse.parse(
    page([fixtures.competition]),
  ),
  superCompetitionsByHierarchy: zGetSuperCompetitionsByLeagueHierarchyResponse.parse(
    page([fixtures.superCompetition]),
  ),
  league: zGetLeagueByUuidResponse.parse(fixtures.league),
  matchDaysForLeague: zGetMatchDaysForLeagueResponse.parse(page([fixtures.matchDay])),
  leagueRankings: zGetRankingsForLeagueResponse.parse(fixtures.leagueRankingsPage),
  teamsForLeague: zGetTeamsForLeagueResponse.parse(page([fixtures.team, fixtures.teamGuest])),
  matchDay: zGetMatchDayByUuidResponse.parse(fixtures.matchDay),
  matchesByMatchDay: zGetMatchesByMatchDayResponse.parse(page([fixtures.leagueMatch])),
  leagueMatch: zGetLeagueMatchByUuidResponse.parse(fixtures.leagueMatch),
  leagueMatches: zGetAllLeagueMatchesResponse.parse(page([fixtures.leagueMatch])),
  team: zGetTeamByUuidResponse.parse(fixtures.team),
  teamGuest: zGetTeamByUuidResponse.parse(fixtures.teamGuest),
  roster: zGetTeamRosterByTeamUuidResponse.parse(fixtures.roster),
  competition: zGetCompetitionByUuidResponse.parse(fixtures.competition),
  matchGroupsForCompetition: zGetMatchGroupsForCompetitionResponse.parse(
    page([fixtures.matchGroup]),
  ),
  competitionRankings: zGetRankingsForCompetitionResponse.parse(fixtures.competitionRankingsPage),
  teamsForCompetition: zGetTeamsForCompetitionResponse.parse(
    page([fixtures.team, fixtures.teamGuest]),
  ),
  competitionMatches: zGetAllCompetitionMatchesWithFilterResponse.parse(
    page([fixtures.competitionMatch]),
  ),
  competitionMatch: zGetCompetitionMatchByUuidResponse.parse(fixtures.competitionMatch),
  superCompetition: zGetSuperCompetitionByUuidResponse.parse(fixtures.superCompetition),
  allLeagues: zGetAllLeaguesResponse.parse(page([fixtures.league])),
  allHierarchies: zGetAllLeagueHierarchiesResponse.parse(page([fixtures.hierarchy])),
  allMatchDays: zGetAllMatchDaysResponse.parse(page([fixtures.matchDay])),
  allMatchGroups: zGetAllMatchGroupsResponse.parse(page([fixtures.matchGroup])),
  matchGroup: zGetMatchGroupByUuidResponse.parse(fixtures.matchGroup),
  matchesByMatchGroup: zGetMatchesByMatchGroupResponse.parse(page([fixtures.competitionMatch])),
  allCompetitions: zGetAllCompetitionsResponse.parse(page([fixtures.competition])),
  allSuperCompetitions: zGetAllSuperCompetitionsResponse.parse(page([fixtures.superCompetition])),
  allTeams: zGetAllTeamsResponse.parse(page([fixtures.team, fixtures.teamGuest])),
  allSportsclubs: zGetAllSportsclubsResponse.parse(
    page([fixtures.sportsclub, fixtures.sportsclubGuest]),
  ),
  sportsclub: zGetSportsclubResponse.parse(fixtures.sportsclub),
  allAssociations: zGetAssociationsResponse.parse(page([fixtures.association])),
  association: zGetAssociationByUuidResponse.parse(fixtures.association),
  committeesForAssociation: zGetCommitteesForAssociationResponse.parse(page([fixtures.committee])),
  sportsclubsForAssociation: zGetSportsclubsForAssociationResponse.parse(
    page([fixtures.sportsclub, fixtures.sportsclubGuest]),
  ),
  allCommittees: zGetAllCommitteesResponse.parse(page([fixtures.committee])),
  committee: zGetCommitteeResponse.parse(fixtures.committee),
  allLocations: zGetAllLocationsResponse.parse(page([fixtures.location])),
  location: zGetLocationByUuidResponse.parse(fixtures.location),
  allEvents: zGetAllEventsResponse.parse(page([fixtures.event])),
  event: zGetEventByUuidResponse.parse(fixtures.event),
  eventTypes: zGetEventTypesResponse.parse([fixtures.eventType]),
  eventType: zGetEventTypeByUuidResponse.parse(fixtures.eventType),
};

export type ValidatedFixtures = typeof validated;

export function getValidatedFixtures(): ValidatedFixtures {
  return validated;
}
