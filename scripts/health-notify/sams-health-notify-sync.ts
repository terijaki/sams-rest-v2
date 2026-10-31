/**
 * Upserts the single weekly SAMS health-check GitHub issue and closes duplicate trackers.
 */

import { buildHealthNotifyIssue } from "./sams-health-notify";
import {
  closeIssueWithComment,
  createIssue,
  listOpenIssues,
  updateIssue,
} from "./sams-health-github-api";
import {
  duplicateHealthIssues,
  healthIssueLabels,
  pickCanonicalHealthIssue,
} from "./sams-health-github";

function readNotifyInput() {
  return {
    runUrl: process.env.RUN_URL ?? "",
    date: process.env.NOTIFY_DATE ?? new Date().toISOString().split("T")[0],
    hasDrift: process.env.HAS_DRIFT === "true",
    hasFixed: process.env.HAS_FIXED === "true",
    fixedBugIds: (process.env.FIXED_BUG_IDS ?? "").split(",").filter(Boolean).map(Number),
    checkFailedIds: (process.env.CHECK_FAILED_IDS ?? "").split(",").filter(Boolean).map(Number),
    regenFailed: process.env.REGEN_FAILED === "true",
    failureStep: process.env.FAILURE_STEP ?? "",
    swaggerJobFailed: process.env.SWAGGER_DRIFT_RESULT === "failure",
    bugCheckJobFailed: process.env.BUG_CHECK_RESULT === "failure",
    regenJobFailed: process.env.REGENERATE_RESULT === "failure",
    prDriftJobFailed: process.env.PR_DRIFT_RESULT === "failure",
    driftPrUrl: process.env.DRIFT_PR_URL ?? "",
    driftSummaryMarkdown: process.env.DRIFT_SUMMARY_MARKDOWN ?? "",
  };
}

export async function upsertHealthNotifyIssue(options: {
  token: string;
  owner: string;
  repo: string;
  fetchImpl?: typeof fetch;
}): Promise<{ number: number; html_url: string; action: "created" | "updated" }> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const input = readNotifyInput();
  if (!input.runUrl) {
    throw new Error("Missing RUN_URL");
  }

  const issue = buildHealthNotifyIssue(input);
  const labels = healthIssueLabels({ hasDrift: input.hasDrift });
  const openIssues = await listOpenIssues(fetchImpl, options.token, options.owner, options.repo);
  const canonical = pickCanonicalHealthIssue(openIssues);

  let result: { number: number; html_url: string };
  let action: "created" | "updated";

  if (canonical) {
    result = await updateIssue(
      fetchImpl,
      options.token,
      options.owner,
      options.repo,
      canonical.number,
      {
        title: issue.title,
        body: issue.body,
        labels,
        state: "open",
      },
    );
    action = "updated";

    const duplicates = duplicateHealthIssues(openIssues, canonical.number);
    for (const duplicate of duplicates) {
      await closeIssueWithComment(
        fetchImpl,
        options.token,
        options.owner,
        options.repo,
        duplicate.number,
        `Superseded by #${canonical.number} (weekly health check now updates a single tracker issue).`,
      );
    }
  } else {
    result = await createIssue(fetchImpl, options.token, options.owner, options.repo, {
      title: issue.title,
      body: issue.body,
      labels,
    });
    action = "created";
  }

  return { ...result, action };
}
