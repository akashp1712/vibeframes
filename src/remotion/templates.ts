/**
 * Starter templates — a few distinct, ready-made prompts the Director can
 * turn into a video in one click. Each is a different *shape* of video so
 * they showcase the block palette, not just reword the same thing.
 */
export interface Template {
  id: string;
  label: string;
  blurb: string;
  prompt: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "product-launch",
    label: "Product launch",
    blurb: "Bold title → benefits → CTA",
    prompt:
      "A bold 12s launch teaser for Nova, an AI notetaker. Open with a punchy title, three benefits, and a call-to-action to try it free.",
  },
  {
    id: "metric-brag",
    label: "Metric reveal",
    blurb: "One number, big",
    prompt:
      "A 10s teaser for Bolt DB that lands one huge stat — queries run 40x faster — with a title before and a logo outro after.",
  },
  {
    id: "explainer",
    label: "Explainer",
    blurb: "Concept in 3 scenes",
    prompt:
      "Explain what an AI agent is in 3 short scenes: a title, three defining traits as bullets, and a closing line.",
  },
  {
    id: "changelog",
    label: "Changelog",
    blurb: "What shipped this week",
    prompt:
      "A crisp 10s 'what shipped this week' update for a dev tool: a title, four changelog bullets, and a sign-off.",
  },
];
