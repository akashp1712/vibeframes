import type { ComponentType, SVGProps } from "react";
import {
  HyperFramesLogo,
  MagicUiLogo,
  MastraLogo,
  NextjsLogo,
  OpenAiLogo,
  ReactLogo,
  ShadcnLogo,
  TailwindLogo,
  TypeScriptLogo,
  VercelLogo,
  VitestLogo,
  ZodLogo,
} from "./tech-logos";

/**
 * "Built with" — a calm monochrome wall of real brand logos.
 *
 * Inspired by shadcnblocks/logos17: muted stone tone at rest, full opacity
 * + slight lift on hover. All logos inherit `currentColor` from the wrapper
 * so the colour treatment is uniform across the row.
 */

interface StackItem {
  label: string;
  Logo: ComponentType<SVGProps<SVGSVGElement>>;
}

const stack: StackItem[] = [
  { label: "Next.js 16",     Logo: NextjsLogo },
  { label: "React 19",       Logo: ReactLogo },
  { label: "TypeScript 5",   Logo: TypeScriptLogo },
  { label: "Tailwind v4",    Logo: TailwindLogo },
  { label: "shadcn/ui",      Logo: ShadcnLogo },
  { label: "MagicUI",        Logo: MagicUiLogo },
  { label: "AI SDK v4",      Logo: VercelLogo },
  { label: "Mastra Harness", Logo: MastraLogo },
  { label: "OpenAI o4-mini", Logo: OpenAiLogo },
  { label: "HyperFrames",    Logo: HyperFramesLogo },
  { label: "Zod",            Logo: ZodLogo },
  { label: "Vitest",         Logo: VitestLogo },
];

export function TechStack() {
  return (
    <section className="w-full px-4 pb-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl font-sans text-stone-900">
          Built with
        </h2>
        <p className="mt-2 mb-10 text-sm text-muted-foreground font-sans">
          Modern, composable, open-source.
        </p>
        <ul
          className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-6"
          aria-label="Tools and libraries used to build VibeFrames"
        >
          {stack.map(({ label, Logo }) => (
            <li
              key={label}
              className="group flex flex-col items-center gap-2 select-none"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl border border-stone-200/70 bg-white/70 text-stone-500 shadow-3xs transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-stone-300 group-hover:bg-white group-hover:text-stone-900 group-hover:shadow-md">
                <Logo className="size-6" />
              </span>
              <span className="font-mono text-[10px] font-medium text-stone-500 transition-colors duration-300 group-hover:text-stone-900">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
