import { describe, expect, it } from "vitest";
import { importTrace, SAMPLE_TRACE, TraceSchema } from "./trace";

describe("workflow source boundary", () => {
  it("removes unknown payloads and common credential patterns", () => {
    const source = {
      ...SAMPLE_TRACE,
      rawPayload: "private",
      steps: SAMPLE_TRACE.steps.map((s) => ({
        ...s,
        raw: "secret",
        detail: "Email a@example.com. Bearer token123. sk-proj-abcdefghijk",
      })),
    };
    const parsed = importTrace(source);
    expect(JSON.stringify(parsed)).not.toMatch(
      /a@example.com|token123|abcdefghijk|rawPayload|secret/,
    );
    expect(parsed.steps[0].detail).toContain("[email removed]");
  });
  it("preserves error and pending events instead of inventing success", () => {
    const parsed = importTrace({
      ...SAMPLE_TRACE,
      steps: SAMPLE_TRACE.steps
        .slice(0, 2)
        .map((s, i) => ({ ...s, status: i ? "error" : "pending" })),
    });
    expect(parsed.steps.map((s) => s.status)).toEqual(["pending", "error"]);
    expect(parsed.steps.some((s) => s.kind === "output")).toBe(false);
  });
  it("rejects ambiguous IDs and unbounded or malformed runs", () => {
    expect(
      TraceSchema.safeParse({
        ...SAMPLE_TRACE,
        steps: [SAMPLE_TRACE.steps[0], SAMPLE_TRACE.steps[0]],
      }).success,
    ).toBe(false);
    expect(TraceSchema.safeParse({ ...SAMPLE_TRACE, steps: [] }).success).toBe(false);
    expect(
      TraceSchema.safeParse({
        ...SAMPLE_TRACE,
        steps: SAMPLE_TRACE.steps.map((s) => ({ ...s, durationMs: -1 })),
      }).success,
    ).toBe(false);
  });
  it("validates again after redaction so replacements cannot create invalid projects", () => {
    expect(() =>
      importTrace({
        ...SAMPLE_TRACE,
        steps: SAMPLE_TRACE.steps
          .slice(0, 2)
          .map((s, i) => ({ ...s, id: `person${i}@example.com` })),
      }),
    ).toThrow();
  });
});
