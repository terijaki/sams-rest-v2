#!/usr/bin/env bun
/**
 * Creates or updates the weekly SAMS health-check GitHub issue (single open tracker).
 * Invoked by .github/workflows/weekly.yml (notify job).
 */

import { upsertHealthNotifyIssue } from "./sams-health-notify-sync";

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const runId = process.env.GITHUB_RUN_ID;

if (!token || !repository || !runId) {
  console.error("Missing required env vars: GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID");
  process.exit(1);
}

const [owner, repo] = repository.split("/");
const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`;

process.env.RUN_URL = runUrl;
if (!process.env.NOTIFY_DATE) {
  process.env.NOTIFY_DATE = new Date().toISOString().split("T")[0];
}

try {
  const result = await upsertHealthNotifyIssue({ token, owner, repo });
  console.log(
    `${result.action === "created" ? "Created" : "Updated"} issue #${result.number}: ${result.html_url}`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
