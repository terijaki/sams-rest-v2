import { describe, expect, it, vi } from "vite-plus/test";
import { createSamsClient } from "./create-sams-client";
import { SAMS_DEFAULT_BASE_URL } from "./constants";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/hal+json" },
  });
}

describe("createSamsClient", () => {
  it("requires a non-empty baseUrl and apiKey without echoing the key", () => {
    expect(() => createSamsClient({ baseUrl: "", apiKey: "secret-value" })).toThrowError(/baseUrl/);
    expect(() => createSamsClient({ baseUrl: SAMS_DEFAULT_BASE_URL, apiKey: "" })).toThrowError(
      /apiKey/,
    );

    try {
      createSamsClient({ baseUrl: SAMS_DEFAULT_BASE_URL, apiKey: "" });
    } catch (error) {
      expect(String(error)).not.toContain("secret");
    }
  });

  it("always sends Accept: */* and X-API-Key, even when extra headers are provided", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      expect(request.headers.get("Accept")).toBe("*/*");
      expect(request.headers.get("X-API-Key")).toBe("test-fixture-key");
      expect(request.headers.get("X-Extra")).toBe("1");
      expect(request.url).toBe("https://example.test/api/v2/seasons");
      return jsonResponse([]);
    });

    const sams = createSamsClient({
      baseUrl: "https://example.test/api/v2/",
      apiKey: "test-fixture-key",
      headers: {
        Accept: "application/json",
        "X-API-Key": "should-not-win",
        "X-Extra": "1",
      },
      fetch: fetchMock as typeof fetch,
    });

    const result = await sams.getAllSeasons();
    expect("error" in result ? result.error : undefined).toBeUndefined();
    expect(result.data).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("binds SDK methods to the created client so callers do not pass { client }", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => jsonResponse({ uuid: "team-1", name: "VC Test 1" }),
    );

    const sams = createSamsClient({
      baseUrl: "https://example.test/api/v2",
      apiKey: "test-fixture-key",
      fetch: fetchMock as typeof fetch,
    });

    const { data } = await sams.getTeamByUuid({ path: { uuid: "team-1" } });
    expect(data).toMatchObject({ uuid: "team-1", name: "VC Test 1" });
    expect(fetchMock).toHaveBeenCalled();
    const [input, init] = fetchMock.mock.calls[0];
    const request = input instanceof Request ? input : new Request(input, init);
    expect(request.url).toBe("https://example.test/api/v2/teams/team-1");
    expect(request.headers.get("X-API-Key")).toBe("test-fixture-key");
  });
});
