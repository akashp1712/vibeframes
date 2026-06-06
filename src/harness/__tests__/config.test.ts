import { describe, it, expect } from "vitest";
import { HARNESS_CONFIG } from "../config";

describe("HARNESS_CONFIG", () => {
  it("has a default model", () => {
    expect(HARNESS_CONFIG.defaultModel).toBeDefined();
    expect(typeof HARNESS_CONFIG.defaultModel).toBe("string");
  });

  it("has default resolution", () => {
    expect(HARNESS_CONFIG.defaultResolution).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it("has default fps of 30", () => {
    expect(HARNESS_CONFIG.defaultFps).toBe(30);
  });
});
