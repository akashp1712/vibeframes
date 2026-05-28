import { describe, it, expect } from "vitest";
import { HarnessStateSchema, CompositionSchema, ClipSchema } from "../types";

describe("HarnessStateSchema", () => {
  it("accepts a valid empty state", () => {
    const state = {
      projectId: "proj-1",
      mode: "plan",
      status: "empty",
      composition: null,
      plan: null,
      error: null,
    };
    expect(HarnessStateSchema.parse(state)).toEqual(state);
  });

  it("rejects an invalid mode", () => {
    const state = {
      projectId: "proj-1",
      mode: "invalid",
      status: "empty",
      composition: null,
      plan: null,
      error: null,
    };
    expect(() => HarnessStateSchema.parse(state)).toThrow();
  });
});

describe("CompositionSchema", () => {
  it("applies default width, height, fps", () => {
    const result = CompositionSchema.parse({
      id: "comp-1",
      title: "Test",
      tracks: [],
    });
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
    expect(result.fps).toBe(30);
  });
});

describe("ClipSchema", () => {
  it("validates a clip", () => {
    const clip = {
      id: "clip-1",
      trackId: "track-1",
      startMs: 0,
      durationMs: 3000,
      html: "<div>hello</div>",
    };
    expect(ClipSchema.parse(clip)).toEqual(clip);
  });
});
