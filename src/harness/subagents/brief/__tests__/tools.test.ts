import { describe, it, expect } from "vitest";
import { createCommitBriefTool } from "../tools";
import type { Brief, VibeFramesState } from "../../../state";

/**
 * Stub harness context — mimics the subset of the real Mastra harnessCtx
 * that commit-brief uses (getState + setState). We capture every setState
 * call to assert on the resulting patches.
 */
function makeStubHarnessCtx(initial: Partial<VibeFramesState> = {}) {
  const state: VibeFramesState = {
    projectId: "proj-test",
    yolo: true,
    brief: null,
    storyboard: null,
    validationReport: null,
    ...initial,
  };
  const setStateCalls: Partial<VibeFramesState>[] = [];
  return {
    state,
    setStateCalls,
    requestContext: {
      get: (key: string) => {
        if (key !== "harness") return undefined;
        return {
          getState: () => state,
          setState: async (patch: Partial<VibeFramesState>) => {
            setStateCalls.push(patch);
            Object.assign(state, patch);
          },
        };
      },
    },
  };
}

const validBriefInput: Brief = {
  message: "Linear ships fast because it gets out of your way.",
  arc: "reveal",
  audience: "engineering teams",
  format: "landscape",
  durationMs: 12000,
  narration: "full",
  styleNotes: "dark cinematic",
  brand: { name: "Linear", primaryColor: "#5E6AD2" },
};

describe("commit-brief", () => {
  const tool = createCommitBriefTool();

  it("writes a valid brief to harness state and returns ok:true", async () => {
    const ctx = makeStubHarnessCtx();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (await tool.execute!(validBriefInput, ctx as any)) as {
      ok: boolean;
      brief?: Brief;
      persisted?: boolean;
    };
    expect(result.ok).toBe(true);
    expect(result.persisted).toBe(true);
    expect(result.brief).toEqual(validBriefInput);
    expect(ctx.setStateCalls).toHaveLength(1);
    expect(ctx.setStateCalls[0]).toEqual({ brief: validBriefInput });
    expect(ctx.state.brief).toEqual(validBriefInput);
  });

  // NOTE: input validation is enforced by Mastra at the schema layer
  // (BriefSchema is the tool's inputSchema), so by the time `execute`
  // runs, input is guaranteed valid. The shape of the schema itself is
  // covered by `BriefSchema` tests in src/harness/__tests__/state.test.ts.

  it("returns ok:true with persisted:false when no harness context is present (test mode)", async () => {
    // Pass a context without requestContext — simulates a unit test runner
    // calling the tool directly without a Mastra harness.
    const result = (await tool.execute!(validBriefInput, {} as never)) as {
      ok: boolean;
      brief?: Brief;
      persisted?: boolean;
    };
    expect(result.ok).toBe(true);
    expect(result.persisted).toBe(false);
    expect(result.brief).toEqual(validBriefInput);
  });

  it("can be called twice with the same input idempotently (overwrites brief)", async () => {
    const ctx = makeStubHarnessCtx();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await tool.execute!(validBriefInput, ctx as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await tool.execute!(validBriefInput, ctx as any);
    expect(ctx.setStateCalls).toHaveLength(2);
    expect(ctx.state.brief).toEqual(validBriefInput);
  });
});
