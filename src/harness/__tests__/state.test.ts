import { describe, it, expect } from "vitest";
import {
  BriefSchema,
  VibeFramesStateSchema,
  createInitialState,
} from "../state";

describe("BriefSchema", () => {
  const validBrief = {
    message: "Linear ships fast because it gets out of your way.",
    arc: "reveal" as const,
    audience: "engineering teams",
    format: "landscape" as const,
    durationMs: 12000,
    narration: "full" as const,
    styleNotes: "dark cinematic",
    brand: { name: "Linear", primaryColor: "#5E6AD2" },
  };

  it("accepts a fully-specified brief", () => {
    expect(BriefSchema.parse(validBrief)).toEqual(validBrief);
  });

  it("accepts a minimal brief — brand defaults to {} and styleNotes is optional", () => {
    const minimal = {
      message: "Stripe makes accepting payments simple.",
      arc: "demonstration" as const,
      audience: "indie developers",
      format: "portrait" as const,
      durationMs: 15000,
      narration: "minimal" as const,
    };
    const parsed = BriefSchema.parse(minimal);
    expect(parsed.brand).toEqual({});
    expect(parsed.styleNotes).toBeUndefined();
  });

  it("rejects message shorter than 8 chars", () => {
    expect(() => BriefSchema.parse({ ...validBrief, message: "Linear." })).toThrow();
  });

  it("rejects an unknown arc", () => {
    expect(() => BriefSchema.parse({ ...validBrief, arc: "saga" })).toThrow();
  });

  it("rejects durationMs below 5_000ms", () => {
    expect(() => BriefSchema.parse({ ...validBrief, durationMs: 4000 })).toThrow();
  });

  it("rejects durationMs above 120_000ms", () => {
    expect(() => BriefSchema.parse({ ...validBrief, durationMs: 130_000 })).toThrow();
  });

  it("rejects audience shorter than 3 chars", () => {
    expect(() => BriefSchema.parse({ ...validBrief, audience: "x" })).toThrow();
  });
});

describe("VibeFramesStateSchema", () => {
  it("brief defaults to null", () => {
    const parsed = VibeFramesStateSchema.parse({ projectId: "proj-1" });
    expect(parsed.brief).toBeNull();
    expect(parsed.yolo).toBe(true);
  });

  it("accepts a state with a populated brief", () => {
    const state = {
      projectId: "proj-1",
      yolo: true,
      brief: {
        message: "Stripe makes accepting payments simple.",
        arc: "demonstration" as const,
        audience: "indie devs",
        format: "landscape" as const,
        durationMs: 30000,
        narration: "full" as const,
        brand: {},
      },
    };
    expect(VibeFramesStateSchema.parse(state).brief).toEqual(state.brief);
  });

  it("rejects state where brief is half-populated", () => {
    expect(() =>
      VibeFramesStateSchema.parse({
        projectId: "proj-1",
        brief: { message: "incomplete" }, // missing required fields
      }),
    ).toThrow();
  });
});

describe("createInitialState", () => {
  it("seeds projectId, yolo:true, brief:null, storyboard:null", () => {
    const initial = createInitialState("proj-42");
    expect(initial).toEqual({
      projectId: "proj-42",
      yolo: true,
      brief: null,
      storyboard: null,
    });
  });

  it("respects explicit yolo:false", () => {
    expect(createInitialState("proj-42", false).yolo).toBe(false);
  });
});
