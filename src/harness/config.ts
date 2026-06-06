export const HARNESS_CONFIG = {
  // Default upgraded from gpt-4o-mini → gpt-4o. Mini ships flat,
  // placeholder-heavy compositions (it reuses the same 2–3 blocks and emits
  // copy like "Product One"). gpt-4o picks expressive blocks from the
  // registry, varies palettes, and follows the director prompt more
  // faithfully. Override with VIBEFRAMES_MODEL=… in env if needed.
  defaultModel: process.env.VIBEFRAMES_MODEL || "gpt-4o",
  maxDuration: 60,
  defaultResolution: { width: 1920, height: 1080 },
  defaultFps: 30,
} as const;
