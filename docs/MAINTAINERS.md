# Maintainer guide

Development workflow for `sams-rest-v2`. For package usage, see [README.md](../README.md).

## Prerequisites

- [Vite+](https://viteplus.dev/) (`vp`) — unified dev toolchain
- Node.js **22.18+**
- Bun **1.3.14** (resolved automatically via `packageManager` in `package.json`)

Install dependencies:

```bash
vp install
```

Cloud Agents bootstrap via `.cursor/environment.json` (installs `vp`, then `vp install --frozen-lockfile`).

## Day-to-day commands

| Command                 | Purpose                                                   |
| ----------------------- | --------------------------------------------------------- |
| `vp check`              | Format, lint, and type-check                              |
| `vp test`               | Unit tests (no live API, no key)                          |
| `vp pack`               | Build library to `dist/`                                  |
| `vp pm audit -- --prod` | Audit shipped dependencies (not dev tooling)              |
| `vp run generate`       | Regenerate client from upstream swagger                   |
| `vp run bugs`           | Live upstream bug probes (needs `SAMS_API_KEY`)           |
| `vp run smoke`          | Live `createSamsClient` smoke test (needs `SAMS_API_KEY`) |
| `vp run swagger:drift`  | Compare two `source.json` snapshots (CI helper)           |

Use `vp run <script>` for `package.json` scripts. Use built-in `vp test`, `vp check`, `vp pack` directly — not `npm run` / `bun run`.

TypeScript maintenance scripts run via **bun** (`bun ./scripts/...`), invoked through `vp run`.

## Codegen

Regenerate from the **public** swagger document. Never pass `SAMS_API_KEY` to codegen — swagger fetch is unauthenticated.

```bash
env -u SAMS_API_KEY vp run generate
```

- OpenAPI URL: `https://www.volleyball-baden.de/api/v2/swagger.json`
- Generator: `@hey-api/openapi-ts` pinned at **0.99.0**
- Schema patches: `src/codegen/schema-patches.ts`
- Generated output: `src/generated/`

Commit regenerated files when upstream changes.

## Live verification

Requires `SAMS_API_KEY` in the environment. **Never** log, commit, or print the key.

```bash
vp run bugs    # exits 0; reports still_present / fixed / check_failed per bug
vp run smoke   # public + protected endpoint; fails on HTTP 403
```

Fixture UUIDs for live checks: `scripts/check-sams-bugs.ts` (also referenced in [BUGS.md](BUGS.md)).

### Secrets

| Context           | Secret         | Purpose                 |
| ----------------- | -------------- | ----------------------- |
| Cursor My Secrets | `SAMS_API_KEY` | Cloud Agent live checks |
| GitHub Actions    | `SAMS_API_KEY` | Weekly bug-check job    |

These are **separate** — configuring one does not configure the other.

## CI workflows

| Workflow           | Trigger                | Purpose                                                   |
| ------------------ | ---------------------- | --------------------------------------------------------- |
| `ci.yml`           | PR / push to `main`    | `vp check`, `vp test`, `vp pack`, `vp pm audit -- --prod` |
| `version-bump.yml` | PR opened/updated      | Patch-bump `package.json` on PR branch                    |
| `publish.yml`      | Merge to `main`        | Verify, `npm publish` (OIDC), git tag/release             |
| `weekly.yml`       | Saturday cron / manual | Swagger drift, live bugs, drift PR                        |

### Weekly health check

1. **Swagger drift** — regenerate without key, semantically compare `src/generated/source.json`
2. **Bug check** — `vp run bugs` with `SAMS_API_KEY`
3. **Regenerate & verify** — `vp run generate`, `vp check`, `vp test`, `vp pack`
4. **Drift PR** — opens `sams-swagger-drift` branch when upstream changed

## Publishing

`main` is protected — changes land via reviewed PRs only.

1. **Version bump** — automatic on PR branch via `version-bump.yml`
2. **Publish** — on merge, `publish.yml` runs verify → `npm publish --access public --provenance` → `v*` release

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC from GitHub Actions). **Do not** replace `npm publish` with `bun publish` — bun does not support OIDC trusted publishing yet.

**One-time npm setup:**

1. Create `sams-rest-v2` on npmjs.com (or first manual publish)
2. Package → **Trusted Publisher** → GitHub Actions:
   - User/org: `terijaki`
   - Repository: `sams-rest-v2`
   - Workflow: `publish.yml`
3. Workflow needs `id-token: write` (already set)

## Project layout

```
src/
  create-sams-client.ts   # Configured client factory
  constants.ts            # Base URL + swagger URL
  codegen/                # Schema patches for hey-api
  generated/              # Generated SDK, types, Zod (do not hand-edit)
scripts/
  generate-client.ts      # Codegen entrypoint
  check-sams-bugs.ts      # Live bug probes
  smoke-test-client.ts    # Live client smoke test
  check-sams-swagger-drift.ts
docs/
  BUGS.md                 # Verified upstream API defects
  MAINTAINERS.md          # This file
```

## Related docs

- [BUGS.md](BUGS.md) — upstream API defects
- [AGENTS.md](../AGENTS.md) — AI agent context for this repository
