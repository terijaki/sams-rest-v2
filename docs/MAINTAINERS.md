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

Cloud Agents bootstrap via `.cursor/environment.json`. The install script downloads Vite+, exports `~/.local/share/vite-plus/bin` on `PATH` in the same shell, then runs `vp install --frozen-lockfile`. Local Cursor does not run this file.

## Day-to-day commands

| Command                 | Purpose                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `vp check`              | Format, lint, and type-check                                                          |
| `vp check --fix`        | Same as `vp check`, with autofix                                                      |
| `vp test`               | Unit tests + MSW contract suite (no live API, no key)                                 |
| `vp run test:api`       | Live SDK graph test through production SAMS (needs key)                               |
| `vp pack`               | Build library to `dist/`                                                              |
| `vp pm audit -- --prod` | Audit shipped dependencies (not dev tooling)                                          |
| `vp run generate`       | Regenerate client from upstream swagger                                               |
| `vp run bugs`           | Live upstream bug probes — JSON report, always exits 0 (`src/upstream/bug-probes.ts`) |
| `vp run smoke`          | Fast live header/key check (`src/live/sams-smoke.live.test.ts`, needs key)            |
| `vp run swagger:drift`  | Compare two `source.json` snapshots (CI helper)                                       |

Use `vp run <script>` for custom `package.json` scripts only. Call built-in `vp test`, `vp check`, `vp pack` directly — not `npm run`, `bun run`, or wrapper scripts. Do not add scripts that mirror built-in names (`check`, `test`, `pack`); it triggers Vite+ collision warnings in CI logs.

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

Baseline endpoint manifest (`src/test-support/baseline-endpoints.ts`): SDK operations a typical club-site integration needs. CI appends a job summary (`scripts/write-ci-test-summary.ts`) listing each graph endpoint case after `vp test` / live tests. Graph suites use `describeSamsApiGraphSuite` so Vitest reports one case per SDK operation.

### Tests vs scripts

| Kind                                                               | Examples                                                | Role                                                                                                                                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vitest** (`vp test`, `vp run test:api`, `vp run smoke`)          | unit, MSW contract, live graph, live smoke, live roster | Pass/fail gates — fail CI on regression                                                                                                                                    |
| **Scripts** (`vp run bugs`, `generate`, `swagger:drift`, `notify`) | JSON reports, codegen, workflow glue                    | `bugs` always exits 0 (a fixed upstream bug is good news); weekly health only. `vp run bugs` writes Actions outputs to `$GITHUB_OUTPUT` — do not parse its stdout as JSON. |

Upstream defect registry: `src/upstream/bugs.ts` (slug + numeric id). Live probe implementations: `src/upstream/bug-probes.ts`. Human-readable catalogue: [BUGS.md](BUGS.md). Prefer **slug** in code comments; numeric **#** remains in weekly reports for history.

### Secrets

| Context           | Secret         | Purpose                 |
| ----------------- | -------------- | ----------------------- |
| Cursor My Secrets | `SAMS_API_KEY` | Cloud Agent live checks |
| GitHub Actions    | `SAMS_API_KEY` | Weekly bug-check job    |

These are **separate** — configuring one does not configure the other.

## CI workflows

Job names use a `Category: detail` schema (e.g. `Test: unit`, `Release: version bump`).

| Workflow           | Trigger                | Jobs                                                                                                      | Purpose                                                                                                       |
| ------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `ci.yml`           | PR                     | `Test: unit`, `Test: live API`                                                                            | Unit: `vp check`, `vp test`, `vp pack`, `vp pm audit -- --prod`; live: `vp test src/live` with `SAMS_API_KEY` |
| `version-bump.yml` | PR opened/updated      | `Release: version bump`                                                                                   | Patch-bump `package.json` on PR branch only when published package content changed vs `main`                  |
| `publish.yml`      | Merge to `main`        | `Test: verify`, `Release: publish`                                                                        | Verify (unit + pack + live API) → `npm publish` (OIDC) and git tag/release only if the version is new on npm  |
| `weekly.yml`       | Saturday cron / manual | `Health: swagger drift`, `Health: bug probes`, `Health: regenerate`, `Health: drift PR`, `Health: notify` | Swagger drift, live bugs, regenerate/verify, drift PR, actionable notifications                               |

### Weekly health check

Jobs: `Health: swagger drift`, `Health: bug probes`, `Health: regenerate`, `Health: drift PR`, `Health: notify`.

1. **Swagger drift** — regenerate without key, semantically compare `src/generated/source.json`
2. **Bug check** — `vp run bugs` with `SAMS_API_KEY` (writes `$GITHUB_OUTPUT` / step summary; do not redirect stdout — Vite+ prints a command banner)
3. **Regenerate & verify** — `vp run generate`, `vp check`, `vp test`, `vp pack`
4. **Drift PR** — opens `sams-swagger-drift` branch when upstream changed

## Dependabot

Configured in [`.github/dependabot.yml`](../.github/dependabot.yml). Version updates are low-frequency; security updates are immediate.

Version-update PRs wait at least **14 days** after a release (`cooldown.default-days`; majors/minors use 60 / 30 days). Local installs use a shorter floor via [`bunfig.toml`](../bunfig.toml) (`minimumReleaseAge = 259200`, 3 days); `vp install` delegates to Bun and honors that file.

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

1. **Version bump** — `version-bump.yml` patch-bumps the PR branch only when published package content changed vs `main` (`src/index.ts`, `src/create-sams-client.ts`, `src/constants.ts`, `src/generated/`, `README.md`, `LICENSE`, `vite.config.ts`, or consumer-facing `package.json` keys). Tooling, workflows, docs, tests, live probes, and codegen patches do not bump. `vp run release-needed` classifies the diff (`scripts/package-content-changed.ts`).
2. **CI on PR** — `ci.yml` gates merge via branch protection
3. **Publish on merge** — `publish.yml` runs chained verify job then publish (not parallel with `ci.yml`) only when `package.json` version is newer than `npm view sams-rest-v2 version`; otherwise it skips `npm publish` and git tag/release. GitHub release notes use the merged PR's `## Summary` section when present, otherwise GitHub auto-generated notes

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
  sams-bug-check.ts       # GitHub output helpers for bug probes
  sams-health-notify.ts   # Weekly notify issue body
  check-sams-swagger-drift.ts
  package-content-changed.ts # Whether a PR should bump / publish
  check-package-content-changed.ts # CLI for vp run release-needed
docs/
  BUGS.md                 # Verified upstream API defects
  MAINTAINERS.md          # This file
.github/
  dependabot.yml          # Dependency update schedule
```

## Related docs

- [BUGS.md](BUGS.md) — upstream API defects
- [AGENTS.md](../AGENTS.md) — AI agent context for this repository
