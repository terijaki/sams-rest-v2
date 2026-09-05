/**
 * Builds the weekly SAMS health-check GitHub issue title and body.
 * Used by scripts/sams-notify.ts.
 */

import { UPSTREAM_BUGS } from "../src/upstream/bugs";
import { buildSwaggerDriftSection } from "./sams-swagger-drift";

export type HealthNotifyInput = {
  runUrl: string;
  date: string;
  hasDrift: boolean;
  hasFixed: boolean;
  fixedBugIds: number[];
  checkFailedIds: number[];
  regenFailed: boolean;
  failureStep: string;
  swaggerJobFailed: boolean;
  bugCheckJobFailed: boolean;
  regenJobFailed: boolean;
  prDriftJobFailed: boolean;
  driftPrUrl: string;
  driftSummaryMarkdown: string;
};

export type HealthNotifyIssue = {
  title: string;
  body: string;
};

function formatBugResultsTable(fixedBugIds: number[], checkFailedIds: number[]): string {
  const probedBugs = UPSTREAM_BUGS.filter((bug) => bug.probed);
  const fixedSet = new Set(fixedBugIds);
  const failedSet = new Set(checkFailedIds);
  const rows = probedBugs.map((bug) => {
    const status = fixedSet.has(bug.id)
      ? "✅ Fixed"
      : failedSet.has(bug.id)
        ? "❌ Check failed"
        : "⚠️ Still present";
    return `| ${bug.id} | \`${bug.slug}\` | ${bug.summary} | ${status} |`;
  });
  return ["| # | Slug | Bug | Status |", "|---|---|---|---|", ...rows].join("\n");
}

export function buildHealthNotifyIssue(input: HealthNotifyInput): HealthNotifyIssue {
  const sections: string[] = [];
  const titleParts: string[] = [];
  const bugTable = formatBugResultsTable(input.fixedBugIds, input.checkFailedIds);

  if (input.hasDrift) {
    titleParts.push("⚠️ swagger drift");
    sections.push(
      `${buildSwaggerDriftSection({
        runUrl: input.runUrl,
        summaryMarkdown: input.driftSummaryMarkdown,
      })}

${input.driftPrUrl ? `A pull request was opened/updated with the regenerated client: ${input.driftPrUrl}\n\nReview, approve, and merge it. The version-bump workflow will patch-bump on the PR branch; [\`publish.yml\`](${input.runUrl.replace(/\/runs\/\d+$/, "")}/blob/main/.github/workflows/publish.yml) publishes after merge.` : "Verification passed; check the workflow run for the drift PR link."}`,
    );
  }

  if (input.bugCheckJobFailed) {
    titleParts.push("❌ bug check failed");
    sections.push(`## ❌ Bug Check Job Failed

The **Health: bug probes** job failed. Inspect that job's log for the failing step.

A masked \`SAMS_API_KEY: ***\` in the step env means the repository secret was injected. An empty value means it is missing or blank.

[View run](${input.runUrl})`);
  } else if (input.hasFixed) {
    titleParts.push("✅ bugs fixed");
    sections.push(`## ✅ Upstream Bug(s) Fixed

Bug(s) **${input.fixedBugIds.join(", ")}** are no longer reproducible against the live API. Review the relevant patches in \`src/codegen/\` and remove workarounds that compensate for the now-fixed behaviour.

${bugTable}`);
  } else {
    sections.push(`## Bug Check Results\n\n${bugTable}`);
  }

  if (input.regenFailed || input.regenJobFailed) {
    titleParts.push("❌ regen failed");
    sections.push(`## ❌ Regeneration / Verification Failed

The \`${input.failureStep || "regenerate"}\` step failed after pulling the latest spec. The generated client or test suite may be out of sync with the current upstream API.

[View step output](${input.runUrl})`);
  }

  if (input.swaggerJobFailed) {
    titleParts.push("❌ drift check failed");
    sections.push(
      `## ❌ Swagger Drift Check Job Failed\n\nThe job itself failed (likely a network or tooling error).\n\n[View run](${input.runUrl})`,
    );
  }

  if (input.prDriftJobFailed) {
    titleParts.push("❌ drift PR failed");
    sections.push(
      `## ❌ Drift PR Failed\n\nSemantic drift was detected and verification passed, but opening/updating the drift pull request failed.\n\n[View run](${input.runUrl})`,
    );
  }

  const titleSuffix = titleParts.length > 0 ? titleParts.join(" · ") : "action required";

  return {
    title: `[SAMS] ${titleSuffix} — ${input.date}`,
    body: `${sections.join("\n\n---\n\n")}\n\n---\n\n_Weekly health check · [View run](${input.runUrl})_`,
  };
}
