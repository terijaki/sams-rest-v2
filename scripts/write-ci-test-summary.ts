#!/usr/bin/env bun
/**
 * Append a GitHub Actions job summary for unit or live Vitest runs.
 *
 * Usage:
 *   bun scripts/write-ci-test-summary.ts unit vitest-unit.json
 *   bun scripts/write-ci-test-summary.ts live vitest-live.json
 */

import { appendFileSync, readFileSync } from "node:fs";
import {
  formatLiveCiSummaryMarkdown,
  formatUnitCiSummaryMarkdown,
  type VitestReport,
} from "../src/test-support/ci-test-summary";

const suite = process.argv[2];
const reportPath = process.argv[3];

if (suite !== "unit" && suite !== "live") {
  console.error("Usage: bun scripts/write-ci-test-summary.ts <unit|live> <vitest-report.json>");
  process.exit(1);
}

if (!reportPath) {
  console.error("Missing Vitest JSON report path");
  process.exit(1);
}

let report: VitestReport;
try {
  report = JSON.parse(readFileSync(reportPath, "utf8")) as VitestReport;
} catch (error) {
  console.error(`Failed to read Vitest report: ${String(error)}`);
  process.exit(1);
}

const markdown =
  suite === "unit" ? formatUnitCiSummaryMarkdown(report) : formatLiveCiSummaryMarkdown(report);

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  appendFileSync(summaryPath, markdown);
} else {
  process.stdout.write(markdown);
}
