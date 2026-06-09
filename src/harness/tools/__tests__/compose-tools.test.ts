import { describe, it, expect, beforeEach } from "vitest";
import {
  createCreateBeatTool,
  createReviseBeatTool,
  createRebuildBeatTool,
  createFinishComposeTool,
} from "../compose-tools";
import { createHarnessServices } from "../../services";
import type { Beat, Brief, Storyboard, VibeFramesState } from "../../state";
import {
  __resetCompositionStoreForTests,
  getComposition,
} from "../../composition/store";

const services = createHarnessServices();

const validBrief: Brief = {
  message: "Linear ships fast.",
  arc: "reveal",
  audience: "engineering teams",
  format: "landscape",
  durationMs: 12000,
  narration: "full",
  brand: { name: "Linear", primaryColor: "#5E6AD2" },
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

const baseStoryboard: Storyboard = {
  rhythm: "arc",
  beats: [makeBeat(1, 4000), makeBeat(2, 4000), makeBeat(3, 4000)],
};

function makeStubCtx(initial?: Partial<VibeFramesState>) {
  const state: VibeFramesState = {
    projectId: "proj-test-" + Date.now() + Math.random(),
    yolo: true,
    brief: validBrief,
    storyboard: baseStoryboard,
    validationReport: null,
    ...initial,
  };
  return {
    state,
    requestContext: {
      get: (k: string) =>
        k === "harness"
          ? {
              getState: () => state,
              setState: async (p: Partial<VibeFramesState>) => {
                Object.assign(state, p);
              },
            }
          : undefined,
    },
  };
}

beforeEach(() => {
  __resetCompositionStoreForTests();
});

describe("create-beat", () => {
  const tool = createCreateBeatTool(services);

  it("emits clips and marks the beat built", async () => {
    const ctx = makeStubCtx();
    const r = (await tool.execute!({ index: 1 }, ctx as unknown as Parameters<NonNullable<typeof tool.execute>>[1])) as {
      ok: boolean;
      clipIds?: string[];
      blocksUsed?: string[];
    };
    expect(r.ok).toBe(true);
    expect(r.clipIds!.length).toBeGreaterThan(0);
    const updatedBeat = ctx.state.storyboard!.beats.find((b) => b.index === 1);
    expect(updatedBeat!.built).toBe(true);
    expect(updatedBeat!.clipIds).toEqual(r.clipIds);
  });
});

describe("revise-beat", () => {
  const tool = createReviseBeatTool();

  it("patches blockHints and techniques", async () => {
    const ctx = makeStubCtx();
    const r = (await tool.execute!(
      {
        index: 1,
        patch: { blockHints: ["split-screen"], techniques: ["new-tech-a", "new-tech-b"] },
      },
      ctx as unknown as Parameters<NonNullable<typeof tool.execute>>[1],
    )) as { ok: boolean };
    expect(r.ok).toBe(true);
    const beat = ctx.state.storyboard!.beats.find((b) => b.index === 1);
    expect(beat!.blockHints).toEqual(["split-screen"]);
    expect(beat!.techniques).toEqual(["new-tech-a", "new-tech-b"]);
  });

  it("does not touch durationMs (structural fields are out of scope)", async () => {
    const ctx = makeStubCtx();
    const r = (await tool.execute!(
      // @ts-expect-error — runtime should reject the schema validation
      { index: 1, patch: { durationMs: 9999 } },
      ctx as unknown as Parameters<NonNullable<typeof tool.execute>>[1],
    )) as { ok: boolean };
    // Mastra strips unknown keys from the patch, so the tool succeeds but
    // durationMs is unchanged.
    expect(r.ok).toBe(true);
    const beat = ctx.state.storyboard!.beats.find((b) => b.index === 1);
    expect(beat!.durationMs).toBe(4000);
  });

  it("rejects when the index doesn't exist", async () => {
    const ctx = makeStubCtx();
    const r = (await tool.execute!(
      { index: 99, patch: { blockHints: ["x"] } },
      ctx as unknown as Parameters<NonNullable<typeof tool.execute>>[1],
    )) as { ok: boolean; error?: string };
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/no beat with index 99/);
  });
});

describe("rebuild-beat", () => {
  const create = createCreateBeatTool(services);
  const revise = createReviseBeatTool();
  const rebuild = createRebuildBeatTool(services);

  it("removes existing clips and re-emits with new blockHints", async () => {
    const ctx = makeStubCtx();
    // First build with hero-title
    const created = (await create.execute!({ index: 1 }, ctx as unknown as Parameters<NonNullable<typeof create.execute>>[1])) as {
      ok: boolean;
      clipIds: string[];
      blocksUsed: string[];
    };
    expect(created.blocksUsed).toContain("hero-title");
    const originalIds = [...created.clipIds];

    // Revise to use split-screen
    await revise.execute!(
      { index: 1, patch: { blockHints: ["split-screen"] } },
      ctx as unknown as Parameters<NonNullable<typeof revise.execute>>[1],
    );

    // Rebuild
    const rebuilt = (await rebuild.execute!({ index: 1 }, ctx as unknown as Parameters<NonNullable<typeof rebuild.execute>>[1])) as {
      ok: boolean;
      clipIds: string[];
      blocksUsed: string[];
    };
    expect(rebuilt.ok).toBe(true);
    expect(rebuilt.blocksUsed).toContain("split-screen");
    // Clip IDs should be different (old removed, new emitted)
    expect(rebuilt.clipIds).not.toEqual(originalIds);

    // Composition should NOT contain any of the original clip ids
    const composition = getComposition(ctx.state.projectId);
    const allIds = new Set(composition.tracks.flatMap((t) => t.clips.map((c) => c.id)));
    for (const oldId of originalIds) {
      expect(allIds.has(oldId)).toBe(false);
    }
  });

  it("works on a never-built beat (acts like create-beat)", async () => {
    const ctx = makeStubCtx();
    const r = (await rebuild.execute!({ index: 2 }, ctx as unknown as Parameters<NonNullable<typeof rebuild.execute>>[1])) as {
      ok: boolean;
      clipIds: string[];
    };
    expect(r.ok).toBe(true);
    expect(r.clipIds.length).toBeGreaterThan(0);
    const beat = ctx.state.storyboard!.beats.find((b) => b.index === 2);
    expect(beat!.built).toBe(true);
  });

  it("rejects when no brief is committed", async () => {
    const ctx = makeStubCtx({ brief: null });
    const r = (await rebuild.execute!({ index: 1 }, ctx as unknown as Parameters<NonNullable<typeof rebuild.execute>>[1])) as {
      ok: boolean;
      error?: string;
    };
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/brief/);
  });
});

describe("finish-compose", () => {
  const tool = createFinishComposeTool();

  it("ok:true when every beat is built", async () => {
    const ctx = makeStubCtx({
      storyboard: {
        ...baseStoryboard,
        beats: baseStoryboard.beats.map((b) => ({ ...b, built: true, clipIds: ["c1"] })),
      },
    });
    const r = (await tool.execute!({}, ctx as unknown as Parameters<NonNullable<typeof tool.execute>>[1])) as { ok: boolean; beatCount?: number };
    expect(r.ok).toBe(true);
    expect(r.beatCount).toBe(3);
  });

  it("ok:false with missing indices when some beats are unbuilt", async () => {
    const ctx = makeStubCtx();
    const r = (await tool.execute!({}, ctx as unknown as Parameters<NonNullable<typeof tool.execute>>[1])) as { ok: boolean; error?: string };
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/unbuilt beats: 1, 2, 3/);
  });
});
