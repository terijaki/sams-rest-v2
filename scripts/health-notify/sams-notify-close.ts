#!/usr/bin/env bun
/**
 * Closes open SAMS health tracker issues when a weekly run needs no action.
 * Invoked by .github/workflows/weekly.yml when drift, failures, and fixed-bug signals are all clear.
 */

import { closeIssueWithComment, listOpenIssues } from "./sams-health-github-api";
import {
  HEALTH_CHECK_CLEAR_COMMENT,
  pickCanonicalHealthIssue,
  duplicateHealthIssues,
} from "./sams-health-github";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;

if (!token || !repository) {
  console.error("Missing required env vars: GITHUB_TOKEN, GITHUB_REPOSITORY");
  process.exit(1);
}

const [owner, repo] = repository.split("/");

try {
  const openIssues = await listOpenIssues(fetch, token, owner, repo);
  const canonical = pickCanonicalHealthIssue(openIssues);
  if (!canonical) {
    console.log("No open SAMS health tracker issue to close.");
    process.exit(0);
  }

  const toClose = [canonical, ...duplicateHealthIssues(openIssues, canonical.number)];
  for (const issue of toClose) {
    await closeIssueWithComment(
      fetch,
      token,
      owner,
      repo,
      issue.number,
      HEALTH_CHECK_CLEAR_COMMENT,
    );
    console.log(`Closed issue #${issue.number}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
