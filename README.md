# sams-rest-v2

TypeScript client for the [SAMS REST API v2](https://wiki.sams-server.de/wiki/REST-API-Schnittstelle) — the shared backend used by volleyball federations and leagues (Bundesliga, DVV, state associations, and more). Each federation runs on its own host; point `baseUrl` at `https://<host>/api/v2` for yours (see the [official host list](https://wiki.sams-server.de/wiki/REST-API-Schnittstelle#Abfragen)). Install the package, set your API key, and call typed methods for seasons, teams, leagues, matches, and standings.

## Install

```bash
pnpm add sams-rest-v2
bun add sams-rest-v2
deno add npm:sams-rest-v2
```

Requires Node.js **22.18+** (pnpm/Bun) or a recent Deno release.

## Quick start

```ts
import { createSamsClient } from "sams-rest-v2";

const sams = createSamsClient({
  baseUrl: "https://<your-federation-host>/api/v2",
  apiKey: process.env.SAMS_API_KEY!,
});

const { data: seasons } = await sams.getAllSeasons();
const { data: team } = await sams.getTeamByUuid({ path: { uuid } });
```

`createSamsClient` always sends `Accept: */*` and `X-API-Key` on every request.

## API notes

- **Authentication:** Most endpoints require a valid `X-API-Key`. A few public endpoints (e.g. `/seasons`) work without one, but the client still sends the key when configured.
- **Content type:** Responses are `application/hal+json`. Sending `Accept: application/json` returns HTTP **406** — use `Accept: */*` (the default with `createSamsClient`).
- **Errors:** SDK methods return `{ data, error, response }` unless `throwOnError` is enabled on the underlying client.

## Advanced usage

Use the low-level SDK functions with an explicit client when you need more control:

```ts
import { createSamsClient, getAllSeasons, zTeamDto } from "sams-rest-v2";

const { client } = createSamsClient({ baseUrl, apiKey });
const { data } = await getAllSeasons({ client });

// Zod schemas for runtime validation
const parsed = zTeamDto.parse(data);
```

Constants are exported for convenience (defaults to one federation host — override `baseUrl` for yours):

```ts
import { SAMS_DEFAULT_BASE_URL, SAMS_SWAGGER_URL } from "sams-rest-v2";
```

## Known upstream quirks

The remote API has documented defects and spec mismatches. See [docs/BUGS.md](docs/BUGS.md) for verified findings (missing associations, nullable fields, date formats, etc.).

## Out of scope

This package is a generated API client only. It does not include club lists, DynamoDB integration, logo handling, match caching, or application-specific configuration.

## Contributing

Maintainer workflow, codegen, CI, and publishing: [docs/MAINTAINERS.md](docs/MAINTAINERS.md).
