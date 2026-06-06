import { describe, it, expect, beforeEach } from "vitest";
import { createAddTransitionTool } from "../tools/add-transition";
import { createHarnessServices } from "../services";
import { addClip } from "../mutations";
import {
  getComposition,
  setComposition,
  __resetCompositionStoreForTests,
} from "../composition-store";

/**
 * Behaviour spec for `add-transition`. The tool's job is to:
 *   - look up the transition in the registry and refuse unknown / Tier 2/3 ids
 *   - derive a `cutMs` from the source track when not provided
 *   - centre the overlay on the cut point on a dedicated transition track
 *   - substitute template vars and refuse if any required var is missing
 *   - handle `cut` as a logical-only no-op
 *
 * Mastra wraps the execute fn but preserves it on the returned Tool, so we
 * call `tool.execute(args)` directly in tests (bypassing Zod validation,
 * which is fine — TypeScript already typechecks the call sites).
 */

const PROJECT = "test-project-add-transition";

type TransitionResult = {
  transitionId: string;
  clipId?: string;
  trackId?: string;
  cutMs: number;
  startMs?: number;
  durationMs: number;
  note?: string;
  compositionHtml: string;
  trackCount: number;
  clipCount: number;
};

function setupTwoClips() {
  const c0 = getComposition(PROJECT);
  let c = addClip(c0, {
    trackId: "track-main",
    startMs: 0,
    durationMs: 3000,
    html: "<div class='flex h-full w-full bg-black text-white'>A</div>",
  });
  c = addClip(c, {
    trackId: "track-main",
    startMs: 3000,
    durationMs: 3000,
    html: "<div class='flex h-full w-full bg-white text-black'>B</div>",
  });
  setComposition(PROJECT, c);
  return c;
}

describe("add-transition tool", () => {
  const services = createHarnessServices();
  const tool = createAddTransitionTool(services);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runTool = (args: any): Promise<TransitionResult> =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tool.execute as any)(args) as Promise<TransitionResult>;

  beforeEach(() => {
    __resetCompositionStoreForTests();
  });

  it("refuses an unknown transition id", async () => {
    setupTwoClips();
    await expect(
      runTool({
        projectId: PROJECT,
        sourceTrackId: "track-main",
        transitionId: "does-not-exist",
      }),
    ).rejects.toThrow(/Unknown transition/);
  });

  it("refuses Tier 2 catalog stubs", async () => {
    setupTwoClips();
    await expect(
      runTool({
        projectId: PROJECT,
        sourceTrackId: "track-main",
        // Only `morph-shapes` and `morph-type` remain Tier 2 after the M10
        // promotion rounds. Both need SVG path tweening which is parked for
        // the sub-composition architecture step.
        transitionId: "morph-shapes",
      }),
    ).rejects.toThrow(/Tier 2/);
  });

  it("refuses Tier 3 VFX stubs", async () => {
    setupTwoClips();
    await expect(
      runTool({
        projectId: PROJECT,
        sourceTrackId: "track-main",
        transitionId: "vfx-shatter",
      }),
    ).rejects.toThrow(/Tier 3/);
  });

  it("treats `cut` as a no-op and does not add a clip", async () => {
    setupTwoClips();
    const before = getComposition(PROJECT);
    const beforeClipCount = before.tracks.reduce((s, t) => s + t.clips.length, 0);

    const result = await runTool({
      projectId: PROJECT,
      sourceTrackId: "track-main",
      transitionId: "cut",
    });

    expect(result.durationMs).toBe(0);
    expect(result.note).toMatch(/no overlay/i);

    const after = getComposition(PROJECT);
    expect(after.tracks.reduce((s, t) => s + t.clips.length, 0)).toBe(beforeClipCount);
  });

  it("adds an overlay clip on a dedicated transition track for `fade-through-black`", async () => {
    setupTwoClips();

    const result = await runTool({
      projectId: PROJECT,
      sourceTrackId: "track-main",
      transitionId: "fade-through-black",
    });

    expect(result.transitionId).toBe("fade-through-black");
    expect(result.cutMs).toBe(3000);
    expect(result.durationMs).toBe(600);
    // overlay centred on cut: 3000 - 300 = 2700
    expect(result.startMs).toBe(2700);
    expect(result.trackId).toBe("track-transition-track-main");

    const after = getComposition(PROJECT);
    const fxTrack = after.tracks.find((t) => t.id === "track-transition-track-main");
    expect(fxTrack).toBeDefined();
    expect(fxTrack!.clips).toHaveLength(1);
    expect(fxTrack!.clips[0].html).toContain("bg-black");
  });

  it("derives cutMs from the boundary of the last two clips when not provided", async () => {
    setupTwoClips();

    const result = await runTool({
      projectId: PROJECT,
      sourceTrackId: "track-main",
      transitionId: "fade",
    });

    expect(result.cutMs).toBe(3000);
  });

  it("clamps overlay startMs to 0 when the cut is near the timeline start", async () => {
    // Place clips that meet near t=200ms so a 600ms transition would otherwise
    // start at -100ms.
    const c0 = getComposition(PROJECT);
    let c = addClip(c0, {
      trackId: "track-main",
      startMs: 0,
      durationMs: 200,
      html: "<div class='flex h-full w-full bg-black'></div>",
    });
    c = addClip(c, {
      trackId: "track-main",
      startMs: 200,
      durationMs: 2000,
      html: "<div class='flex h-full w-full bg-white'></div>",
    });
    setComposition(PROJECT, c);

    const result = await runTool({
      projectId: PROJECT,
      sourceTrackId: "track-main",
      transitionId: "fade-through-black",
    });

    expect(result.startMs).toBe(0);
  });

  it("substitutes required vars for slide-left", async () => {
    setupTwoClips();

    const result = await runTool({
      projectId: PROJECT,
      sourceTrackId: "track-main",
      transitionId: "slide-left",
      vars: { bgClass: "bg-rose-500" },
    });

    const after = getComposition(PROJECT);
    const fxTrack = after.tracks.find((t) => t.id === "track-transition-track-main");
    expect(fxTrack!.clips[0].html).toContain("bg-rose-500");
    expect(fxTrack!.clips[0].html).not.toContain("{{bgClass}}");
    expect(result.transitionId).toBe("slide-left");
  });

  it("auto-fills missing required vars from registry defaults and notes the assist", async () => {
    // Forgiveness pattern: gpt-4o-mini frequently emits `vars: {}` even when
    // the schema declares `bgClass` as required. Rather than looping on a
    // free-form error message it can't parse, we fall back to the registry's
    // `defaultValue` for cosmetic vars and surface a `note` so the journal
    // shows what happened. Content-shaped vars (no defaultValue) still
    // hard-fail — see `refuses without required vars` below.
    setupTwoClips();

    const result = await runTool({
      projectId: PROJECT,
      sourceTrackId: "track-main",
      transitionId: "slide-left",
      // missing bgClass — should auto-fill to "bg-black"
    });

    expect(result.transitionId).toBe("slide-left");
    expect(result.note).toMatch(/auto-filled.*bgClass.*bg-black/i);

    const after = getComposition(PROJECT);
    const fxTrack = after.tracks.find((t) => t.id === "track-transition-track-main");
    expect(fxTrack!.clips[0].html).toContain("bg-black");
    expect(fxTrack!.clips[0].html).not.toContain("{{bgClass}}");
  });

  it("explicit vars override registry defaults (no auto-fill note)", async () => {
    setupTwoClips();

    const result = await runTool({
      projectId: PROJECT,
      sourceTrackId: "track-main",
      transitionId: "slide-left",
      vars: { bgClass: "bg-amber-400" },
    });

    expect(result.note).toBeUndefined();
    const after = getComposition(PROJECT);
    const fxTrack = after.tracks.find((t) => t.id === "track-transition-track-main");
    expect(fxTrack!.clips[0].html).toContain("bg-amber-400");
  });

  it("respects an explicit cutMs and durationMs", async () => {
    setupTwoClips();

    const result = await runTool({
      projectId: PROJECT,
      sourceTrackId: "track-main",
      transitionId: "fade",
      cutMs: 1500,
      durationMs: 200,
    });

    expect(result.cutMs).toBe(1500);
    expect(result.durationMs).toBe(200);
    expect(result.startMs).toBe(1400);
  });

  it("requires at least 2 clips on the source track when cutMs is omitted", async () => {
    const c0 = getComposition(PROJECT);
    const single = addClip(c0, {
      trackId: "track-main",
      startMs: 0,
      durationMs: 1000,
      html: "<div class='flex h-full w-full bg-black'></div>",
    });
    setComposition(PROJECT, single);

    await expect(
      runTool({
        projectId: PROJECT,
        sourceTrackId: "track-main",
        transitionId: "fade",
      }),
    ).rejects.toThrow(/at least 2 clips/);
  });
});
