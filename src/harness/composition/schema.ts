import { z } from "zod";

/**
 * A clip = one Remotion block placed on the timeline.
 * `block` names a React component in src/remotion/blocks.
 * `props` are that block's props (title, bullets, cta, …).
 */
export const ClipSchema = z.object({
  id: z.string(),
  block: z.enum([
    "KineticTitle",
    "BulletReveal",
    "StatReveal",
    "BarChart",
    "CodeReveal",
    "FlowDiagram",
    "SplitCompare",
    "BigQuote",
    "DeviceMockup",
    "AudioPulse",
    "LogoOutro",
  ]),
  from: z.number().int().min(0), // start frame
  durationInFrames: z.number().int().min(1),
  props: z.record(z.any()).default({}),
});
export type Clip = z.infer<typeof ClipSchema>;

/**
 * The whole video, as data. This is the agent↔renderer contract:
 * the agent builds it up via the add-clip tool; Remotion renders it.
 */
export const CompositionSchema = z.object({
  fps: z.number().int().default(30),
  width: z.number().int().default(1920),
  height: z.number().int().default(1080),
  clips: z.array(ClipSchema).default([]),
});
export type Composition = z.infer<typeof CompositionSchema>;
