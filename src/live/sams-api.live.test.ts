import { describe, expect, it } from "vite-plus/test";
import { createSamsClient } from "../create-sams-client";
import { SAMS_DEFAULT_BASE_URL } from "../constants";
import { walkSamsApiGraph } from "../test-support/api-graph";

function requireSamsApiKey(): string {
  const apiKey = process.env.SAMS_API_KEY;
  if (!apiKey) {
    throw new Error("SAMS_API_KEY is not set. Live API tests require a key.");
  }
  return apiKey;
}

describe("live SAMS API", () => {
  it("walks the SAMS GET graph against production", async () => {
    const sams = createSamsClient({
      baseUrl: SAMS_DEFAULT_BASE_URL,
      apiKey: requireSamsApiKey(),
      throwOnError: true,
    });

    await expect(walkSamsApiGraph(sams)).resolves.toBeUndefined();
  }, 60_000);
});
