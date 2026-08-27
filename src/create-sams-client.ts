import { createClient, type Client, type Config } from "./generated/client";
import * as sdk from "./generated/sdk.gen";

const REQUIRED_HEADERS = {
  Accept: "*/*",
  "X-API-Key": "",
} as const;

export type CreateSamsClientOptions = {
  /** SAMS REST v2 base URL, e.g. `https://www.volleyball-baden.de/api/v2`. */
  baseUrl: string;
  /** Value sent as `X-API-Key` on every request. Never logged by this helper. */
  apiKey: string;
} & Omit<Config, "baseUrl" | "headers"> & {
    headers?: HeadersInit;
  };

type SdkModule = typeof sdk;

type BoundSdk = {
  [K in keyof SdkModule]: SdkModule[K] extends (options: infer O) => infer R
    ? undefined extends O
      ? (options?: Omit<NonNullable<O>, "client">) => R
      : (options: Omit<O, "client">) => R
    : SdkModule[K];
};

export type SamsClient = BoundSdk & { client: Client };

function mergeAlwaysSamsHeaders(apiKey: string, extra?: HeadersInit): Record<string, string> {
  const headers: Record<string, string> = {};
  if (extra instanceof Headers) {
    extra.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(extra)) {
    for (const [key, value] of extra) {
      headers[key] = value;
    }
  } else if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value === undefined) continue;
      headers[key] = String(value);
    }
  }
  headers.Accept = REQUIRED_HEADERS.Accept;
  headers["X-API-Key"] = apiKey;
  return headers;
}

/**
 * Create a configured SAMS REST v2 client.
 *
 * Always sends the wildcard Accept header and `X-API-Key`. SDK methods on the
 * returned object are bound to that client so callers do not pass `{ client }`
 * on every call.
 */
export function createSamsClient(options: CreateSamsClientOptions): SamsClient {
  const { baseUrl, apiKey, headers: extraHeaders, ...rest } = options;

  if (typeof baseUrl !== "string" || baseUrl.trim().length === 0) {
    throw new Error("createSamsClient requires a non-empty baseUrl");
  }
  if (typeof apiKey !== "string" || apiKey.length === 0) {
    throw new Error("createSamsClient requires a non-empty apiKey");
  }

  const client = createClient({
    ...rest,
    baseUrl,
    headers: mergeAlwaysSamsHeaders(apiKey, extraHeaders),
  });

  const bound = {} as BoundSdk;
  for (const key of Object.keys(sdk) as (keyof SdkModule)[]) {
    const fn = sdk[key];
    if (typeof fn !== "function") continue;
    (bound as Record<string, unknown>)[key as string] = (opts?: object) =>
      (fn as (options: object) => unknown)({ ...opts, client });
  }

  return { ...bound, client };
}
