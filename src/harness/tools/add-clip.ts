import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { getComposition, setComposition } from "../composition/store";
import { addClip } from "../composition/mutations";

/**
 * The ONE tool the agent uses to build a video: append a clip to the
 * timeline. The agent calls it once per scene. The Zod schema IS the
 * agent's instruction manual — every field is documented for the model.
 */
export function createAddClipTool() {
  return createTool({
    id: "add-clip",
    description:
      "Append one clip (a scene) to the video timeline. Call once per scene, " +
      "in order. Frames are at 30fps (so 90 frames = 3 seconds). Each clip's " +
      "`from` should equal the previous clip's from + durationInFrames so scenes " +
      "play back-to-back.",
    inputSchema: z.object({
      block: z
        .enum(["KineticTitle", "BulletReveal", "StatReveal", "BarChart", "CodeReveal", "FlowDiagram", "SplitCompare", "BigQuote", "DeviceMockup", "AudioPulse", "LogoOutro"])
        .describe(
          "Scene type. KineticTitle = bold opener; words fly in one by one. " +
            "BulletReveal = a heading + 2–4 bullets as numbered cards. " +
            "StatReveal = one big number that counts up, with a label. " +
            "BarChart = animated bars for comparing 2–5 values (bars spring up). " +
            "CodeReveal = a code card that types itself out (for technical content). " +
            "FlowDiagram = 2–5 labelled nodes connected by drawing lines with a flowing pulse (pipelines / how-it-works / steps). " +
            "SplitCompare = two panels slide in for a before/after or 'us vs them' comparison. " +
            "BigQuote = a large pull-quote with an author (testimonials / punchy closer). " +
            "DeviceMockup = a browser window floating up showing a product screen (for app/product videos). " +
            "AudioPulse = a title over an equalizer that pulses to a music bed — use ONCE, as an energetic opener or closer. " +
            "LogoOutro = closing brand/CTA with a shine sweep.",
        ),
      from: z.number().int().min(0).describe("Start frame. First clip is 0."),
      durationInFrames: z
        .number()
        .int()
        .min(15)
        .describe("Length in frames at 30fps. Typical scene = 60–120."),
      props: z
        .object({
          eyebrow: z.string().optional().describe("KineticTitle: small label above the words."),
          words: z
            .array(z.string())
            .optional()
            .describe("KineticTitle: 2–4 words that animate in one at a time, e.g. ['Ship','faster']."),
          heading: z.string().optional().describe("BulletReveal: heading above the bullets."),
          bullets: z
            .array(z.string())
            .optional()
            .describe("BulletReveal: 2–4 short bullet strings (≤5 words each)."),
          value: z.number().optional().describe("StatReveal: the number to count up to, e.g. 99."),
          suffix: z.string().optional().describe("StatReveal: unit after the number, e.g. '%', 'x', 'ms'."),
          label: z.string().optional().describe("StatReveal/BarChart/BulletReveal: heading or caption."),
          bars: z
            .array(z.object({ label: z.string(), value: z.number() }))
            .optional()
            .describe("BarChart: 2–5 { label, value } pairs to compare, e.g. [{label:'Us',value:40},{label:'Them',value:12}]."),
          filename: z.string().optional().describe("CodeReveal: the file name shown in the window chrome."),
          lines: z
            .array(z.string())
            .optional()
            .describe("CodeReveal: lines of code to type out (keep short, ≤6 lines)."),
          nodes: z
            .array(z.string())
            .optional()
            .describe("FlowDiagram: 2–5 short node labels in flow order, e.g. ['Prompt','Agent','Render']."),
          leftLabel: z.string().optional().describe("SplitCompare: left panel label, e.g. 'Before'."),
          leftValue: z.string().optional().describe("SplitCompare: left panel big value, e.g. '2 days'."),
          rightLabel: z.string().optional().describe("SplitCompare: right panel label, e.g. 'After'."),
          rightValue: z.string().optional().describe("SplitCompare: right panel big value (the winner), e.g. '2 min'."),
          quote: z.string().optional().describe("BigQuote: the quote text (one punchy sentence)."),
          author: z.string().optional().describe("BigQuote: who said it."),
          url: z.string().optional().describe("DeviceMockup: the browser URL bar text, e.g. 'nova.dev'."),
          screenTitle: z.string().optional().describe("DeviceMockup: big headline shown on the product screen."),
          screenSub: z.string().optional().describe("DeviceMockup: subtitle under the screen headline."),
          title: z.string().optional().describe("LogoOutro: the brand or product name."),
          tagline: z.string().optional().describe("LogoOutro: short line under the title / CTA."),
        })
        .describe("Props for the chosen block. Only fill the ones that block uses."),
    }),
    execute: async (args, context) => {
      const projectId = context?.requestContext?.get("projectId") as string | undefined;
      if (!projectId) throw new Error("Missing projectId in request context");

      const comp = getComposition(projectId);
      const next = addClip(comp, {
        block: args.block,
        from: args.from,
        durationInFrames: args.durationInFrames,
        props: args.props,
      });
      setComposition(projectId, next);
      return {
        ok: true,
        clipCount: next.clips.length,
        composition: next, // the UI reads this off the SSE tool_end payload
      };
    },
  });
}
