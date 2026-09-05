#!/usr/bin/env bun
/**
 * Creates a GitHub issue summarising the SAMS health check results.
 * Invoked by .github/workflows/weekly.yml (notify job).
 */

import { buildHealthNotifyIssue } from "./sams-health-notify";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const runId = process.env.GITHUB_RUN_ID;

if (!token || !repository || !runId) {
  console.error("Missing required env vars: GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID");
  process.exit(1);
}

const [owner, repo] = repository.split("/");
const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`;
const date = new Date().toISOString().split("T")[0];

const issue = buildHealthNotifyIssue({
  runUrl,
  date,
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
});

const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  },
  body: JSON.stringify({
    title: issue.title,
    body: issue.body,
  }),
});

if (!response.ok) {
  const text = await response.text();
  console.error(`Failed to create issue: HTTP ${response.status}\n${text}`);
  process.exit(1);
}

const created = (await response.json()) as { html_url: string; number: number };
console.log(`Created issue #${created.number}: ${created.html_url}`);
