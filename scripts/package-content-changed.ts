/**
 * Decide whether a PR should patch-bump / whether main should npm publish.
 *
 * Package content is the npm tarball (`dist/`, README, LICENSE) plus the
 * source and pack config that produce it. Tooling, workflows, tests, and
 * codegen patches do not count until they change generated SDK output.
 */

export const CONSUMER_PACKAGE_JSON_KEYS = [
  "dependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "exports",
  "files",
  "engines",
  "main",
  "module",
  "types",
  "description",
  "keywords",
  "license",
] as const;

export const PACKAGE_CONTENT_FILES = new Set([
  "README.md",
  "LICENSE",
  "src/index.ts",
  "src/create-sams-client.ts",
  "src/constants.ts",
  "vite.config.ts",
]);

const GENERATED_PREFIX = "src/generated/";
const GENERATED_DIR = "src/generated";

export function normalizeRepoPath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function isPackageContentPath(path: string): boolean {
  const normalized = normalizeRepoPath(path);
  if (PACKAGE_CONTENT_FILES.has(normalized)) {
    return true;
  }
  return normalized === GENERATED_DIR || normalized.startsWith(GENERATED_PREFIX);
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, sortValue(record[key])]),
    );
  }
  return value;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function pickConsumerPackageJson(pkg: unknown): Record<string, unknown> {
  const record = asRecord(pkg);
  const picked: Record<string, unknown> = {};
  for (const key of CONSUMER_PACKAGE_JSON_KEYS) {
    if (Object.hasOwn(record, key)) {
      picked[key] = record[key];
    }
  }
  return picked;
}

export function consumerPackageJsonChanged(basePkg: unknown, headPkg: unknown): boolean {
  return (
    canonicalJson(pickConsumerPackageJson(basePkg)) !==
    canonicalJson(pickConsumerPackageJson(headPkg))
  );
}

export type ReleaseNeededResult = {
  needed: boolean;
  reasons: string[];
};

export function shouldBumpPackage(input: {
  changedPaths: string[];
  basePackageJson: unknown;
  headPackageJson: unknown;
}): ReleaseNeededResult {
  const reasons: string[] = [];
  const seen = new Set<string>();

  for (const path of input.changedPaths) {
    const normalized = normalizeRepoPath(path);
    if (!isPackageContentPath(normalized) || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    reasons.push(normalized);
  }

  if (input.changedPaths.some((path) => normalizeRepoPath(path) === "package.json")) {
    if (consumerPackageJsonChanged(input.basePackageJson, input.headPackageJson)) {
      reasons.push("package.json consumer fields");
    }
  }

  return { needed: reasons.length > 0, reasons };
}

export function parseSemver(version: string): [number, number, number] {
  const [major, minor, patch] = version.split(".").map((part) => Number.parseInt(part, 10));
  return [
    Number.isFinite(major) ? major : 0,
    Number.isFinite(minor) ? minor : 0,
    Number.isFinite(patch) ? patch : 0,
  ];
}

export function compareSemver(left: string, right: string): number {
  const a = parseSemver(left);
  const b = parseSemver(right);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return 0;
}

/** Publish when local is newer than npm, or npm has never published this package. */
export function shouldPublishVersion(
  localVersion: string,
  publishedVersion: string | null | undefined,
): boolean {
  if (!publishedVersion) {
    return true;
  }
  return compareSemver(localVersion, publishedVersion) > 0;
}

export function formatGithubNeededOutput(needed: boolean): string {
  return `needed=${needed ? "true" : "false"}\n`;
}
