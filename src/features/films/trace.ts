import { z } from "zod";

export const TraceStepSchema = z.object({
  id: z.string().min(1).max(48),
  label: z.string().min(1).max(54),
  kind: z.enum(["input", "tool", "approval", "output"]),
  status: z.enum(["success", "error", "pending"]),
  detail: z.string().max(180),
  durationMs: z.number().nonnegative().max(86400000),
  evidence: z.string().max(120),
});
export const TraceSchema = z
  .object({
    version: z.literal(1),
    title: z.string().min(1).max(64),
    source: z.string().min(1).max(80),
    isDemo: z.boolean(),
    steps: z.array(TraceStepSchema).min(2).max(8),
  })
  .superRefine((trace, ctx) => {
    if (new Set(trace.steps.map((s) => s.id)).size !== trace.steps.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each event needs a unique id",
        path: ["steps"],
      });
  });
export type Trace = z.infer<typeof TraceSchema>;
export function redact(text: string) {
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email removed]")
    .replace(/\b(?:sk-|sk_proj_|sk-proj-)[A-Za-z0-9_-]{8,}/g, "[key removed]")
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, "Bearer [removed]");
}
export function importTrace(value: unknown): Trace {
  const trace = TraceSchema.parse(value);
  return TraceSchema.parse({
    ...trace,
    title: redact(trace.title),
    source: redact(trace.source),
    steps: trace.steps.map((s) => ({
      ...s,
      id: redact(s.id),
      label: redact(s.label),
      detail: redact(s.detail),
      evidence: redact(s.evidence),
    })),
  });
}
export const SAMPLE_TRACE: Trace = {
  version: 1,
  title: "From invoice to a reviewed match",
  source: "Illustrative run · sample data",
  isDemo: true,
  steps: [
    {
      id: "in-01",
      label: "Invoice received",
      kind: "input",
      status: "success",
      detail: "Invoice INV-1042 is ready to match against a purchase order.",
      durationMs: 120,
      evidence: "invoice / INV-1042",
    },
    {
      id: "tool-01",
      label: "Find purchase order",
      kind: "tool",
      status: "success",
      detail: "Look up the order by supplier and invoice reference.",
      durationMs: 840,
      evidence: "purchase_order / PO-381",
    },
    {
      id: "tool-02",
      label: "Compare line items",
      kind: "tool",
      status: "success",
      detail: "Match the amount and items. Flag the delivery fee for review.",
      durationMs: 1360,
      evidence: "match_result / MR-221",
    },
    {
      id: "approval-01",
      label: "Human reviews the exception",
      kind: "approval",
      status: "success",
      detail: "The reviewer accepts the delivery fee before the next action.",
      durationMs: 12000,
      evidence: "approval / AP-087",
    },
    {
      id: "out-01",
      label: "Match recorded",
      kind: "output",
      status: "success",
      detail: "The invoice is marked matched. No payment is initiated.",
      durationMs: 480,
      evidence: "record / MATCH-1042",
    },
  ],
};
