#!/usr/bin/env bun
/**
 * CI helper for content-aware releases.
 *
 * Usage:
 *   bun scripts/check-package-content-changed.ts <changed-paths.txt> <base-package.json> <head-package.json>
 *   bun scripts/check-package-content-changed.ts --versions <local> [published]
 *
 * Writes `needed=true|false` to $GITHUB_OUTPUT when set.
 * Do not parse `vp run release-needed` stdout as the only signal — Vite+ prints a banner.
 *
 * Exits 0 when the check completes. Exits 1 on usage errors.
 */

import { appendFileSync, readFileSync } from "node:fs";
import {
  formatGithubNeededOutput,
  shouldBumpPackage,
  shouldPublishVersion,
} from "./package-content-changed";

function writeNeeded(needed: boolean, details: string): void {
  const githubOutputPath = process.env.GITHUB_OUTPUT;
  if (githubOutputPath) {
    appendFileSync(githubOutputPath, formatGithubNeededOutput(needed));
  }
  console.log(needed ? `needed=true ${details}` : `needed=false ${details}`);
}

const mode = process.argv[2];

if (mode === "--versions") {
  const localVersion = process.argv[3];
  if (!localVersion) {
    console.error(
      "Usage: bun scripts/check-package-content-changed.ts --versions <local> [published]",
    );
    process.exit(1);
  }
  const publishedVersion = process.argv[4] || "";
  const needed = shouldPublishVersion(localVersion, publishedVersion);
  writeNeeded(
    needed,
    needed
      ? `local ${localVersion} is newer than npm ${publishedVersion || "(unpublished)"}`
      : `local ${localVersion} is already on npm`,
  );
  process.exit(0);
}

const changedPathsFile = process.argv[2];
const basePackageFile = process.argv[3];
const headPackageFile = process.argv[4];

if (!changedPathsFile || !basePackageFile || !headPackageFile) {
  console.error(
    "Usage: bun scripts/check-package-content-changed.ts <changed-paths.txt> <base-package.json> <head-package.json>",
  );
  process.exit(1);
}

let changedPathsText: string;
let basePackageJson: unknown;
let headPackageJson: unknown;
try {
  changedPathsText = readFileSync(changedPathsFile, "utf8");
  basePackageJson = JSON.parse(readFileSync(basePackageFile, "utf8"));
  headPackageJson = JSON.parse(readFileSync(headPackageFile, "utf8"));
} catch (error) {
  console.error(`Failed to read release-needed inputs: ${String(error)}`);
  process.exit(1);
}

const changedPaths = changedPathsText
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const result = shouldBumpPackage({
  changedPaths,
  basePackageJson,
  headPackageJson,
});

writeNeeded(
  result.needed,
  result.reasons.length > 0 ? result.reasons.join(", ") : "no package content change",
);
process.exit(0);
