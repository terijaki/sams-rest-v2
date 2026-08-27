import { createSamsClient } from "../create-sams-client";
import { SAMS_DEFAULT_BASE_URL } from "../constants";
import { describeSamsApiGraphSuite } from "../test-support/api-graph";

function requireSamsApiKey(): string {
  const apiKey = process.env.SAMS_API_KEY;
  if (!apiKey) {
    throw new Error("SAMS_API_KEY is not set. Live API tests require a key.");
  }
  return apiKey;
}

describeSamsApiGraphSuite({
  suiteName: "SAMS API graph (live)",
  timeoutMs: 60_000,
  createClient: () =>
    createSamsClient({
      baseUrl: SAMS_DEFAULT_BASE_URL,
      apiKey: requireSamsApiKey(),
      throwOnError: true,
    }),
});
