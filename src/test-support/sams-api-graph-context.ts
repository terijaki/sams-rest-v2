const PAGE_SIZE = 5;
export const SAMS_GRAPH_DISCOVERY_PAGE_SIZE = 100;

export type UuidCarrier = { uuid?: string };

export type SamsApiGraphContext = {
  seasonUuid?: string;
  hierarchies: UuidCarrier[];
  hierarchyUuid?: string;
  leagueUuid?: string;
  competitionUuid?: string;
  superCompetitionUuid?: string;
  matchDayUuid?: string;
  teamUuid?: string;
  leagueMatchUuid?: string;
  competitionMatchUuid?: string;
  matchGroupUuid?: string;
  sportsclubUuid?: string;
  associationUuid?: string;
  committeeUuid?: string;
  locationUuid?: string;
  eventTypeUuid?: string;
};

export function createSamsApiGraphContext(): SamsApiGraphContext {
  return { hierarchies: [] };
}

export function pageItems<T>(page: { content?: T[] } | T[] | undefined): T[] {
  return Array.isArray(page) ? page : (page?.content ?? []);
}

export function firstUuid(items: UuidCarrier[] | undefined, label: string): string {
  const uuid = items?.find((item) => item.uuid)?.uuid;
  if (!uuid) {
    throw new Error(`No ${label} uuid found in live response`);
  }
  return uuid;
}

export function firstOptionalUuid(items: UuidCarrier[] | undefined): string | undefined {
  return items?.find((item) => item.uuid)?.uuid;
}

export function firstFromPage<T extends UuidCarrier>(
  page: { content?: T[] } | T[] | undefined,
  label: string,
): string {
  return firstUuid(pageItems(page), label);
}

export async function firstUuidFromCalls(
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

export const SAMS_GRAPH_PAGE_SIZE = PAGE_SIZE;
