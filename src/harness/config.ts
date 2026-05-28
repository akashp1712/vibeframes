export const HARNESS_CONFIG = {
  defaultModel: process.env.VIBEFRAMES_MODEL || "gpt-4o-mini",
  maxDuration: 60,
  defaultResolution: { width: 1920, height: 1080 },
  defaultFps: 30,
  modes: {
    plan: {
      description: "Reason about composition structure before building",
      reasoningEffort: "high" as const,
    },
    vibe: {
      description: "Build composition iteratively from user prompts",
      reasoningEffort: "medium" as const,
    },
  },
} as const;
