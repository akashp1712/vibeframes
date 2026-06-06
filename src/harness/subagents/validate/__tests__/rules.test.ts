import { describe, it, expect } from "vitest";
import {
  beatNotBuilt,
  clipCoverage,
  durationDrift,
  consecutiveBlockRepeat,
  brandColorPresence,
  runAllRules,
} from "../rules";
import type { Beat, Brief, Storyboard } from "../../../state";
import type { Composition } from "../../../composition/schema";

const brief: Brief = {
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
    concept: `Beat ${index} concept`,
    shotType: "medium",
    cameraMove: "dolly-in",
    techniques: ["tech-a", "tech-b"],
    blockHints: [],
    voCue: null,
    durationMs,
    built: true,
    clipIds: [],
    ...overrides,
  };
}

function emptyComposition(): Composition {
  return { id: "comp-1", title: "Test", width: 1920, height: 1080, fps: 30, tracks: [] };
}

describe("beat-not-built", () => {
  it("returns no issues when every beat is built", () => {
    const sb: Storyboard = { rhythm: "arc", beats: [makeBeat(1, 6000), makeBeat(2, 6000)] };
    expect(beatNotBuilt({ storyboard: sb, composition: emptyComposition(), brief })).toEqual([]);
  });
  it("flags every unbuilt beat as an error", () => {
    const sb: Storyboard = {
      rhythm: "arc",
      beats: [makeBeat(1, 6000, { built: false }), makeBeat(2, 6000)],
    };
    const issues = beatNotBuilt({ storyboard: sb, composition: emptyComposition(), brief });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.severity).toBe("error");
    expect(issues[0]!.beatIndex).toBe(1);
  });
});

describe("clip-coverage", () => {
  it("flags built beats with no clipIds", () => {
    const sb: Storyboard = {
      rhythm: "arc",
      beats: [makeBeat(1, 12000, { built: true, clipIds: [] })],
    };
    const issues = clipCoverage({ storyboard: sb, composition: emptyComposition(), brief });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.severity).toBe("error");
  });
  it("flags clipIds that don't resolve to real clips", () => {
    const sb: Storyboard = {
      rhythm: "arc",
      beats: [makeBeat(1, 12000, { clipIds: ["ghost-clip"] })],
    };
    const issues = clipCoverage({ storyboard: sb, composition: emptyComposition(), brief });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toMatch(/ghost-clip/);
  });
  it("passes when every clipId resolves", () => {
    const composition: Composition = {
      ...emptyComposition(),
      tracks: [
        {
          id: "track-main",
          label: "Main",
          clips: [{ id: "real-clip", trackId: "track-main", startMs: 0, durationMs: 12000, html: "<div></div>" }],
        },
      ],
    };
    const sb: Storyboard = {
      rhythm: "arc",
      beats: [makeBeat(1, 12000, { clipIds: ["real-clip"] })],
    };
    expect(clipCoverage({ storyboard: sb, composition, brief })).toEqual([]);
  });
});

describe("duration-drift", () => {
  it("warns when clip span exceeds beat durationMs by more than tolerance", () => {
    const composition: Composition = {
      ...emptyComposition(),
      tracks: [
        {
          id: "track-main",
          label: "Main",
          clips: [{ id: "c1", trackId: "track-main", startMs: 0, durationMs: 7000, html: "" }],
        },
      ],
    };
    const sb: Storyboard = {
      rhythm: "arc",
      beats: [makeBeat(1, 6000, { clipIds: ["c1"] })],
    };
    const issues = durationDrift({ storyboard: sb, composition, brief });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.severity).toBe("warning");
  });
  it("tolerates small drifts within ±500ms", () => {
    const composition: Composition = {
      ...emptyComposition(),
      tracks: [
        {
          id: "track-main",
          label: "Main",
          clips: [{ id: "c1", trackId: "track-main", startMs: 0, durationMs: 6300, html: "" }],
        },
      ],
    };
    const sb: Storyboard = {
      rhythm: "arc",
      beats: [makeBeat(1, 6000, { clipIds: ["c1"] })],
    };
    expect(durationDrift({ storyboard: sb, composition, brief })).toEqual([]);
  });
});

describe("consecutive-block-repeat", () => {
  function makeMainClip(id: string, startMs: number, durationMs: number, html: string) {
    return { id, trackId: "track-main", startMs, durationMs, html };
  }
  it("warns when 3 adjacent beats use identical primary HTML", () => {
    const dupHtml = "<div class='hero'>Same</div>".padEnd(250, " ");
    const composition: Composition = {
      ...emptyComposition(),
      tracks: [
        {
          id: "track-main",
          label: "Main",
          clips: [
            makeMainClip("c1", 0, 4000, dupHtml),
            makeMainClip("c2", 4000, 4000, dupHtml),
            makeMainClip("c3", 8000, 4000, dupHtml),
          ],
        },
      ],
    };
    const sb: Storyboard = {
      rhythm: "arc",
      beats: [
        makeBeat(1, 4000, { clipIds: ["c1"] }),
        makeBeat(2, 4000, { clipIds: ["c2"] }),
        makeBeat(3, 4000, { clipIds: ["c3"] }),
      ],
    };
    const issues = consecutiveBlockRepeat({ storyboard: sb, composition, brief });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.severity).toBe("warning");
    expect(issues[0]!.message).toMatch(/same primary block/);
  });
  it("does NOT warn when adjacent beats use different HTML", () => {
    const composition: Composition = {
      ...emptyComposition(),
      tracks: [
        {
          id: "track-main",
          label: "Main",
          clips: [
            { id: "c1", trackId: "track-main", startMs: 0, durationMs: 4000, html: "<div>A</div>" },
            { id: "c2", trackId: "track-main", startMs: 4000, durationMs: 4000, html: "<div>B</div>" },
            { id: "c3", trackId: "track-main", startMs: 8000, durationMs: 4000, html: "<div>C</div>" },
          ],
        },
      ],
    };
    const sb: Storyboard = {
      rhythm: "arc",
      beats: [
        makeBeat(1, 4000, { clipIds: ["c1"] }),
        makeBeat(2, 4000, { clipIds: ["c2"] }),
        makeBeat(3, 4000, { clipIds: ["c3"] }),
      ],
    };
    expect(consecutiveBlockRepeat({ storyboard: sb, composition, brief })).toEqual([]);
  });
});

describe("brand-color-presence", () => {
  it("does nothing when no primaryColor is set", () => {
    const composition: Composition = {
      ...emptyComposition(),
      tracks: [
        {
          id: "track-main",
          label: "Main",
          clips: [{ id: "c1", trackId: "track-main", startMs: 0, durationMs: 6000, html: "<div></div>" }],
        },
      ],
    };
    const briefSansColor: Brief = { ...brief, brand: { name: "X" } };
    expect(
      brandColorPresence({
        storyboard: { rhythm: "arc", beats: [] },
        composition,
        brief: briefSansColor,
      }),
    ).toEqual([]);
  });
  it("warns when primaryColor appears in <30% of clips", () => {
    const composition: Composition = {
      ...emptyComposition(),
      tracks: [
        {
          id: "track-main",
          label: "Main",
          clips: [
            { id: "c1", trackId: "track-main", startMs: 0, durationMs: 4000, html: "no color" },
            { id: "c2", trackId: "track-main", startMs: 4000, durationMs: 4000, html: "no color" },
            { id: "c3", trackId: "track-main", startMs: 8000, durationMs: 4000, html: "no color" },
            { id: "c4", trackId: "track-main", startMs: 12000, durationMs: 4000, html: "with #5e6abd2 — typo!" },
          ],
        },
      ],
    };
    const issues = brandColorPresence({
      storyboard: { rhythm: "arc", beats: [] },
      composition,
      brief,
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.severity).toBe("warning");
    expect(issues[0]!.rule).toBe("brand-color-presence");
  });
  it("passes when primaryColor appears in ≥30% of clips", () => {
    const html = "color: #5E6AD2";
    const composition: Composition = {
      ...emptyComposition(),
      tracks: [
        {
          id: "track-main",
          label: "Main",
          clips: [
            { id: "c1", trackId: "track-main", startMs: 0, durationMs: 4000, html },
            { id: "c2", trackId: "track-main", startMs: 4000, durationMs: 4000, html },
            { id: "c3", trackId: "track-main", startMs: 8000, durationMs: 4000, html: "no color" },
          ],
        },
      ],
    };
    expect(
      brandColorPresence({
        storyboard: { rhythm: "arc", beats: [] },
        composition,
        brief,
      }),
    ).toEqual([]);
  });
});

describe("runAllRules", () => {
  it("aggregates issues from every rule", () => {
    const sb: Storyboard = {
      rhythm: "arc",
      beats: [makeBeat(1, 6000, { built: false }), makeBeat(2, 6000, { built: false })],
    };
    const issues = runAllRules({ storyboard: sb, composition: emptyComposition(), brief });
    // 2 beat-not-built errors expected
    expect(issues.filter((i) => i.rule === "beat-not-built")).toHaveLength(2);
  });
});
