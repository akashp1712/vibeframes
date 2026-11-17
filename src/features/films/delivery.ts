import { FilmSchema, timeline, type Film } from "./schema";
import type { Trace } from "./trace";
const fields = ["label", "kind", "status", "detail", "durationMs", "evidence"] as const;
export type RunChange = {
  id: string;
  label: string;
  kind: "added" | "removed" | "changed";
  before?: Trace["steps"][number];
  after?: Trace["steps"][number];
  fields: string[];
};
/** Compare observations by stable event ID. This never infers a workflow-code change or improvement. */
export function compareRuns(previous: Trace, current: Trace): RunChange[] {
  const before = new Map(previous.steps.map((step, index) => [step.id, { step, index }]));
  const after = new Set(current.steps.map((step) => step.id));
  const changes: RunChange[] = [];
  current.steps.forEach((step, index) => {
    const old = before.get(step.id);
    if (!old) {
      changes.push({ id: step.id, label: step.label, kind: "added", after: step, fields: [] });
      return;
    }
    const changed: string[] = fields.filter((field) => old.step[field] !== step[field]);
    if (old.index !== index) changed.push("position");
    if (changed.length)
      changes.push({
        id: step.id,
        label: step.label,
        kind: "changed",
        before: old.step,
        after: step,
        fields: changed,
      });
  });
  previous.steps
    .filter((step) => !after.has(step.id))
    .forEach((step) =>
      changes.push({ id: step.id, label: step.label, kind: "removed", before: step, fields: [] }),
    );
  return changes;
}
async function fingerprint(value: unknown) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
export async function makeDeliveryRecord(input: Film) {
  const film = FilmSchema.parse(input);
  if (!film.reviewed)
    throw new Error("Review the source and scene copy before creating a delivery record.");
  return {
    format: "vibeframes-delivery-v1",
    createdAt: new Date().toISOString(),
    scope:
      "Author-reviewed source and film configuration. Not an independent verification or a hash of rendered video bytes.",
    sourceSha256: await fingerprint(film.trace),
    previousSourceSha256: film.previousTrace ? await fingerprint(film.previousTrace) : null,
    filmConfigurationSha256: await fingerprint(film),
    changes: film.previousTrace ? compareRuns(film.previousTrace, film.trace) : [],
    scenes: timeline(film.story).map((scene) => ({
      id: scene.id,
      block: scene.block,
      from: scene.from,
      frames: scene.duration,
      binding:
        scene.block === "trace"
          ? "trace.steps"
          : scene.block === "evidence"
            ? "trace.steps:last-output-or-missing"
            : scene.block === "changes"
              ? "previousTrace + trace"
              : "author-reviewed editorial copy",
    })),
    project: film,
  };
}
