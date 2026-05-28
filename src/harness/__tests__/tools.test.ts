import { describe, it, expect } from "vitest";
import { addClipTool, updateClipTool, removeClipTool } from "../tools";

describe("addClipTool", () => {
  it("has description and parameters", () => {
    expect(addClipTool.description).toBeTruthy();
    expect(addClipTool.parameters).toBeDefined();
  });

  it("validates correct input", () => {
    const result = addClipTool.parameters.safeParse({
      trackId: "track-1",
      startMs: 0,
      durationMs: 3000,
      html: "<div>clip</div>",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = addClipTool.parameters.safeParse({ trackId: "track-1" });
    expect(result.success).toBe(false);
  });
});

describe("updateClipTool", () => {
  it("validates partial update", () => {
    const result = updateClipTool.parameters.safeParse({
      clipId: "clip-1",
      html: "<div>updated</div>",
    });
    expect(result.success).toBe(true);
  });

  it("requires clipId", () => {
    const result = updateClipTool.parameters.safeParse({
      html: "<div>no id</div>",
    });
    expect(result.success).toBe(false);
  });
});

describe("removeClipTool", () => {
  it("validates correct input", () => {
    const result = removeClipTool.parameters.safeParse({ clipId: "clip-1" });
    expect(result.success).toBe(true);
  });

  it("rejects empty input", () => {
    const result = removeClipTool.parameters.safeParse({});
    expect(result.success).toBe(false);
  });
});
