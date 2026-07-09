import type { Composition } from "@/harness/composition/schema";

/** A tiny sample video for the landing-page showcase. */
export const SAMPLE_COMPOSITION: Composition = {
  fps: 30,
  width: 1920,
  height: 1080,
  clips: [
    {
      id: "s1",
      block: "KineticTitle",
      from: 0,
      durationInFrames: 90,
      props: { eyebrow: "VibeFrames", words: ["Compose", "by", "chat"] },
    },
    {
      id: "s2",
      block: "BulletReveal",
      from: 90,
      durationInFrames: 110,
      props: { heading: "How it works", bullets: ["You describe it", "The agent builds it", "Rendered to real video"] },
    },
    {
      id: "s3",
      block: "StatReveal",
      from: 200,
      durationInFrames: 80,
      props: { value: 100, suffix: "%", label: "rendered by code" },
    },
    {
      id: "s4",
      block: "LogoOutro",
      from: 280,
      durationInFrames: 80,
      props: { title: "VibeFrames", tagline: "built on Mastra + Remotion" },
    },
  ],
};

export const SAMPLE_FRAMES = 360;
