import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  consumerPackageJsonChanged,
  isPackageContentPath,
  shouldBumpPackage,
  shouldPublishVersion,
} from "./package-content-changed";

const basePackage = {
  version: "0.1.10",
  description: "Generated fetch SDK",
  keywords: ["SAMS"],
  license: "MIT",
  files: ["dist", "README.md", "LICENSE"],
  main: "./dist/index.cjs",
  module: "./dist/index.mjs",
  types: "./dist/index.d.mts",
  exports: { ".": { import: "./dist/index.mjs" } },
  scripts: { generate: "bun ./scripts/generate-client.ts" },
  dependencies: { zod: "^4.4.3" },
  devDependencies: { "vite-plus": "0.3.0" },
  peerDependencies: { typescript: ">=5.5 || >=6.0.0" },
  peerDependenciesMeta: { typescript: { optional: true } },
  engines: { node: ">=22.18.0" },
  packageManager: "bun@1.3.14",
};

describe("isPackageContentPath", () => {
  it("treats shipped source, generated SDK, README, LICENSE, and pack config as content", () => {
    expect(isPackageContentPath("src/index.ts")).toBe(true);
    expect(isPackageContentPath("src/create-sams-client.ts")).toBe(true);
    expect(isPackageContentPath("src/constants.ts")).toBe(true);
    expect(isPackageContentPath("src/generated/sdk.gen.ts")).toBe(true);
    expect(isPackageContentPath("src/generated")).toBe(true);
    expect(isPackageContentPath("README.md")).toBe(true);
    expect(isPackageContentPath("LICENSE")).toBe(true);
    expect(isPackageContentPath("vite.config.ts")).toBe(true);
  });

  it("ignores tooling, tests, live probes, and codegen patches", () => {
    expect(isPackageContentPath(".github/workflows/ci.yml")).toBe(false);
    expect(isPackageContentPath(".cursor/environment.json")).toBe(false);
    expect(isPackageContentPath("docs/MAINTAINERS.md")).toBe(false);
    expect(isPackageContentPath("scripts/package-content-changed.ts")).toBe(false);
    expect(isPackageContentPath("AGENTS.md")).toBe(false);
    expect(isPackageContentPath("bunfig.toml")).toBe(false);
    expect(isPackageContentPath("src/create-sams-client.test.ts")).toBe(false);
    expect(isPackageContentPath("src/live/sams-smoke.live.test.ts")).toBe(false);
    expect(isPackageContentPath("src/test-support/live-fixtures.ts")).toBe(false);
    expect(isPackageContentPath("src/msw/handlers.ts")).toBe(false);
    expect(isPackageContentPath("src/upstream/bugs.ts")).toBe(false);
    expect(isPackageContentPath("src/codegen/schema-patches.ts")).toBe(false);
    expect(isPackageContentPath("package.json")).toBe(false);
  });
});

describe("consumerPackageJsonChanged", () => {
  it("ignores version, scripts, devDependencies, and packageManager", () => {
    expect(
      consumerPackageJsonChanged(basePackage, {
        ...basePackage,
        version: "0.1.11",
        scripts: { generate: "changed" },
        devDependencies: { "vite-plus": "0.4.0" },
        packageManager: "bun@1.3.15",
      }),
    ).toBe(false);
  });

  it("detects shipped dependency and export changes", () => {
    expect(
      consumerPackageJsonChanged(basePackage, {
        ...basePackage,
        dependencies: { zod: "^4.5.0" },
      }),
    ).toBe(true);
    expect(
      consumerPackageJsonChanged(basePackage, {
        ...basePackage,
        files: ["dist"],
      }),
    ).toBe(true);
  });
});

describe("shouldBumpPackage", () => {
  it("skips tooling-only PRs even when package.json version would bump", () => {
    const result = shouldBumpPackage({
      changedPaths: [
        ".cursor/environment.json",
        ".github/workflows/version-bump.yml",
        "docs/MAINTAINERS.md",
        "package.json",
        "scripts/package-content-changed.ts",
      ],
      basePackageJson: basePackage,
      headPackageJson: { ...basePackage, version: "0.1.11", scripts: { release: "true" } },
    });
    expect(result.needed).toBe(false);
  });

  it("bumps when generated SDK or client factory changes", () => {
    expect(
      shouldBumpPackage({
        changedPaths: ["src/generated/sdk.gen.ts"],
        basePackageJson: basePackage,
        headPackageJson: basePackage,
      }).needed,
    ).toBe(true);
    expect(
      shouldBumpPackage({
        changedPaths: ["src/create-sams-client.ts"],
        basePackageJson: basePackage,
        headPackageJson: basePackage,
      }).needed,
    ).toBe(true);
  });

  it("bumps when consumer-facing package.json keys change", () => {
    const result = shouldBumpPackage({
      changedPaths: ["package.json"],
      basePackageJson: basePackage,
      headPackageJson: { ...basePackage, engines: { node: ">=22.20.0" } },
    });
    expect(result.needed).toBe(true);
    expect(result.reasons).toContain("package.json consumer fields");
  });
});

describe("shouldPublishVersion", () => {
  it("publishes when npm has no version yet or local is newer", () => {
    expect(shouldPublishVersion("0.1.10", null)).toBe(true);
    expect(shouldPublishVersion("0.1.10", "")).toBe(true);
    expect(shouldPublishVersion("0.1.11", "0.1.10")).toBe(true);
  });

  it("skips when the local version is already on npm", () => {
    expect(shouldPublishVersion("0.1.10", "0.1.10")).toBe(false);
    expect(shouldPublishVersion("0.1.9", "0.1.10")).toBe(false);
  });
});

describe("release workflows", () => {
  it("only patch-bumps when package content changed", () => {
    const workflow = readFileSync(".github/workflows/version-bump.yml", "utf8");
    expect(workflow).toContain("vp run release-needed");
    expect(workflow).toContain("steps.content.outputs.needed == 'true'");
    expect(workflow).not.toContain("vp run release-needed >");
  });

  it("only publishes and tags when the package version is newer than npm", () => {
    const workflow = readFileSync(".github/workflows/publish.yml", "utf8");
    expect(workflow).toContain("vp run release-needed -- --versions");
    expect(workflow).toContain("steps.release.outputs.needed == 'true'");
    expect(workflow).not.toContain("vp run release-needed >");
  });
});

describe("cloud agent environment install", () => {
  it("exports the Vite+ bin directory on PATH before calling vp", () => {
    const env = JSON.parse(readFileSync(".cursor/environment.json", "utf8")) as { install: string };
    expect(env.install).toContain('export PATH="$HOME/.local/share/vite-plus/bin:$PATH"');
    expect(env.install).toContain("vp install --frozen-lockfile");
    expect(env.install).toContain("VP_NODE_MANAGER=no");
  });
});

describe("check-package-content-changed CLI", () => {
  it("writes needed=false for a tooling-only path list", () => {
    const dir = mkdtempSync(join(tmpdir(), "release-needed-"));
    try {
      const pathsFile = join(dir, "changed.txt");
      const baseFile = join(dir, "base.json");
      const headFile = join(dir, "head.json");
      writeFileSync(pathsFile, ".github/workflows/ci.yml\n.cursor/environment.json\n");
      writeFileSync(baseFile, JSON.stringify(basePackage));
      writeFileSync(headFile, JSON.stringify({ ...basePackage, version: "0.1.11" }));
      const output = execFileSync(
        "bun",
        ["scripts/check-package-content-changed.ts", pathsFile, baseFile, headFile],
        { encoding: "utf8" },
      );
      expect(output).toContain("needed=false");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("writes needed=true when local version is newer than npm", () => {
    const output = execFileSync(
      "bun",
      ["scripts/check-package-content-changed.ts", "--versions", "0.1.11", "0.1.10"],
      { encoding: "utf8" },
    );
    expect(output).toContain("needed=true");
  });
});
