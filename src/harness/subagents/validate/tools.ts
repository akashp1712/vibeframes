import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import {
  ValidationReportSchema,
  type ValidationReport,
  type VibeFramesState,
} from "../../state";
import { getComposition } from "../../composition/store";
import { runAllRules } from "./rules";

type HarnessCtx = {
  getState: () => VibeFramesState;
  setState: (patch: Partial<VibeFramesState>) => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getHarnessCtx(context: any): HarnessCtx | undefined {
  return context?.requestContext?.get("harness");
}

/**
 * `check-storyboard` — runs all validation rules and writes the report
 * to harness state. Pass policy:
 *   any error  → pass = false (Director should retry Compose)
 *   warnings   → pass = true
 *   info-only  → pass = true
 */
export function createCheckStoryboardTool() {
  return createTool({
    id: "check-storyboard",
    description:
      "Run all validation rules against the committed storyboard + composition. " +
      "Writes the report to state and returns it. pass=false when any rule emits " +
      "severity=error. pass=true with warnings is normal (ship and surface them).",
    inputSchema: z.object({}),
    execute: async (_input, context) => {
      const ctx = getHarnessCtx(context);
      const state = ctx?.getState();
      if (!state?.storyboard) return { ok: false, error: "no storyboard committed" };

      const composition = getComposition(state.projectId);
      const issues = runAllRules({
        storyboard: state.storyboard,
        composition,
        brief: state.brief,
      });
      const hasError = issues.some((i) => i.severity === "error");
      const previous = state.validationReport;
      const report: ValidationReport = ValidationReportSchema.parse({
        ranAt: Date.now(),
        issues,
        pass: !hasError,
        attempts: (previous?.attempts ?? 0) + (previous ? 1 : 0),
      });

      if (!ctx) return { ok: true, report, persisted: false };
      await ctx.setState({ validationReport: report });
      return { ok: true, report, persisted: true };
    },
  });
}

export function createValidateTools() {
  return {
    "check-storyboard": createCheckStoryboardTool(),
  };
}
