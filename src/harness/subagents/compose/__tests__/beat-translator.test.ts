import { describe, it, expect } from "vitest";
import {
  computeBeatStartMs,
  safeHexColor,
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

describe("safeHexColor", () => {
  it("accepts standard 6-digit hex", () => {
    expect(safeHexColor("#5E6AD2")).toBe("#5E6AD2");
    expect(safeHexColor("#000000")).toBe("#000000");
  });
  it("accepts 3, 4, and 8-digit hex", () => {
    expect(safeHexColor("#abc")).toBe("#abc");
    expect(safeHexColor("#abcd")).toBe("#abcd");
    expect(safeHexColor("#a1b2c3d4")).toBe("#a1b2c3d4");
  });
  it("trims whitespace", () => {
    expect(safeHexColor("  #5E6AD2  ")).toBe("#5E6AD2");
  });
  it("rejects null/undefined/empty", () => {
    expect(safeHexColor(null)).toBeNull();
    expect(safeHexColor(undefined)).toBeNull();
    expect(safeHexColor("")).toBeNull();
  });
  it("rejects non-hex CSS color forms", () => {
    expect(safeHexColor("red")).toBeNull();
    expect(safeHexColor("rgb(255,0,0)")).toBeNull();
    expect(safeHexColor("rgba(0,0,0,1)")).toBeNull();
    expect(safeHexColor("hsl(0,100%,50%)")).toBeNull();
    expect(safeHexColor("var(--brand)")).toBeNull();
    expect(safeHexColor("currentColor")).toBeNull();
  });
  it("rejects malformed hex (wrong length, missing #)", () => {
    expect(safeHexColor("5E6AD2")).toBeNull();
    expect(safeHexColor("#5E6AD")).toBeNull(); // 5 digits
    expect(safeHexColor("#5E6AD2X")).toBeNull();
    expect(safeHexColor("#xyzxyz")).toBeNull();
  });
  it("rejects attribute-escape attempts", () => {
    expect(safeHexColor('#5E6AD2"); --x: url(')).toBeNull();
    expect(safeHexColor("#5E6AD2</style>")).toBeNull();
    expect(safeHexColor('#5E6AD2" onload="alert(1)')).toBeNull();
  });
});

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

  it("injects brief.brand.primaryColor into the background clip's HTML", () => {
    // brief.brand.primaryColor is "#5E6AD2"
    const t = translateBeat({ beat: beats[0]!, storyboard, brief, catalog });
    const bg = t.clips.find((c) => c.trackId === "track-bg")!;
    expect(bg.html).toContain("#5E6AD2");
  });

  it("does NOT inject a brand color when primaryColor is undefined", () => {
    const briefSansColor: Brief = { ...brief, brand: { name: "Linear" } };
    const t = translateBeat({ beat: beats[0]!, storyboard, brief: briefSansColor, catalog });
    const bg = t.clips.find((c) => c.trackId === "track-bg")!;
    expect(bg.html).not.toContain("#");
  });

  it("rejects an unsafe primaryColor (CSS-injection attempt) and emits no brand accent", () => {
    const malicious: Brief = {
      ...brief,
      brand: {
        name: "Linear",
        primaryColor: '#5E6AD2"); --x: url(javascript:alert(1)',
      },
    };
    const t = translateBeat({ beat: beats[0]!, storyboard, brief: malicious, catalog });
    const bg = t.clips.find((c) => c.trackId === "track-bg")!;
    // The unsafe value must NOT appear anywhere in the rendered HTML —
    // not the original literal, not a partial.
    expect(bg.html).not.toContain("javascript:");
    expect(bg.html).not.toContain("--x:");
    expect(bg.html).not.toContain('");');
    // No accent div either (safeHexColor returned null → brandAccent → "").
    expect(bg.html).not.toContain("linear-gradient");
  });

  it("rejects rgb(), named colors, and css variables", () => {
    for (const bad of ["rgb(255,0,0)", "red", "var(--brand)", "rgba(0,0,0,1)"]) {
      const b: Brief = { ...brief, brand: { name: "X", primaryColor: bad } };
      const t = translateBeat({ beat: beats[0]!, storyboard, brief: b, catalog });
      const bg = t.clips.find((c) => c.trackId === "track-bg")!;
      expect(bg.html).not.toContain("linear-gradient");
    }
  });

  it("brand-accent satisfies the brand-color-presence rule (>=30% of clips)", () => {
    // Translate every beat — the bg clip on each carries the accent, which
    // is half of all clips emitted (bg + main = 2 per beat). Half ≥ 30%.
    const allHtml = beats
      .flatMap((b) => translateBeat({ beat: b, storyboard, brief, catalog }).clips)
      .map((c) => c.html);
    const withColor = allHtml.filter((h) => h.toLowerCase().includes("#5e6ad2"));
    expect(withColor.length / allHtml.length).toBeGreaterThanOrEqual(0.3);
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
