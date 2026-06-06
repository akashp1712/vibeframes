import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * E2E config — runs ONLY `*.live.test.ts` files. These tests hit the
 * real OpenAI API and exist to catch regressions in the Director and
 * subagent prompts. Gated on OPENAI_API_KEY (each test self-skips if
 * absent), so this config is safe to run in CI but will produce a
 * "passed-but-skipped" report without the key.
 *
 * Use `pnpm test:e2e` to invoke.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node", // no DOM needed — pipeline is server-side
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.live.test.{ts,tsx}"],
    dangerouslyIgnoreUnhandledErrors: true,
    // Each subagent is its own LLM call; the pipeline takes 60-120s on
    // gpt-4o-mini and longer on gpt-4o. Bump the per-test timeout.
    testTimeout: 5 * 60 * 1000,
    // We only ship one e2e file today; if more arrive, run them serially
    // to share the OpenAI rate-limit budget.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
