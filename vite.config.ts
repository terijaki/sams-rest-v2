import { defineConfig } from "vite-plus";

const generatedIgnore = ["src/generated/**"];

export default defineConfig({
  fmt: {
    ignorePatterns: generatedIgnore,
  },
  lint: {
    ignorePatterns: generatedIgnore,
  },
  check: {
    options: {
      typeCheck: true,
    },
  },
  pack: {
    entry: ["src/index.ts"],
    dts: true,
    format: ["esm", "cjs"],
    sourcemap: true,
    clean: true,
    treeshake: true,
  },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
  },
});
