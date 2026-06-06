import { describe, it, expect } from "vitest";
import { createCommitStoryboardTool } from "../tools";
import type { Beat, Brief, Storyboard, VibeFramesState } from "../../../state";

const validBrief: Brief = {
  message: "Linear ships fast because it gets out of your way.",
  arc: "reveal",
  audience: "engineering teams",
  format: "landscape",
  durationMs: 12000,
  narration: "full",
  brand: { name: "Linear" },
};

function makeBeat(index: number, durationMs: number, overrides: Partial<Beat> = {}): Beat {
  return {
    index,
    concept: `Beat ${index} concept text`,
    shotType: "medium",
    cameraMove: "dolly-in",
    techniques: ["staggered card entrance", "kinetic type"],
    blockHints: ["hero-title"],
    voCue: null,
    durationMs,
    built: false,
    clipIds: [],
    ...overrides,
  };
}

function makeStubCtx(initial: Partial<VibeFramesState> = { brief: validBrief }) {
  const state: VibeFramesState = {
    projectId: "proj-test",
    yolo: true,
    brief: validBrief,
    storyboard: null,
    ...initial,
  };
  const calls: Partial<VibeFramesState>[] = [];
  return {
    state,
    calls,
    requestContext: {
      get: (k: string) =>
        k === "harness"
          ? {
              getState: () => state,
              setState: async (p: Partial<VibeFramesState>) => {
                calls.push(p);
                Object.assign(state, p);
              },
            }
          : undefined,
    },
  };
}

describe("commit-storyboard", () => {
  const tool = createCommitStoryboardTool();

  it("commits a valid storyboard whose durations sum to brief.durationMs", async () => {
    const sb: Storyboard = {
      rhythm: "arc",
      beats: [makeBeat(1, 3000), makeBeat(2, 4000), makeBeat(3, 5000)],
    };
    const ctx = makeStubCtx();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = (await tool.execute!({ storyboard: sb }, ctx as any)) as {
      ok: boolean;
      persisted?: boolean;
    };
    expect(r.ok).toBe(true);
    expect(r.persisted).toBe(true);
    expect(ctx.state.storyboard?.beats).toHaveLength(3);
  });

  it("rejects when durations under-shoot beyond tolerance", async () => {
    const sb: Storyboard = {
      rhythm: "fast",
      beats: [makeBeat(1, 1000), makeBeat(2, 1000), makeBeat(3, 1000)],
    };
    const ctx = makeStubCtx();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = (await tool.execute!({ storyboard: sb }, ctx as any)) as {
      ok: boolean;
      error?: string;
    };
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/sum to/);
    expect(ctx.calls).toHaveLength(0);
  });

  it("accepts a sum within ±500ms tolerance", async () => {
    const sb: Storyboard = {
      rhythm: "arc",
      beats: [makeBeat(1, 3000), makeBeat(2, 4200), makeBeat(3, 5100)], // 12300, +300 from 12000
    };
    const ctx = makeStubCtx();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = (await tool.execute!({ storyboard: sb }, ctx as any)) as { ok: boolean };
    expect(r.ok).toBe(true);
  });

  it("rejects gapped indices", async () => {
    const sb: Storyboard = {
      rhythm: "moderate",
      beats: [makeBeat(1, 6000), makeBeat(3, 6000)],
    };
    const ctx = makeStubCtx();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = (await tool.execute!({ storyboard: sb }, ctx as any)) as {
      ok: boolean;
      error?: string;
    };
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/sequentially/);
  });

  it("rejects when no brief is committed yet", async () => {
    const sb: Storyboard = {
      rhythm: "arc",
      beats: [makeBeat(1, 6000), makeBeat(2, 6000)],
    };
    const ctx = makeStubCtx({ brief: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = (await tool.execute!({ storyboard: sb }, ctx as any)) as {
      ok: boolean;
      error?: string;
    };
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/brief/);
  });
});
