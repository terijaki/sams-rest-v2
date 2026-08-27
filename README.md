# sams-rest-v2

TypeScript client for the [SAMS REST API v2](https://wiki.sams-server.de/wiki/REST-API-Schnittstelle) — the backend behind regional volleyball sites such as [volleyball-baden.de](https://www.volleyball-baden.de). Install the package, configure your API key once, and call typed methods for seasons, teams, leagues, matches, and standings instead of hand-rolling HTTP requests.

## Install

Requires Node.js **22.18+**.

```bash
npm install sams-rest-v2
```

## Quick start

```ts
import { createSamsClient } from "sams-rest-v2";

const sams = createSamsClient({
  baseUrl: "https://www.volleyball-baden.de/api/v2",
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

Constants are exported for convenience:

```ts
import { SAMS_DEFAULT_BASE_URL, SAMS_SWAGGER_URL } from "sams-rest-v2";
```

## Known upstream quirks

The remote API has documented defects and spec mismatches. See [docs/BUGS.md](docs/BUGS.md) for verified findings (missing associations, nullable fields, date formats, etc.).

## Out of scope

This package is a generated API client only. It does not include club lists, DynamoDB integration, logo handling, match caching, or application-specific configuration.

## Contributing

Maintainer workflow, codegen, CI, and publishing: [docs/MAINTAINERS.md](docs/MAINTAINERS.md).
