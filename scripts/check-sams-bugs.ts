#!/usr/bin/env bun
/**
 * CLI entry for live upstream bug probes.
 *
 * Outputs JSON: { bugs: BugProbeResult[], checkedAt: string }
 * Exits 0 always — a "fixed" bug is good news, not a failure.
 * Exits 1 only when SAMS_API_KEY is missing or an unexpected error occurs.
 *
 * Probe logic lives in src/upstream/bug-probes.ts (importable, testable).
 * Registry: src/upstream/bugs.ts · docs/BUGS.md
 */

import { runUpstreamBugProbes } from "../src/upstream/bug-probes";

const apiKey = process.env.SAMS_API_KEY;
if (!apiKey) {
  console.error("Error: SAMS_API_KEY is not set.");
  process.exit(1);
}

const result = await runUpstreamBugProbes(apiKey);
console.log(JSON.stringify(result, null, 2));
