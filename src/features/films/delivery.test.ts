import { describe, it, expect } from "vitest";
import { compareRuns, makeDeliveryRecord } from "./delivery";
import { DEMO_FILM, FilmSchema } from "./schema";
import { SAMPLE_TRACE } from "./trace";
describe("source-bound delivery", () => {
  it("preserves backwards compatibility for projects without a baseline", () => {
    const old = { ...DEMO_FILM, previousTrace: undefined };
    expect(FilmSchema.parse(old).previousTrace).toBeNull();
  });
  it("reports no changes for equal event fields, even when metadata differs", () => {
    expect(compareRuns(SAMPLE_TRACE, { ...SAMPLE_TRACE, title: "New title" })).toEqual([]);
  });
  it("reports failures, additions, removals and order changes without interpreting improvement", () => {
    const next = {
      ...SAMPLE_TRACE,
      steps: SAMPLE_TRACE.steps
        .slice(1)
        .map((s, i) => ({ ...s, status: i === 0 ? ("error" as const) : s.status })),
    };
    next.steps.push({ ...SAMPLE_TRACE.steps[0], id: "new-input" });
    const changes = compareRuns(SAMPLE_TRACE, next);
    expect(changes.find((c) => c.id === "tool-01")?.fields).toEqual(["status", "position"]);
    expect(changes.find((c) => c.id === "tool-01")?.after?.status).toBe("error");
    expect(changes.find((c) => c.id === "new-input")?.kind).toBe("added");
    expect(changes.find((c) => c.id === "in-01")?.kind).toBe("removed");
  });
  it("requires review and fingerprints the source separately from editorial copy", async () => {
    await expect(makeDeliveryRecord(DEMO_FILM)).rejects.toThrow("Review");
    const a = await makeDeliveryRecord({ ...DEMO_FILM, reviewed: true });
    const b = await makeDeliveryRecord({ ...DEMO_FILM, reviewed: true, hook: 1 });
    expect(a.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(a.sourceSha256).toBe(b.sourceSha256);
    expect(a.filmConfigurationSha256).not.toBe(b.filmConfigurationSha256);
    expect(a.scenes[1].binding).toBe("trace.steps");
  });
});
