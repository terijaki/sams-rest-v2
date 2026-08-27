import { HttpResponse, http, type HttpHandler } from "msw";
import { SAMS_DEFAULT_BASE_URL } from "../constants";
import { getValidatedFixtures, ids } from "./fixtures";

const HAL_HEADERS = { "Content-Type": "application/hal+json" };
const BASE = SAMS_DEFAULT_BASE_URL;

function halJson(body: unknown, init?: ResponseInit): HttpResponse {
  return HttpResponse.json(body, {
    ...init,
    headers: {
      ...HAL_HEADERS,
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
}

function rejectUnlessAuthed(request: Request): HttpResponse | undefined {
  if (request.headers.get("Accept") !== "*/*") {
    return new HttpResponse(null, { status: 406 });
  }
  if (!request.headers.get("X-API-Key")) {
    return halJson({ message: "Forbidden" }, { status: 403 });
  }
  return undefined;
}

function createHandlers(): HttpHandler[] {
  const f = getValidatedFixtures();

  return [
    http.get(`${BASE}/`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson({ _links: { self: { href: `${BASE}/` } } });
    }),

    http.get(`${BASE}/seasons`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.seasons);
    }),

    http.get(`${BASE}/seasons/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.season) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.season);
    }),

    http.get(`${BASE}/seasons/:uuid/league-hierarchies`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.season) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.hierarchiesForSeason);
    }),

    http.get(`${BASE}/league-hierarchies`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.allHierarchies);
    }),

    http.get(`${BASE}/league-hierarchies/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.hierarchy) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.hierarchy);
    }),

    http.get(`${BASE}/league-hierarchies/:uuid/leagues`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.hierarchy) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.leaguesByHierarchy);
    }),

    http.get(`${BASE}/league-hierarchies/:uuid/competitions`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.hierarchy) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.competitionsByHierarchy);
    }),

    http.get(`${BASE}/league-hierarchies/:uuid/super-competitions`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.hierarchy) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.superCompetitionsByHierarchy);
    }),

    http.get(`${BASE}/leagues`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.allLeagues);
    }),

    http.get(`${BASE}/leagues/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.league) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.league);
    }),

    http.get(`${BASE}/leagues/:uuid/match-days`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.league) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.matchDaysForLeague);
    }),

    http.get(`${BASE}/leagues/:uuid/rankings`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.league) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.leagueRankings);
    }),

    http.get(`${BASE}/leagues/:uuid/teams`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.league) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.teamsForLeague);
    }),

    http.get(`${BASE}/match-days`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.allMatchDays);
    }),

    http.get(`${BASE}/match-days/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.matchDay) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.matchDay);
    }),

    http.get(`${BASE}/match-days/:uuid/league-matches`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.matchDay) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.matchesByMatchDay);
    }),

    http.get(`${BASE}/league-matches`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.leagueMatches);
    }),

    http.get(`${BASE}/league-matches/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.leagueMatch) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.leagueMatch);
    }),

    http.get(`${BASE}/teams`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.allTeams);
    }),

    http.get(`${BASE}/teams/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.team && params.uuid !== ids.teamGuest) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(params.uuid === ids.team ? f.team : f.teamGuest);
    }),

    http.get(`${BASE}/teams/:uuid/roster`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.team) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.roster);
    }),

    http.get(`${BASE}/competitions`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.allCompetitions);
    }),

    http.get(`${BASE}/competitions/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.competition) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.competition);
    }),

    http.get(`${BASE}/competitions/:uuid/match-groups`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.competition) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.matchGroupsForCompetition);
    }),

    http.get(`${BASE}/competitions/:uuid/rankings`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.competition) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.competitionRankings);
    }),

    http.get(`${BASE}/competitions/:uuid/teams`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.competition) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.teamsForCompetition);
    }),

    http.get(`${BASE}/competition-matches`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.competitionMatches);
    }),

    http.get(`${BASE}/competition-matches/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.competitionMatch) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.competitionMatch);
    }),

    http.get(`${BASE}/match-groups`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.allMatchGroups);
    }),

    http.get(`${BASE}/match-groups/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.matchGroup) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.matchGroup);
    }),

    http.get(`${BASE}/match-groups/:uuid/competition-matches`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.matchGroup) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.matchesByMatchGroup);
    }),

    http.get(`${BASE}/super-competitions`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.allSuperCompetitions);
    }),

    http.get(`${BASE}/super-competitions/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.superCompetition) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.superCompetition);
    }),

    http.get(`${BASE}/sportsclubs`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.allSportsclubs);
    }),

    http.get(`${BASE}/sportsclubs/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.sportsclub) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.sportsclub);
    }),

    http.get(`${BASE}/associations`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.allAssociations);
    }),

    http.get(`${BASE}/associations/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.association) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.association);
    }),

    http.get(`${BASE}/associations/:uuid/committees`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.association) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.committeesForAssociation);
    }),

    http.get(`${BASE}/associations/:uuid/sportsclubs`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.association) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.sportsclubsForAssociation);
    }),

    http.get(`${BASE}/committees`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.allCommittees);
    }),

    http.get(`${BASE}/committees/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.committee) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.committee);
    }),

    http.get(`${BASE}/locations`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.allLocations);
    }),

    http.get(`${BASE}/locations/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.location) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.location);
    }),

    http.get(`${BASE}/events`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.allEvents);
    }),

    http.get(`${BASE}/events/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.event) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.event);
    }),

    http.get(`${BASE}/event-types`, ({ request }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      return halJson(f.eventTypes);
    }),

    http.get(`${BASE}/event-types/:uuid`, ({ request, params }) => {
      const rejected = rejectUnlessAuthed(request);
      if (rejected) return rejected;
      if (params.uuid !== ids.eventType) {
        return halJson({ message: "Not found" }, { status: 404 });
      }
      return halJson(f.eventType);
    }),
  ];
}

export const handlers = createHandlers();

export function createForbiddenTeamHandler(): HttpHandler {
  return http.get(`${BASE}/teams/${ids.teamGuest}`, ({ request }) => {
    const rejected = rejectUnlessAuthed(request);
    if (rejected) return rejected;
    return halJson({ message: "Forbidden" }, { status: 403 });
  });
}
