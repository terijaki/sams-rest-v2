#!/usr/bin/env tsx
/**
 * Live smoke test for createSamsClient against the SAMS API.
 *
 * Requires SAMS_API_KEY in the environment. Never prints the key.
 * Used for post-merge verification (issue #4).
 */

import { createSamsClient } from "../src/create-sams-client";
import { SAMS_DEFAULT_BASE_URL } from "../src/constants";

// VC Müllheim 1 (Herren) — same fixture as scripts/check-sams-bugs.ts (docs/BUGS.md bug #2)
const VC_MULLHEIM_TEAM_UUID = "c2ddea7c-b7ec-4172-aa85-4d9c47aba362";

const apiKey = process.env.SAMS_API_KEY;
if (!apiKey) {
  console.error("Error: SAMS_API_KEY is not set.");
  process.exit(1);
}

const capturedHeaders: Record<string, string> = {};
const fetchSpy = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const request = new Request(input, init);
  request.headers.forEach((value, key) => {
    capturedHeaders[key.toLowerCase()] = value;
  });
  return fetch(input, init);
};

const sams = createSamsClient({
  baseUrl: SAMS_DEFAULT_BASE_URL,
  apiKey,
  fetch: fetchSpy,
});

function assertRequestHeaders(): void {
  if (capturedHeaders.accept !== "*/*") {
    console.error(`Expected Accept: */*, got: ${capturedHeaders.accept}`);
    process.exit(1);
  }

  if (!capturedHeaders["x-api-key"]) {
    console.error("Expected X-API-Key header on request");
    process.exit(1);
  }
}

function failOnForbidden(endpoint: string, status: number | undefined): void {
  if (status === 403) {
    console.error(`${endpoint} returned HTTP 403 — invalid or missing API key`);
    process.exit(1);
  }
}

// Public endpoint — no auth required, but client still sends X-API-Key
const seasonsResult = await sams.getAllSeasons();

if (seasonsResult.response?.status === 403) {
  failOnForbidden("getAllSeasons", seasonsResult.response.status);
}

if (seasonsResult.error) {
  console.error("getAllSeasons failed:", seasonsResult.error);
  process.exit(1);
}

assertRequestHeaders();

// Protected endpoint — requires a valid X-API-Key
const teamResult = await sams.getTeamByUuid({ path: { uuid: VC_MULLHEIM_TEAM_UUID } });

failOnForbidden("getTeamByUuid", teamResult.response?.status);

if (teamResult.error) {
  console.error("getTeamByUuid failed:", teamResult.error);
  process.exit(1);
}

if (!teamResult.data || typeof teamResult.data !== "object" || !("uuid" in teamResult.data)) {
  console.error("getTeamByUuid returned unexpected payload");
  process.exit(1);
}

console.log(
  JSON.stringify({
    ok: true,
    seasonCount: Array.isArray(seasonsResult.data) ? seasonsResult.data.length : 0,
    teamUuid: teamResult.data.uuid,
    headers: { accept: capturedHeaders.accept, hasApiKey: true },
  }),
);
