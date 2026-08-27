import { BASELINE_SAMS_OPERATIONS } from "./baseline-endpoints";
import { SAMS_API_GRAPH_STEPS } from "./sams-api-graph-steps";

export type VitestAssertion = {
  ancestorTitles: string[];
  title: string;
  status: string;
};

export type VitestReport = {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  testResults: Array<{
    name: string;
    assertionResults: VitestAssertion[];
  }>;
};

export type EndpointResult = {
  name: string;
  status: string;
  suite: string;
};

const GRAPH_SUITE_PATTERN = /SAMS API graph/i;

function statusIcon(status: string): string {
  switch (status) {
    case "passed":
      return "✅";
    case "failed":
      return "❌";
    case "skipped":
      return "⏭️";
    default:
      return "•";
  }
}

/** Endpoint cases registered by describeSamsApiGraphSuite (title = SDK operation name). */
export function extractGraphEndpointResults(report: VitestReport): EndpointResult[] {
  const results: EndpointResult[] = [];

  for (const file of report.testResults) {
    for (const assertion of file.assertionResults) {
      const graphSuite = assertion.ancestorTitles.find((title) => GRAPH_SUITE_PATTERN.test(title));
      if (!graphSuite) continue;
      if (!assertion.title.startsWith("get")) continue;

      results.push({
        name: assertion.title,
        status: assertion.status,
        suite: graphSuite,
      });
    }
  }

  return results;
}

/** Live smoke / fixture cases whose titles start with a GET operation name. */
export function extractLiveSmokeResults(report: VitestReport): EndpointResult[] {
  const results: EndpointResult[] = [];

  for (const file of report.testResults) {
    for (const assertion of file.assertionResults) {
      const liveSuite = assertion.ancestorTitles.find(
        (title) => title.includes("smoke") || title.includes("roster"),
      );
      if (!liveSuite) continue;
      if (!assertion.title.startsWith("get")) continue;

      results.push({
        name: assertion.title,
        status: assertion.status,
        suite: liveSuite,
      });
    }
  }

  return results;
}

function formatEndpointTable(endpoints: EndpointResult[]): string {
  if (endpoints.length === 0) {
    return "_No endpoint cases found in the Vitest report._\n";
  }

  const lines = ["| Endpoint | Status |", "| --- | --- |"];
  for (const endpoint of endpoints) {
    lines.push(`| \`${endpoint.name}\` | ${statusIcon(endpoint.status)} ${endpoint.status} |`);
  }
  return `${lines.join("\n")}\n`;
}

export function formatUnitCiSummaryMarkdown(report: VitestReport): string {
  const graphEndpoints = extractGraphEndpointResults(report);
  const expectedSteps = SAMS_API_GRAPH_STEPS.map((step) => step.name);
  const graphNames = graphEndpoints.map((endpoint) => endpoint.name);
  const missingSteps = expectedSteps.filter((name) => !graphNames.includes(name));

  const lines = [
    "## Test summary",
    "",
    `**${report.numPassedTests}/${report.numTotalTests} passed**`,
    "",
    `### SAMS API graph — MSW contract (${graphEndpoints.length} endpoints)`,
    "",
    formatEndpointTable(graphEndpoints).trimEnd(),
    "",
    `### Baseline operations (${BASELINE_SAMS_OPERATIONS.length})`,
    "",
    BASELINE_SAMS_OPERATIONS.map((operation) => `\`${operation}\``).join(", "),
    "",
  ];

  if (missingSteps.length > 0) {
    lines.push(
      `> Missing from Vitest report: ${missingSteps.map((name) => `\`${name}\``).join(", ")}`,
      "",
    );
  }

  return `${lines.join("\n")}\n`;
}

export function formatLiveCiSummaryMarkdown(report: VitestReport): string {
  const graphEndpoints = extractGraphEndpointResults(report);
  const smokeEndpoints = extractLiveSmokeResults(report);

  const lines = [
    "## Live API test summary",
    "",
    `**${report.numPassedTests}/${report.numTotalTests} passed**`,
    "",
    `### SAMS API graph — production (${graphEndpoints.length} endpoints)`,
    "",
    formatEndpointTable(graphEndpoints).trimEnd(),
    "",
  ];

  if (smokeEndpoints.length > 0) {
    lines.push(
      `### Smoke & fixture checks (${smokeEndpoints.length})`,
      "",
      formatEndpointTable(smokeEndpoints).trimEnd(),
      "",
    );
  }

  return `${lines.join("\n")}\n`;
}
