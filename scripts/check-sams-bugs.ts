#!/usr/bin/env bun
/**
 * CLI entry for live upstream bug probes.
 *
 * Outputs JSON: { bugs: BugProbeResult[], checkedAt: string }
 * When GITHUB_OUTPUT / GITHUB_STEP_SUMMARY are set (Actions), also appends job
 * outputs and the step summary. Do not redirect `vp run bugs` stdout — Vite+
 * prints a command banner that is not valid JSON.
 *
 * Exits 0 always — a "fixed" bug is good news, not a failure.
 * Exits 1 only when SAMS_API_KEY is missing or an unexpected error occurs.
 *
 * Probe logic lives in src/upstream/bug-probes.ts (importable, testable).
 * Registry: src/upstream/bugs.ts · docs/BUGS.md
 */

import { appendFileSync } from "node:fs";
import { runUpstreamBugProbes } from "../src/upstream/bug-probes";
import { formatBugCheckGithubOutput, formatBugCheckStepSummary } from "./sams-bug-check";

const apiKey = process.env.SAMS_API_KEY;
if (!apiKey) {
  console.error("Error: SAMS_API_KEY is not set.");
  process.exit(1);
}

const result = await runUpstreamBugProbes(apiKey);

const githubOutputPath = process.env.GITHUB_OUTPUT;
if (githubOutputPath) {
  appendFileSync(githubOutputPath, formatBugCheckGithubOutput(result));
}

const githubStepSummaryPath = process.env.GITHUB_STEP_SUMMARY;
if (githubStepSummaryPath) {
  appendFileSync(githubStepSummaryPath, formatBugCheckStepSummary(result));
}

console.log(JSON.stringify(result, null, 2));
