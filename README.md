# SAMS REST v2 client (`sams-rest-v2`)

Requires Node.js **22.18+** (`@hey-api/openapi-ts` 0.99).

## Install

```bash
npm install sams-rest-v2
```

## Usage

```ts
import { createSamsClient } from "sams-rest-v2";

const sams = createSamsClient({
  baseUrl: "https://www.volleyball-baden.de/api/v2",
  apiKey: process.env.SAMS_API_KEY!,
});

const { data: seasons } = await sams.getAllSeasons();
const { data: team } = await sams.getTeamByUuid({ path: { uuid } });
```

`createSamsClient` always sends `Accept: */*` and `X-API-Key`. The API serves `application/hal+json`; `Accept: application/json` returns HTTP 406.

SDK functions, types, and Zod schemas are also re-exported from the package root:

```ts
import { createSamsClient, getAllSeasons, zTeamDto } from "sams-rest-v2";

const client = createSamsClient({ baseUrl, apiKey }).client;
const { data } = await getAllSeasons({ client });
```

## Codegen

Regenerate from the **public** swagger document. Do not pass `SAMS_API_KEY` to this step.

```bash
npm run generate
```

`@hey-api/openapi-ts` is pinned at **0.99.0**. Schema patches live in `src/codegen/schema-patches.ts` (lifted from vcmuellheim `parser.patch.schemas`).

## Tests

```bash
npm test
```

Unit tests cover client headers, schema patches, generated Zod fixtures, and semantic swagger drift. They do not call the live API and do not need a key.

## Live bug probes

Known upstream bugs are re-checked against the real API:

```bash
SAMS_API_KEY=… npm run bugs
```

Use the key only for this command (and the weekly CI job). Never print, log, commit, or put it in fixtures.

## Weekly CI

`.github/workflows/weekly.yml` runs every Saturday:

1. **Swagger drift** — regenerate from the public spec (no key) and compare `src/generated/source.json` semantically (key order ignored).
2. **Live bug probes** — `SAMS_API_KEY` repository secret.
3. **Publish** — if there is real spec drift and verification passed, commit the regenerated client, patch-bump, and `npm publish`.

Repository secrets:

- `SAMS_API_KEY` — live probes only
- `NPM_TOKEN` — publish on real swagger change

## Out of scope

Club lists, DynamoDB, logos, match cache, and app `project.config`.
