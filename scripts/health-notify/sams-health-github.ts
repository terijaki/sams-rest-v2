/**
 * GitHub issue upsert helpers for the weekly SAMS health check.
 */

export const SAMS_ISSUE_TITLE_PREFIX = "[SAMS]";
export const SAMS_HEALTH_LABEL = "sams-health";
export const SWAGGER_DRIFT_LABEL = "swagger-drift";

export type GitHubIssueListItem = {
  number: number;
  title: string;
  state: string;
  labels: { name: string }[];
};

export function isSamsHealthTrackerIssue(issue: {
  title: string;
  labels?: { name: string }[];
}): boolean {
  if (issue.title.startsWith(SAMS_ISSUE_TITLE_PREFIX)) {
    return true;
  }
  return issue.labels?.some((label) => label.name === SAMS_HEALTH_LABEL) ?? false;
}

export function healthIssueLabels(input: { hasDrift: boolean }): string[] {
  const labels = [SAMS_HEALTH_LABEL];
  if (input.hasDrift) {
    labels.push(SWAGGER_DRIFT_LABEL);
  }
  return labels;
}

/** Prefer the lowest-number open issue so weekly updates stay on one thread. */
export function pickCanonicalHealthIssue(
  issues: GitHubIssueListItem[],
): GitHubIssueListItem | null {
  const trackers = issues.filter(
    (issue) => issue.state === "open" && isSamsHealthTrackerIssue(issue),
  );
  if (trackers.length === 0) {
    return null;
  }
  return trackers.reduce((left, right) => (left.number < right.number ? left : right));
}

export function duplicateHealthIssues(
  issues: GitHubIssueListItem[],
  canonicalNumber: number,
): GitHubIssueListItem[] {
  return issues.filter(
    (issue) =>
      issue.state === "open" && isSamsHealthTrackerIssue(issue) && issue.number !== canonicalNumber,
  );
}

export const HEALTH_CHECK_CLEAR_COMMENT =
  "This week's health check completed with no swagger drift, no newly fixed upstream bugs, and no failed jobs. Closing this tracker until a future run needs attention.";
