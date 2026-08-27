#!/usr/bin/env bun
/**
 * Live smoke test for createSamsClient against the SAMS API.
 *
 * Requires SAMS_API_KEY in the environment. Never prints the key.
 * Used for post-merge verification (issue #4).
 */

import { createSamsClient } from "../src/create-sams-client";
import { SAMS_DEFAULT_BASE_URL } from "../src/constants";

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

const { data, error } = await sams.getAllSeasons();

if (error) {
  console.error("getAllSeasons failed:", error);
  process.exit(1);
}

if (capturedHeaders.accept !== "*/*") {
  console.error(`Expected Accept: */*, got: ${capturedHeaders.accept}`);
  process.exit(1);
}

if (!capturedHeaders["x-api-key"]) {
  console.error("Expected X-API-Key header on request");
  process.exit(1);
}

console.log(
  JSON.stringify({
    ok: true,
    seasonCount: Array.isArray(data) ? data.length : 0,
    headers: { accept: capturedHeaders.accept, hasApiKey: true },
  }),
);
