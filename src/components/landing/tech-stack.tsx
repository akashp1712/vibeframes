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

const categoryColors: Record<string, string> = {
  framework: "bg-primary/10 text-primary hover:bg-primary/15",
  styling: "bg-chart-2/10 text-chart-2 hover:bg-chart-2/15",
  ai: "bg-chart-3/10 text-chart-3 hover:bg-chart-3/15",
  engine: "bg-chart-4/10 text-chart-4 hover:bg-chart-4/15",
  quality: "bg-success/10 text-success hover:bg-success/15",
};

export function TechStack() {
  return (
    <section className="w-full px-4 pb-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Built with</h2>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">Modern, composable, open-source.</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {stack.map((item) => (
            <Badge
              key={item.label}
              variant="secondary"
              className={`cursor-default border-0 px-3 py-1 text-xs font-medium transition-colors ${categoryColors[item.category]}`}
            >
              {item.label}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
