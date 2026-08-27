# Agent guide — `sams-rest-v2`

Context for AI agents working in this repository.

## What this repo is

A **generated npm package** (`sams-rest-v2`) providing a TypeScript fetch SDK, types, and Zod schemas for the SAMS REST API v2 (`https://www.volleyball-baden.de/api/v2`).

- **Consumers** install from npm and use `createSamsClient` — see [README.md](README.md)
- **Maintainers** regenerate, test, and publish — see [docs/MAINTAINERS.md](docs/MAINTAINERS.md)

## Toolchain rules

Use **Vite+ (`vp`)** as the dev entry point. It resolves the configured package manager (bun).

| Do                                               | Don't                                                |
| ------------------------------------------------ | ---------------------------------------------------- |
| `vp test`, `vp check`, `vp pack`                 | `npm run test`, `bun run test`                       |
| `vp run generate`, `vp run bugs`, `vp run smoke` | Direct `bun ./scripts/...` in docs/CI (use `vp run`) |
| `vp install --frozen-lockfile`                   | `bun install` / `npm ci` in docs                     |
| `npm publish` in `publish.yml` only              | `bun publish` (no OIDC/provenance support)           |

TypeScript scripts in `scripts/` are executed by **bun** via `package.json` scripts, not by a separate `tsx` dependency.

## Secrets — critical

`SAMS_API_KEY` is a **runtime secret** for live API calls.

- **Never** log, commit, print, or echo the key
- **Never** pass it to `vp run generate` / swagger fetch (public spec)
- Cloud Agent secrets are snapshotted at run start — a new agent run is needed after secret changes
- Cursor My Secrets ≠ GitHub Actions secrets (both may need separate configuration)

### Verify injection (without printing the key)

```bash
node -e "const k=process.env.SAMS_API_KEY; if(!k) process.exit(1); console.log('len='+k.length+' prefix='+k.slice(0,3)); if(k.length===49||k.slice(0,3)==='htt') process.exit(2)"
```

Valid key: length **36**, prefix **`3fe`**. Length 49 or prefix `htt` means stale/wrong injection — stop.

## Key files

| Path                            | Role                                                    |
| ------------------------------- | ------------------------------------------------------- |
| `src/create-sams-client.ts`     | Client factory; always sets `Accept: */*` + `X-API-Key` |
| `src/codegen/schema-patches.ts` | OpenAPI schema fixes before codegen                     |
| `src/generated/`                | Generated SDK — regenerate, don't hand-edit             |
| `scripts/generate-client.ts`    | Codegen (no API key)                                    |
| `scripts/check-sams-bugs.ts`    | Live bug probes (#2–#12)                                |
| `scripts/smoke-test-client.ts`  | Live smoke (public + protected endpoints)               |
| `docs/BUGS.md`                  | Documented upstream API defects                         |
| `.cursor/environment.json`      | Cloud Agent bootstrap (`vp install`)                    |
| `.github/dependabot.yml`        | Dependency update schedule and grouping                 |
| `vite.config.ts`                | Vite+ config (test, check, pack)                        |

## Verification checklist

When asked to verify the package or an issue:

```bash
vp install --frozen-lockfile
vp test && vp check && vp pack
vp pm audit -- --prod                 # shipped deps only; full audit may fail on dev tooling
env -u SAMS_API_KEY vp run generate   # must not use API key
vp run bugs                           # needs SAMS_API_KEY
vp run smoke                          # needs SAMS_API_KEY; fails on HTTP 403
```

Smoke test must hit a **protected** endpoint (e.g. `getTeamByUuid`), not only public `/seasons`.

### Dependabot PRs

Dependabot opens grouped PRs per [`.github/dependabot.yml`](.github/dependabot.yml). Before merging any Dependabot PR, run the verification checklist above. Do not auto-merge semver-major updates without review. Security PRs are immediate; version PRs follow monthly (bun) or quarterly (actions) schedules.

## API behaviour agents should know

- `/seasons` is public; most other endpoints need `X-API-Key`
- `Accept: application/json` → HTTP 406; client uses `Accept: */*`
- Responses are `application/hal+json`
- Upstream bugs documented in [docs/BUGS.md](docs/BUGS.md)

## Common tasks

### Regenerate after swagger change

```bash
env -u SAMS_API_KEY vp run generate
vp check && vp test && vp pack
# commit src/generated/ if changed
```

### Add a schema patch

Edit `src/codegen/schema-patches.ts`, regenerate, add/adjust tests in `src/codegen/schema-patches.test.ts`.

### Update smoke/bug fixtures

Known UUIDs live in `scripts/check-sams-bugs.ts` (e.g. VC Müllheim team `c2ddea7c-b7ec-4172-aa85-4d9c47aba362`).

## Out of scope

Do not add application logic (club lists, DynamoDB, logos, match cache, `project.config`). This repo is the SDK package only.

## PR expectations

- `main` is protected; work on feature branches
- Version bump is automated on PRs
- Publish happens on merge via OIDC — no manual `NPM_TOKEN`
- Keep README consumer-focused; put maintainer details in `docs/MAINTAINERS.md`
