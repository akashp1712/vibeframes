import { Badge } from "@/components/ui/badge";

const stack = [
  { label: "Next.js 16", category: "framework" },
  { label: "React 19", category: "framework" },
  { label: "TypeScript 5", category: "framework" },
  { label: "Tailwind v4", category: "styling" },
  { label: "shadcn/ui", category: "styling" },
  { label: "MagicUI", category: "styling" },
  { label: "AI SDK v4", category: "ai" },
  { label: "Mastra Harness", category: "ai" },
  { label: "OpenAI o4-mini", category: "ai" },
  { label: "HyperFrames", category: "engine" },
  { label: "Zod", category: "engine" },
  { label: "Vitest", category: "quality" },
];

const categoryStyles: Record<string, string> = {
  framework: "border-sky-200/60 bg-sky-50/20 text-sky-800 hover:bg-sky-100/30 dark:border-sky-950/50 dark:bg-sky-950/10 dark:text-sky-300",
  styling: "border-amber-200/60 bg-amber-50/20 text-amber-800 hover:bg-amber-100/30 dark:border-amber-950/50 dark:bg-amber-950/10 dark:text-amber-300",
  ai: "border-indigo-200/50 bg-indigo-50/15 text-indigo-800 hover:bg-indigo-100/25 dark:border-indigo-950/50 dark:bg-indigo-950/10 dark:text-indigo-300",
  engine: "border-teal-200/60 bg-teal-50/20 text-teal-850 text-teal-800 hover:bg-teal-100/30 dark:border-teal-950/50 dark:bg-teal-950/10 dark:text-teal-300",
  quality: "border-emerald-200/60 bg-emerald-50/20 text-emerald-800 hover:bg-emerald-100/30 dark:border-emerald-950/50 dark:bg-emerald-950/10 dark:text-emerald-300",
};

export function TechStack() {
  return (
    <section className="w-full px-4 pb-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl font-sans text-stone-900 dark:text-stone-100 font-sans">Built with</h2>
        <p className="mt-2 mb-8 text-sm text-muted-foreground font-sans">Modern, composable, open-source.</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {stack.map((item) => (
            <Badge
              key={item.label}
              variant="secondary"
              className={`cursor-default border px-3 py-1.5 font-mono text-[10px] font-medium transition-colors ${categoryStyles[item.category]}`}
            >
              {item.label}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
