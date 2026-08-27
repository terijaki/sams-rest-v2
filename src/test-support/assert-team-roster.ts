import type { TeamOfficialDto, TeamPlayerDto, TeamRosterDto } from "../generated/types.gen";

function assertRosterMember(member: TeamPlayerDto | TeamOfficialDto, label: string): void {
  if (!member.uuid) {
    throw new Error(`${label} is missing uuid`);
  }
  if (!member.name?.trim()) {
    throw new Error(`${label} ${member.uuid} is missing name`);
  }
}

/**
 * Validates roster arrays and member identity fields consumers rely on
 * (vcmuellheim / markgraefler-volleys roster sync and display).
 */
export function assertTeamRosterStructure(roster: TeamRosterDto): void {
  if (roster.players !== undefined && !Array.isArray(roster.players)) {
    throw new Error("roster.players must be an array when present");
  }
  if (roster.officials !== undefined && !Array.isArray(roster.officials)) {
    throw new Error("roster.officials must be an array when present");
  }

  for (const player of roster.players ?? []) {
    assertRosterMember(player, "roster player");
  }
  for (const official of roster.officials ?? []) {
    assertRosterMember(official, "roster official");
  }
}

/** Fails when a team has no players or officials — use with known active teams in live tests. */
export function assertTeamRosterHasMembers(roster: TeamRosterDto): void {
  assertTeamRosterStructure(roster);

  const playerCount = roster.players?.length ?? 0;
  const officialCount = roster.officials?.length ?? 0;
  if (playerCount === 0 && officialCount === 0) {
    throw new Error("roster has no players or officials");
  }
}
