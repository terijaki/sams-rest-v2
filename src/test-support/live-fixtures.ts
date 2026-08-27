/**
 * Stable SAMS entity UUIDs for live probes and smoke tests.
 *
 * These are real production IDs (Baden-Württemberg volleyball, season 2025/26).
 * Pick entities that stay reachable across seasons where possible; update when the
 * upstream data moves.
 */
export const LIVE_FIXTURES = {
  /**
   * Men's Verbandsliga — league with rankings and match-days.
   * Label in SAMS: "Verbandsliga Herren".
   */
  leagueUuid: "2000b48f-eec8-4927-beb1-c4568069ebec",
  /**
   * Sample team used for logo / nullable-string probes.
   * Label in SAMS: VC Müllheim 1 (Herren).
   */
  teamUuid: "c2ddea7c-b7ec-4172-aa85-4d9c47aba362",
} as const;
