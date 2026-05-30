import type { SVGProps } from "react";
import { Clapperboard, Sparkles, Workflow } from "lucide-react";

/**
 * Brand logos for the "Built with" wall.
 *
 * Strategy:
 *   1. Real simple-icons brand marks — re-exported from
 *      `@icons-pack/react-simple-icons` for the eight tools that have
 *      official entries (Next.js, React, TypeScript, Tailwind, shadcn/ui,
 *      Vercel, Vitest, Zod).
 *   2. OpenAI's six-petal mark — inlined here because OpenAI was removed
 *      from simple-icons for brand-license reasons. The path is the
 *      canonical public-domain mark used on openai.com.
 *   3. MagicUI / Mastra / HyperFrames — these brands have no simple-icons
 *      entries, so we use thematic Lucide icons (Sparkles, Workflow,
 *      Clapperboard) as honest stand-ins rather than invented marks.
 *
 * All wrappers expose the same `SVGProps<SVGSVGElement>` surface so the
 * grid in `tech-stack.tsx` can size and colour them uniformly.
 */

type LogoProps = SVGProps<SVGSVGElement>;

// ─── Real brand marks (re-exported as named components) ──────────────────
export {
  SiNextdotjs as NextjsLogo,
  SiReact as ReactLogo,
  SiTypescript as TypeScriptLogo,
  SiTailwindcss as TailwindLogo,
  SiShadcnui as ShadcnLogo,
  SiVercel as VercelLogo,
  SiVitest as VitestLogo,
  SiZod as ZodLogo,
} from "@icons-pack/react-simple-icons";

// ─── Lucide stand-ins for brands without simple-icons entries ────────────
export function MagicUiLogo(props: LogoProps) {
  return <Sparkles {...props} />;
}

export function MastraLogo(props: LogoProps) {
  return <Workflow {...props} />;
}

export function HyperFramesLogo(props: LogoProps) {
  return <Clapperboard {...props} />;
}

// ─── OpenAI mark ─────────────────────────────────────────────────────────
// Inlined because OpenAI was removed from simple-icons for brand-license
// reasons. This is the canonical six-petal mark.
export function OpenAiLogo(props: LogoProps) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.985 5.985 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.057 6.057 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.057 6.057 0 0 0-.747-7.073Zm-9.022 12.642c-.892 0-1.756-.31-2.443-.882l.119-.069 4.04-2.333a.658.658 0 0 0 .331-.576v-5.69l1.71.988c.018.011.029.027.032.046v4.715a3.79 3.79 0 0 1-3.789 3.81Zm-8.14-3.477a3.78 3.78 0 0 1-.451-2.541l.121.071 4.041 2.331a.66.66 0 0 0 .664 0l4.935-2.847v1.974a.058.058 0 0 1-.023.05L9.314 20.42a3.79 3.79 0 0 1-5.196-1.389Zm-1.066-8.844a3.78 3.78 0 0 1 1.972-1.661v4.797a.65.65 0 0 0 .332.574l4.91 2.834-1.71.988a.063.063 0 0 1-.058 0l-4.084-2.358a3.79 3.79 0 0 1-1.39-5.179Zm14.025 3.262-4.935-2.864 1.71-.985a.063.063 0 0 1 .058 0l4.085 2.36a3.79 3.79 0 0 1-.578 6.838v-4.797a.638.638 0 0 0-.34-.569Zm1.701-2.558-.121-.073-4.034-2.355a.66.66 0 0 0-.664 0L9.025 10.27V8.299a.053.053 0 0 1 .023-.046l4.083-2.355a3.788 3.788 0 0 1 5.612 3.928zM8.094 13.366l-1.71-.986a.06.06 0 0 1-.029-.05V7.617a3.79 3.79 0 0 1 6.207-2.911l-.119.068-4.04 2.333a.658.658 0 0 0-.332.575zm.926-2 2.196-1.27 2.205 1.268v2.535l-2.193 1.268-2.205-1.268z" />
    </svg>
  );
}
