# SAMS REST v2 client (`sams-rest-v2`)

Generated client for the [SAMS REST API v2](https://wiki.sams-server.de/wiki/REST-API-Schnittstelle). OpenAPI is fetched from `https://www.volleyball-baden.de/api/v2/swagger.json`.

Requires Node.js **22.18+** (`@hey-api/openapi-ts` 0.99) and TypeScript **6.x** (7.x breaks codegen until hey-api catches up).

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

Regenerate from the **public** swagger document ([API docs](https://wiki.sams-server.de/wiki/REST-API-Schnittstelle)). Do not pass `SAMS_API_KEY` to this step.

```bash
vp run generate
```

`@hey-api/openapi-ts` is pinned at **0.99.0**. Schema patches live in `src/codegen/schema-patches.ts` (lifted from vcmuellheim `parser.patch.schemas`).

## Tests

```bash
vp test
```

Unit tests cover client headers, schema patches, generated Zod fixtures, and semantic swagger drift. They do not call the live API and do not need a key.

## Build

Package the library for npm with [Vite+ pack](https://viteplus.dev/guide/pack):

```bash
vp pack
```

Requires [Bun](https://bun.sh/) (`packageManager: bun@1.3.14`) and Node.js **22.18+**.

## Live bug probes

Known upstream bugs are re-checked against the real API:

```bash
SAMS_API_KEY=… bun run bugs
```

Use the key only for this command (and the weekly CI job). Never print, log, commit, or put it in fixtures.

## Publishing

Every push to `main` (except release commits tagged `chore(release): …`) runs `.github/workflows/publish.yml`:

1. `vp check`, `vp test`, `vp pack`
2. `npm version patch`
3. `npm publish --access public --provenance`
4. Push the version bump and git tag to `main`

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC from GitHub Actions). No long-lived `NPM_TOKEN` is stored in the repo.

**One-time setup** on [npmjs.com](https://www.npmjs.com/):

1. Create the `sams-rest-v2` package (or run the first publish manually once).
2. Package → **Trusted Publisher** → GitHub Actions:
   - Organization/user: `terijaki`
   - Repository: `sams-rest-v2`
   - Workflow filename: `publish.yml`
3. Ensure workflow permissions allow `id-token: write` (already set in `publish.yml`).

## Weekly CI

`.github/workflows/weekly.yml` runs every Saturday:

1. **Swagger drift** — regenerate from the public spec (no key) and compare `src/generated/source.json` semantically (key order ignored).
2. **Live bug probes** — uses the `SAMS_API_KEY` repository secret.
3. **Auto-commit drift** — if upstream changed and verification passed, push regenerated `src/generated` to `main` (the publish workflow then releases a new patch version).

Repository secret:

- `SAMS_API_KEY` — live probes only

## Out of scope

Club lists, DynamoDB, logos, match cache, and app `project.config`.
