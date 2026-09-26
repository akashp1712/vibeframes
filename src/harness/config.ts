export const HARNESS_CONFIG = {
  // Keep OpenAI as the default. Opt in to Claude with VIBEFRAMES_MODEL=claude-opus-5-5.
  defaultModel: process.env.VIBEFRAMES_MODEL || "gpt-4o",
  maxDuration: 60,
  defaultResolution: { width: 1920, height: 1080 },
  defaultFps: 30,
} as const;
