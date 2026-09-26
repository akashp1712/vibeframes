import { describe, expect, it } from "vitest";
import { ClipSchema } from "./schema";

const blockProps = [
  ["LowerThird", { title: "Jane Doe", label: "Founder" }],
  ["WipeReveal", { heading: "Now shipping", label: "Launch" }],
  ["ProgressTrack", { heading: "Rendering", value: 75, label: "Video" }],
] as const;

describe("motion scene registry", () => {
  it.each(blockProps)("accepts %s compositions", (block, props) => {
    const clip = ClipSchema.parse({ id: "scene", block, from: 0, durationInFrames: 90, props });
    expect(clip.block).toBe(block);
    expect(clip.props).toEqual(props);
  });
  it("rejects an unregistered block", () => {
    expect(() => ClipSchema.parse({ id: "scene", block: "Unknown", from: 0, durationInFrames: 90 })).toThrow();
  });
});
