/**
 * GitHub Actions output helpers for live upstream bug probes.
 * Used by scripts/check-sams-bugs.ts and the weekly health-check workflow.
 */

import type { BugProbeRun, BugProbeStatus } from "../src/upstream/bug-probes";

const STATUS_ICON: Record<BugProbeStatus, string> = {
  fixed: "✅",
  still_present: "⚠️",
  check_failed: "❌",
};

const STATUS_LABEL: Record<BugProbeStatus, string> = {
  fixed: "Fixed",
  still_present: "Still present",
  check_failed: "Check failed",
};

/** Step outputs written to $GITHUB_OUTPUT in CI. */
export function formatBugCheckGithubOutput(run: BugProbeRun): string {
  const fixedIds = run.bugs.filter((bug) => bug.status === "fixed").map((bug) => String(bug.id));
  const failedIds = run.bugs
    .filter((bug) => bug.status === "check_failed")
    .map((bug) => String(bug.id));

  return [
    `has_fixed=${fixedIds.length > 0 ? "true" : "false"}`,
    `fixed_bug_ids=${fixedIds.join(",")}`,
    `check_failed_ids=${failedIds.join(",")}`,
    "",
  ].join("\n");
}

/** Markdown written to $GITHUB_STEP_SUMMARY in CI. */
export function formatBugCheckStepSummary(run: BugProbeRun): string {
  const rows = run.bugs.map(
    (bug) =>
      `| ${bug.id} | ${bug.slug} | ${bug.summary} | ${STATUS_ICON[bug.status]} ${STATUS_LABEL[bug.status]} |`,
  );

  return [
    "## Bug check results",
    "",
    "| # | Slug | Bug | Status |",
    "|---|---|---|---|",
    ...rows,
    "",
    `_Checked at: ${run.checkedAt}_`,
    "",
  ].join("\n");
}
