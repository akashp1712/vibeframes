import { describe, it, expect } from "vitest";
import {
  createEmptyComposition,
  addClip,
  updateClip,
  removeClip,
  addTrack,
  removeTrack,
} from "../mutations";
import type { Composition } from "../types";

function makeComposition(overrides?: Partial<Composition>): Composition {
  return {
    id: "comp-test",
    title: "Test",
    width: 1920,
    height: 1080,
    fps: 30,
    tracks: [],
    ...overrides,
  };
}

describe("createEmptyComposition", () => {
  it("creates a composition with defaults and empty tracks", () => {
    const comp = createEmptyComposition("My Video");
    expect(comp.title).toBe("My Video");
    expect(comp.width).toBe(1920);
    expect(comp.height).toBe(1080);
    expect(comp.fps).toBe(30);
    expect(comp.tracks).toEqual([]);
    expect(comp.id).toMatch(/^comp-/);
  });
});

describe("addClip", () => {
  it("adds a clip to an existing track", () => {
    const comp = makeComposition({
      tracks: [{ id: "t-1", label: "Main", clips: [] }],
    });
    const result = addClip(comp, {
      trackId: "t-1",
      startMs: 0,
      durationMs: 3000,
      html: "<h1>Hello</h1>",
    });
    expect(result.tracks[0].clips).toHaveLength(1);
    expect(result.tracks[0].clips[0].html).toBe("<h1>Hello</h1>");
    expect(result.tracks[0].clips[0].startMs).toBe(0);
    expect(result.tracks[0].clips[0].durationMs).toBe(3000);
    expect(result.tracks[0].clips[0].trackId).toBe("t-1");
    expect(result.tracks[0].clips[0].id).toMatch(/^clip-/);
  });

  it("creates a new track if trackId doesn't exist", () => {
    const comp = makeComposition();
    const result = addClip(comp, {
      trackId: "t-new",
      trackLabel: "Background",
      startMs: 0,
      durationMs: 5000,
      html: "<div>bg</div>",
    });
    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].id).toBe("t-new");
    expect(result.tracks[0].label).toBe("Background");
    expect(result.tracks[0].clips).toHaveLength(1);
  });

  it("auto-labels the track when trackLabel is omitted", () => {
    const comp = makeComposition();
    const result = addClip(comp, {
      trackId: "t-auto",
      startMs: 0,
      durationMs: 1000,
      html: "<p>x</p>",
    });
    expect(result.tracks[0].label).toBe("Track 1");
  });

  it("does not mutate the original composition", () => {
    const comp = makeComposition({
      tracks: [{ id: "t-1", label: "Main", clips: [] }],
    });
    const result = addClip(comp, {
      trackId: "t-1",
      startMs: 0,
      durationMs: 1000,
      html: "<p>x</p>",
    });
    expect(comp.tracks[0].clips).toHaveLength(0);
    expect(result.tracks[0].clips).toHaveLength(1);
  });

  it("rejects negative startMs", () => {
    const comp = makeComposition();
    expect(() =>
      addClip(comp, { trackId: "t-1", startMs: -100, durationMs: 1000, html: "<p>x</p>" })
    ).toThrow();
  });

  it("rejects zero or negative durationMs", () => {
    const comp = makeComposition();
    expect(() =>
      addClip(comp, { trackId: "t-1", startMs: 0, durationMs: 0, html: "<p>x</p>" })
    ).toThrow();
    expect(() =>
      addClip(comp, { trackId: "t-1", startMs: 0, durationMs: -500, html: "<p>x</p>" })
    ).toThrow();
  });
});

describe("updateClip", () => {
  it("updates clip HTML", () => {
    const comp = makeComposition({
      tracks: [
        {
          id: "t-1",
          label: "Main",
          clips: [{ id: "c-1", trackId: "t-1", startMs: 0, durationMs: 3000, html: "<p>old</p>" }],
        },
      ],
    });
    const result = updateClip(comp, { clipId: "c-1", html: "<p>new</p>" });
    expect(result.tracks[0].clips[0].html).toBe("<p>new</p>");
  });

  it("updates clip timing", () => {
    const comp = makeComposition({
      tracks: [
        {
          id: "t-1",
          label: "Main",
          clips: [{ id: "c-1", trackId: "t-1", startMs: 0, durationMs: 3000, html: "<p>x</p>" }],
        },
      ],
    });
    const result = updateClip(comp, { clipId: "c-1", startMs: 1000, durationMs: 5000 });
    expect(result.tracks[0].clips[0].startMs).toBe(1000);
    expect(result.tracks[0].clips[0].durationMs).toBe(5000);
  });

  it("throws when clip not found", () => {
    const comp = makeComposition();
    expect(() => updateClip(comp, { clipId: "nonexistent", html: "<p>x</p>" })).toThrow();
  });

  it("does not mutate the original composition", () => {
    const comp = makeComposition({
      tracks: [
        {
          id: "t-1",
          label: "Main",
          clips: [{ id: "c-1", trackId: "t-1", startMs: 0, durationMs: 3000, html: "<p>old</p>" }],
        },
      ],
    });
    updateClip(comp, { clipId: "c-1", html: "<p>new</p>" });
    expect(comp.tracks[0].clips[0].html).toBe("<p>old</p>");
  });
});

describe("removeClip", () => {
  it("removes a clip from its track", () => {
    const comp = makeComposition({
      tracks: [
        {
          id: "t-1",
          label: "Main",
          clips: [
            { id: "c-1", trackId: "t-1", startMs: 0, durationMs: 3000, html: "<p>a</p>" },
            { id: "c-2", trackId: "t-1", startMs: 3000, durationMs: 2000, html: "<p>b</p>" },
          ],
        },
      ],
    });
    const result = removeClip(comp, { clipId: "c-1" });
    expect(result.tracks[0].clips).toHaveLength(1);
    expect(result.tracks[0].clips[0].id).toBe("c-2");
  });

  it("removes the track when it becomes empty", () => {
    const comp = makeComposition({
      tracks: [
        {
          id: "t-1",
          label: "Main",
          clips: [{ id: "c-1", trackId: "t-1", startMs: 0, durationMs: 3000, html: "<p>x</p>" }],
        },
      ],
    });
    const result = removeClip(comp, { clipId: "c-1" });
    expect(result.tracks).toHaveLength(0);
  });

  it("throws when clip not found", () => {
    const comp = makeComposition();
    expect(() => removeClip(comp, { clipId: "nonexistent" })).toThrow();
  });
});

describe("addTrack", () => {
  it("adds an empty track", () => {
    const comp = makeComposition();
    const result = addTrack(comp, { label: "Audio" });
    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].label).toBe("Audio");
    expect(result.tracks[0].clips).toEqual([]);
    expect(result.tracks[0].id).toMatch(/^track-/);
  });
});

describe("removeTrack", () => {
  it("removes a track and all its clips", () => {
    const comp = makeComposition({
      tracks: [
        {
          id: "t-1",
          label: "Main",
          clips: [{ id: "c-1", trackId: "t-1", startMs: 0, durationMs: 3000, html: "<p>x</p>" }],
        },
        { id: "t-2", label: "Audio", clips: [] },
      ],
    });
    const result = removeTrack(comp, { trackId: "t-1" });
    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].id).toBe("t-2");
  });

  it("throws when track not found", () => {
    const comp = makeComposition();
    expect(() => removeTrack(comp, { trackId: "nonexistent" })).toThrow();
  });
});
