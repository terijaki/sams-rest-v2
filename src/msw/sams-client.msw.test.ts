import { afterAll, afterEach, beforeAll, describe, expect, it } from "vite-plus/test";
import { createSamsClient } from "../create-sams-client";
import { SAMS_DEFAULT_BASE_URL } from "../constants";
import { createForbiddenTeamHandler } from "./handlers";
import { ids } from "./fixtures";
import { server } from "./server";
import { describeSamsApiGraphSuite } from "../test-support/api-graph";

describe("createSamsClient against MSW", () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describeSamsApiGraphSuite({
    suiteName: "SAMS API graph",
    createClient: () =>
      createSamsClient({
        baseUrl: SAMS_DEFAULT_BASE_URL,
        apiKey: "test-fixture-key",
        throwOnError: true,
      }),
  });

  it("getTeamByUuid returns error instead of throwing when throwOnError is false", async () => {
    server.use(createForbiddenTeamHandler());

    const sams = createSamsClient({
      baseUrl: SAMS_DEFAULT_BASE_URL,
      apiKey: "test-fixture-key",
      throwOnError: false,
    });

    const result = await sams.getTeamByUuid({ path: { uuid: ids.teamGuest } });
    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.response?.status).toBe(403);
  });
});
