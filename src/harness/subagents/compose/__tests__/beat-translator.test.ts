import { describe, it, expect } from "vitest";
import {
  computeBeatStartMs,
  translateBeat,
  translateStoryboard,
} from "../beat-translator";
import { createHarnessServices } from "../../../services";
import type { Beat, Brief, Storyboard } from "../../../state";

const services = createHarnessServices();
const catalog = services.clipRegistry.getBlockSchemas();

const brief: Brief = {
  message: "Linear ships fast because it gets out of your way.",
  arc: "reveal",
  audience: "engineering teams",
  format: "landscape",
  durationMs: 12000,
  narration: "full",
  styleNotes: "dark cinematic",
  brand: { name: "Linear", primaryColor: "#5E6AD2" },
};

const beats: Beat[] = [
  {
    index: 1,
    concept: "Spark in darkness — the moment before the brand emerges.",
    shotType: "extreme-close",
    cameraMove: "dolly-in",
    techniques: ["radial glow bloom", "grain overlay"],
    blockHints: ["background-fill"],
    voCue: "You shipped it.",
    durationMs: 3000,
    built: false,
    clipIds: [],
  },
  {
    index: 2,
    concept: "Brand wordmark draws across the frame.",
    shotType: "medium",
    cameraMove: "push",
    techniques: ["svg path draw", "accent line sweep"],
    blockHints: ["hero-title"],
    voCue: "Linear.",
    durationMs: 4000,
    built: false,
    clipIds: [],
  },
  {
    index: 3,
    concept: "Three feature panels reveal.",
    shotType: "wide",
    cameraMove: "parallax",
    techniques: ["staggered card entrance", "kinetic type"],
    blockHints: ["split-screen"],
    voCue: "Issues, projects, cycles.",
    durationMs: 5000,
    built: false,
    clipIds: [],
  },
];

const storyboard: Storyboard = { rhythm: "arc", beats };

describe("computeBeatStartMs", () => {
  it("returns 0 for the first beat", () => {
    expect(computeBeatStartMs(storyboard, 1)).toBe(0);
  });
  it("sums prior beat durations", () => {
    expect(computeBeatStartMs(storyboard, 2)).toBe(3000);
    expect(computeBeatStartMs(storyboard, 3)).toBe(7000);
  });
  it("ignores the beat itself", () => {
    expect(computeBeatStartMs(storyboard, 4)).toBe(12000);
  });
});

describe("translateBeat", () => {
  it("emits a background + main clip pair for a basic beat", () => {
    const t = translateBeat({ beat: beats[1]!, storyboard, brief, catalog });
    expect(t.startMs).toBe(3000);
    expect(t.clips).toHaveLength(2);
    const [bg, main] = t.clips;
    expect(bg!.trackId).toBe("track-bg");
    expect(bg!.blockId).toBe("background-fill");
    expect(main!.trackId).toBe("track-main");
  });

  it("respects blockHints when picking the primary block", () => {
    const t = translateBeat({ beat: beats[2]!, storyboard, brief, catalog });
    const main = t.clips.find((c) => c.trackId === "track-main");
    expect(main!.blockId).toBe("split-screen");
  });

  it("falls back to a sensible block when blockHints contains only background-fill", () => {
    const beat: Beat = { ...beats[0]!, blockHints: ["background-fill"] };
    const t = translateBeat({ beat, storyboard, brief, catalog });
    const main = t.clips.find((c) => c.trackId === "track-main");
    // background-fill is filtered out of primary picks; falls back by shotType.
    expect(main!.blockId).not.toBe("background-fill");
  });

  it("renders brand name into hero-title primary block", () => {
    const beat: Beat = {
      ...beats[1]!,
      blockHints: ["hero-title"],
      concept: "Linear",
    };
    const t = translateBeat({ beat, storyboard, brief, catalog });
    const main = t.clips.find((c) => c.trackId === "track-main");
    expect(main!.html).toContain("Linear");
  });

  it("dark-cinematic styleNotes selects a slate gradient bg", () => {
    const t = translateBeat({ beat: beats[0]!, storyboard, brief, catalog });
    const bg = t.clips[0]!;
    expect(bg.html).toMatch(/bg-gradient-to-br/);
    expect(bg.html).toMatch(/from-slate-950/);
  });

  it("punchy/playful styleNotes selects a vivid gradient", () => {
    const punchyBrief: Brief = { ...brief, styleNotes: "punchy social ad" };
    const t = translateBeat({ beat: beats[0]!, storyboard, brief: punchyBrief, catalog });
    expect(t.clips[0]!.html).toMatch(/from-(indigo|fuchsia|amber)/);
  });

  it("adds an overlay clip when blockHints include a social/lower-third block", () => {
    const beat: Beat = {
      ...beats[1]!,
      blockHints: ["hero-title", "lower-third"],
    };
    const t = translateBeat({ beat, storyboard, brief, catalog });
    expect(t.clips).toHaveLength(3);
    const overlay = t.clips.find((c) => c.trackId === "track-overlay");
    expect(overlay!.blockId).toBe("lower-third");
  });

  it("does NOT add an overlay when only background+main blocks are hinted", () => {
    const t = translateBeat({ beat: beats[1]!, storyboard, brief, catalog });
    expect(t.clips.find((c) => c.trackId === "track-overlay")).toBeUndefined();
  });
});

describe("translateStoryboard", () => {
  it("translates every beat and assigns ascending startMs", () => {
    const result = translateStoryboard({ storyboard, brief, registry: services.clipRegistry });
    expect(result.beats).toHaveLength(3);
    expect(result.beats[0]!.translation.startMs).toBe(0);
    expect(result.beats[1]!.translation.startMs).toBe(3000);
    expect(result.beats[2]!.translation.startMs).toBe(7000);
  });
});
