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

| Command                 | Purpose                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `vp check`              | Format, lint, and type-check                                                          |
| `vp test`               | Unit tests + MSW contract suite (no live API, no key)                                 |
| `vp run test:api`       | Live SDK graph test through production SAMS (needs key)                               |
| `vp pack`               | Build library to `dist/`                                                              |
| `vp pm audit -- --prod` | Audit shipped dependencies (not dev tooling)                                          |
| `vp run generate`       | Regenerate client from upstream swagger                                               |
| `vp run bugs`           | Live upstream bug probes — JSON report, always exits 0 (`src/upstream/bug-probes.ts`) |
| `vp run smoke`          | Fast live header/key check (`src/live/sams-smoke.live.test.ts`, needs key)            |
| `vp run swagger:drift`  | Compare two `source.json` snapshots (CI helper)                                       |

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

Fixture UUIDs for live checks: `src/test-support/live-fixtures.ts` (also referenced in [BUGS.md](BUGS.md)).

Baseline endpoint manifest (`src/test-support/baseline-endpoints.ts`): SDK operations a typical club-site integration needs (seasons, leagues, teams, rosters, rankings, matches, associations, sportsclubs). The unit test `baseline-endpoints.test.ts` asserts the graph step list calls each one. Graph suites use `describeSamsApiGraphSuite` so Vitest reports one case per SDK operation (e.g. `getTeamRosterByTeamUuid`) instead of a single monolithic pass/fail.

### Tests vs scripts

| Kind                                                               | Examples                                                | Role                                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Vitest** (`vp test`, `vp run test:api`, `vp run smoke`)          | unit, MSW contract, live graph, live smoke, live roster | Pass/fail gates — fail CI on regression                                       |
| **Scripts** (`vp run bugs`, `generate`, `swagger:drift`, `notify`) | JSON reports, codegen, workflow glue                    | `bugs` always exits 0 (a fixed upstream bug is good news); weekly health only |

Upstream defect registry: `src/upstream/bugs.ts` (slug + numeric id). Live probe implementations: `src/upstream/bug-probes.ts`. Human-readable catalogue: [BUGS.md](BUGS.md). Prefer **slug** in code comments; numeric **#** remains in weekly reports for history.

### Secrets

| Context           | Secret         | Purpose                 |
| ----------------- | -------------- | ----------------------- |
| Cursor My Secrets | `SAMS_API_KEY` | Cloud Agent live checks |
| GitHub Actions    | `SAMS_API_KEY` | Weekly bug-check job    |

These are **separate** — configuring one does not configure the other.

## CI workflows

| Workflow           | Trigger                | Purpose                                                                                                              |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`           | PR                     | Unit job: `vp check`, `vp test`, `vp pack`, `vp pm audit -- --prod`; then live `vp run test:api` with `SAMS_API_KEY` |
| `version-bump.yml` | PR opened/updated      | Patch-bump `package.json` on PR branch                                                                               |
| `publish.yml`      | Merge to `main`        | Verify (incl. live `vp run test:api`) → `npm publish` (OIDC), git tag/release                                        |
| `weekly.yml`       | Saturday cron / manual | Swagger drift, live bugs, drift PR                                                                                   |

### Weekly health check

1. **Swagger drift** — regenerate without key, semantically compare `src/generated/source.json`
2. **Bug check** — `vp run bugs` with `SAMS_API_KEY`
3. **Regenerate & verify** — `vp run generate`, `vp check`, `vp test`, `vp pack`
4. **Drift PR** — opens `sams-swagger-drift` branch when upstream changed

## Dependabot

Configured in [`.github/dependabot.yml`](../.github/dependabot.yml). Version updates are low-frequency; security updates are immediate.

### Schedule

| Ecosystem        | Version updates             | Security updates    |
| ---------------- | --------------------------- | ------------------- |
| `bun`            | Monthly (1st, 06:00 UTC)    | Immediate (grouped) |
| `github-actions` | Quarterly (Jan/Apr/Jul/Oct) | Immediate (grouped) |

Expected volume: ≤3 bun version PRs/month, ≤1 actions version PR/quarter, plus grouped security PRs when advisories appear.

### Version-update groups (bun)

| Group                 | What it covers                             |
| --------------------- | ------------------------------------------ |
| `production`          | Shipped deps (`zod`) — patch/minor         |
| `dev-toolchain-patch` | Vite+, TypeScript, `@types/node` — patches |
| `dev-toolchain-minor` | Same toolchain — minors                    |
| `dev-other`           | Remaining dev deps — patch/minor           |

Ignored for version updates: `@hey-api/openapi-ts` (pinned at 0.99.0), `typescript` majors (TS 7 breaks codegen). Security updates for these still open PRs via `security-all`.

### Repo settings (one-time)

Under **Settings → Code security and analysis**, enable:

- Dependabot alerts
- Dependabot security updates
- Grouped security updates

Optional **auto-triage** (Settings → Dependabot): auto-dismiss low severity on development dependencies; keep high/critical and production alerts active.

### Merging Dependabot PRs

Before merge:

```bash
vp test && vp check && vp pack && vp pm audit -- --prod
```

Close without merging when:

- A version PR tries to bump `@hey-api/openapi-ts` despite ignore (misconfiguration)
- A major toolchain bump needs deliberate testing (especially Vite+ / codegen)

Security PRs bypass the monthly/quarterly schedule and cooldown.

## Publishing

`main` is protected — changes land via reviewed PRs only.

1. **Version bump** — automatic on PR branch via `version-bump.yml`
2. **CI on PR** — `ci.yml` gates merge via branch protection
3. **Publish on merge** — `publish.yml` runs chained verify job then publish (not parallel with `ci.yml`)

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
  upstream/               # Bug registry + live probes
  live/                   # Live API vitest suites (graph + smoke)
  test-support/           # Graph walker + live fixture UUIDs
scripts/
  generate-client.ts      # Codegen entrypoint
  check-sams-bugs.ts      # Thin CLI for vp run bugs
  check-sams-swagger-drift.ts
docs/
  BUGS.md                 # Verified upstream API defects
  MAINTAINERS.md          # This file
.github/
  dependabot.yml          # Dependency update schedule
```

## Related docs

- [BUGS.md](BUGS.md) — upstream API defects
- [AGENTS.md](../AGENTS.md) — AI agent context for this repository
