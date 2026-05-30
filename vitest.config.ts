import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    dangerouslyIgnoreUnhandledErrors: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
      // Only measure our own source — exclude tooling, configs, generated
      // primitives, and the studio iframe shells which are wrappers.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/**",
        "src/**/index.ts", // barrel files
        "src/components/ui/**", // shadcn primitives — not our code
        "src/app/**/layout.tsx",
        "src/app/**/page.tsx", // route shells; covered by e2e later
        "src/app/api/**", // API routes; cover via integration tests
        "src/harness/skills/**", // markdown skill bundles
        "**/*.d.ts",
      ],
      // Thresholds are intentionally OFF for now — we're still wiring the
      // Harness (M10) and most of `harness/tools`, `harness/agents`,
      // `protocol/*`, and the studio panels are 0% covered by design.
      // Coverage is being tracked for visibility only.
      //
      // Re-enable once the Harness loop is feature-complete. Suggested
      // cadence at that point (see docs/meta/future-roadmap.md for the
      // ratchet plan):
      //   Harness done  → 50 / 35 / 55 / 50
      //   Production    → 80 / 70 / 80 / 80
      //
      // Today's baseline (2026-05-30): 36 stmts · 26 br · 41 fns · 37 lines.
      // thresholds: {
      //   lines: 35,
      //   functions: 40,
      //   branches: 25,
      //   statements: 35,
      // },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
