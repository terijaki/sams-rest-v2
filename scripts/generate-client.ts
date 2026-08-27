#!/usr/bin/env npx tsx
/**
 * Generate the SAMS REST v2 fetch SDK, types, and Zod schemas.
 *
 * Fetches the public swagger document only. Do not attach SAMS_API_KEY (or any
 * other secret) to this request — the spec is unauthenticated and CI drift
 * checks run without the key on purpose.
 */

import { createClient } from "@hey-api/openapi-ts";
import { SAMS_SWAGGER_URL } from "../src/constants";
import { schemaPatches } from "../src/codegen/schema-patches";

if (process.env.SAMS_API_KEY) {
  // Keep the key out of codegen HTTP headers/logs even if it is present in the environment.
  delete process.env.SAMS_API_KEY;
}

await createClient({
  output: {
    path: "src/generated",
    preferExportAll: true,
    source: true,
  },
  input: SAMS_SWAGGER_URL,
  plugins: [
    {
      name: "zod",
      dates: {
        local: true, // Allow datetimes without timezone offset
        offset: true, // Allow datetimes with timezone offset like +00:00
      },
      metadata: true,
      types: {
        infer: false, // Must use infer: false due to Zod's type inference limitations with deeply-patched schemas.
      },
      exportFromIndex: true,
    },
    {
      name: "@hey-api/client-fetch",
    },
    {
      name: "@hey-api/sdk",
      validator: true,
    },
  ],
  parser: {
    patch: {
      schemas: schemaPatches,
    },
  },
});
