import { describe, it, expect } from "vitest";
import { serialize } from "../serialize";
import type { Composition } from "../schema";

function makeComposition(overrides?: Partial<Composition>): Composition {
  return {
    id: "comp-1",
    title: "Test Video",
    width: 1920,
    height: 1080,
    fps: 30,
    tracks: [],
    ...overrides,
  };
}

describe("serialize", () => {
  it("produces a root div with composition metadata", () => {
    const comp = makeComposition();
    const html = serialize(comp);
    expect(html).toContain('data-composition-id="comp-1"');
    expect(html).toContain('data-width="1920"');
    expect(html).toContain('data-height="1080"');
  });

  it("renders clips with correct data attributes", () => {
    const comp = makeComposition({
      tracks: [
        {
          id: "t-1",
          label: "Main",
          clips: [
            {
              id: "c-1",
              trackId: "t-1",
              startMs: 500,
              durationMs: 3000,
              html: '<h1 style="color:white">Welcome</h1>',
            },
          ],
        },
      ],
    });
    const html = serialize(comp);
    expect(html).toContain('data-clip-id="c-1"');
    expect(html).toContain('data-start="0.5"');
    expect(html).toContain('data-duration="3"');
    expect(html).toContain('data-track-index="0"');
    expect(html).toContain("Welcome");
  });

  it("converts milliseconds to seconds", () => {
    const comp = makeComposition({
      tracks: [
        {
          id: "t-1",
          label: "Main",
          clips: [
            { id: "c-1", trackId: "t-1", startMs: 1500, durationMs: 2500, html: "<p>x</p>" },
          ],
        },
      ],
    });
    const html = serialize(comp);
    expect(html).toContain('data-start="1.5"');
    expect(html).toContain('data-duration="2.5"');
  });

  it("assigns correct track-index for multiple tracks", () => {
    const comp = makeComposition({
      tracks: [
        {
          id: "t-1",
          label: "Video",
          clips: [{ id: "c-1", trackId: "t-1", startMs: 0, durationMs: 1000, html: "<div>a</div>" }],
        },
        {
          id: "t-2",
          label: "Audio",
          clips: [
            { id: "c-2", trackId: "t-2", startMs: 0, durationMs: 2000, html: "<audio src='bg.mp3' />" },
          ],
        },
      ],
    });
    const html = serialize(comp);
    expect(html).toContain('data-clip-id="c-1"');
    expect(html).toContain('data-track-index="0"');
    expect(html).toContain('data-clip-id="c-2"');
    expect(html).toContain('data-track-index="1"');
  });

  it("handles empty composition", () => {
    const comp = makeComposition();
    const html = serialize(comp);
    expect(html).toContain('id="root"');
    expect(html).not.toContain("data-clip-id");
  });

  it("preserves clip HTML content", () => {
    const clipHtml = '<div style="background:red;position:absolute;inset:0">Full BG</div>';
    const comp = makeComposition({
      tracks: [
        {
          id: "t-1",
          label: "BG",
          clips: [{ id: "c-1", trackId: "t-1", startMs: 0, durationMs: 5000, html: clipHtml }],
        },
      ],
    });
    const html = serialize(comp);
    expect(html).toContain("Full BG");
    expect(html).toContain("background:red");
  });

  it("renders multiple clips on the same track", () => {
    const comp = makeComposition({
      tracks: [
        {
          id: "t-1",
          label: "Main",
          clips: [
            { id: "c-1", trackId: "t-1", startMs: 0, durationMs: 2000, html: "<p>first</p>" },
            { id: "c-2", trackId: "t-1", startMs: 2000, durationMs: 3000, html: "<p>second</p>" },
          ],
        },
      ],
    });
    const html = serialize(comp);
    expect(html).toContain('data-clip-id="c-1"');
    expect(html).toContain('data-clip-id="c-2"');
    expect(html).toContain("first");
    expect(html).toContain("second");
  });
});
