/**
 * Minimal GitHub REST helpers for health-check issue upsert (testable fetch injection).
 */

import type { GitHubIssueListItem } from "./sams-health-github";

const API_VERSION = "2022-11-28";

export type GitHubFetch = typeof fetch;

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": API_VERSION,
  };
}

export async function listOpenIssues(
  fetchImpl: GitHubFetch,
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubIssueListItem[]> {
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/issues`);
  url.searchParams.set("state", "open");
  url.searchParams.set("per_page", "100");

  const response = await fetchImpl(url, { headers: githubHeaders(token) });
  if (!response.ok) {
    throw new Error(`Failed to list issues: HTTP ${response.status}`);
  }

  const items = (await response.json()) as Array<{
    number: number;
    title: string;
    state: string;
    labels: { name: string }[];
    pull_request?: unknown;
  }>;

  return items
    .filter((item) => item.pull_request === undefined)
    .map((item) => ({
      number: item.number,
      title: item.title,
      state: item.state,
      labels: item.labels,
    }));
}

export async function createIssue(
  fetchImpl: GitHubFetch,
  token: string,
  owner: string,
  repo: string,
  payload: { title: string; body: string; labels: string[] },
): Promise<{ number: number; html_url: string }> {
  const response = await fetchImpl(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: githubHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create issue: HTTP ${response.status}\n${text}`);
  }
  return (await response.json()) as { number: number; html_url: string };
}

export async function updateIssue(
  fetchImpl: GitHubFetch,
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  payload: { title: string; body: string; labels: string[]; state?: "open" },
): Promise<{ number: number; html_url: string }> {
  const response = await fetchImpl(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      method: "PATCH",
      headers: githubHeaders(token),
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to update issue #${issueNumber}: HTTP ${response.status}\n${text}`);
  }
  return (await response.json()) as { number: number; html_url: string };
}

export async function closeIssueWithComment(
  fetchImpl: GitHubFetch,
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  comment: string,
): Promise<void> {
  const commentResponse = await fetchImpl(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    {
      method: "POST",
      headers: githubHeaders(token),
      body: JSON.stringify({ body: comment }),
    },
  );
  if (!commentResponse.ok) {
    const text = await commentResponse.text();
    throw new Error(
      `Failed to comment on issue #${issueNumber}: HTTP ${commentResponse.status}\n${text}`,
    );
  }

  const closeResponse = await fetchImpl(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    {
      method: "PATCH",
      headers: githubHeaders(token),
      body: JSON.stringify({ state: "closed" }),
    },
  );
  if (!closeResponse.ok) {
    const text = await closeResponse.text();
    throw new Error(`Failed to close issue #${issueNumber}: HTTP ${closeResponse.status}\n${text}`);
  }
}
