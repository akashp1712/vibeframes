import { z } from "zod";
import { TraceSchema, SAMPLE_TRACE } from "./trace";

export const FrameSchema = z.enum(["landscape", "portrait", "square"]);
export const StyleSchema = z.enum(["studio", "mint", "signal"]);
export const BlockSchema = z.enum(["statement", "product", "spotlight", "comparison", "stack", "endcard", "trace", "evidence"]);
export const BriefSchema = z.object({
  product: z.string().trim().min(1).max(32),
  feature: z.string().trim().min(3).max(64),
  audience: z.string().trim().min(3).max(100),
  before: z.string().trim().min(3).max(64),
  after: z.string().trim().min(3).max(64),
  details: z.string().trim().max(1600),
  cta: z.string().trim().min(2).max(40),
  url: z.string().trim().max(100),
});
export const SceneSchema = z.object({
  id: z.string().min(1).max(40),
  block: BlockSchema,
  eyebrow: z.string().max(40),
  headline: z.string().min(1).max(64),
  body: z.string().max(120),
  duration: z.number().int().min(60).max(180),
});
export const StorySchema = z.object({
  hooks: z.array(z.string().min(3).max(64)).length(3),
  scenes: z.array(SceneSchema).length(6),
});
// Local raster assets only. Never fetch model-provided media URLs while rendering.
export const ImageSchema = z.string().max(2800000).refine(v => /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v), "Use a PNG, JPEG, or WebP screenshot");
export const FilmSchema = z.object({
  version: z.literal(1), trace: TraceSchema, reviewed: z.boolean(), brief: BriefSchema, story: StorySchema,
  frame: FrameSchema, style: StyleSchema,
  images: z.array(ImageSchema).max(3), hook: z.number().int().min(0).max(2),
});
export type Brief = z.infer<typeof BriefSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Film = z.infer<typeof FilmSchema>;
export type Story = z.infer<typeof StorySchema>;
export const DIMENSIONS = { landscape: { width: 1920, height: 1080 }, portrait: { width: 1080, height: 1920 }, square: { width: 1080, height: 1080 } } as const;
export const BLOCKS = {
  trace: { name: "Action trail", purpose: "Animate the recorded steps, including failures" },
  evidence: { name: "Outcome receipt", purpose: "Show the source-reported outcome and its reference" },
  statement: { name: "Type in motion", purpose: "Open on the customer problem" },
  product: { name: "Product stage", purpose: "Reveal the actual product" },
  spotlight: { name: "Focus lens", purpose: "Give one detail the spotlight" },
  comparison: { name: "The switch", purpose: "Make the before and after clear" },
  stack: { name: "Feature rhythm", purpose: "Build a sequence of benefits" },
  endcard: { name: "Signature", purpose: "Land the brand and next action" },
} as const;
export const THEMES = {
  studio: { name: "Studio", bg: "#eeeae2", ink: "#1c2420", accent: "#d4ed78", panel: "#faf9f5", muted: "#666e65" },
  mint: { name: "Botanical", bg: "#dceae1", ink: "#183b32", accent: "#f1b995", panel: "#f4f8f1", muted: "#537568" },
  signal: { name: "After hours", bg: "#172625", ink: "#f5f1e9", accent: "#edaa7d", panel: "#253a36", muted: "#b4c5bc" },
} as const;
export function timeline(story: Story) {
  let from = 0;
  return story.scenes.map(scene => { const clip = { ...scene, from }; from += scene.duration; return clip; });
}
export function filmDuration(film: Film) { return film.story.scenes.reduce((n, s) => n + s.duration, 0); }
export function makeStory(b: Brief): Story {
  return { hooks: [b.before, b.after, b.feature], scenes: [
    { id: "hook", block: "statement", eyebrow: "A better way to work", headline: b.before, body: `For ${b.audience.toLowerCase()}`, duration: 75 },
    { id: "reveal", block: "trace", eyebrow: `New in ${b.product}`, headline: b.feature, body: b.after, duration: 120 },
    { id: "focus", block: "evidence", eyebrow: "Closer to the detail", headline: b.after, body: b.details.slice(0, 120), duration: 105 },
    { id: "switch", block: "comparison", eyebrow: "Small change. Different day.", headline: "See the difference.", body: "", duration: 105 },
    { id: "rhythm", block: "stack", eyebrow: "Built for your workflow", headline: b.feature, body: b.after, duration: 75 },
    { id: "close", block: "endcard", eyebrow: "Now available", headline: b.product, body: b.cta, duration: 90 },
  ] };
}
export const DEMO_BRIEF: Brief = {
  product: "Folio", feature: "The work behind the answer.", audience: "Finance teams reviewing invoice matches",
  before: "An invoice. Five careful steps.", after: "A match, with a human in the loop.",
  details: "Follow an invoice through lookup, comparison, human review, and a recorded outcome. No payment is initiated.",
  cta: "See what your automation does", url: "folio.example",
};
export const DEMO_FILM: Film = { version: 1, trace: SAMPLE_TRACE, reviewed: false, brief: DEMO_BRIEF, story: makeStory(DEMO_BRIEF), frame: "landscape", style: "studio", images: [], hook: 0 };
