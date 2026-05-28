import { MessageSquareText, Brain, Wand2, MonitorPlay } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";

const steps = [
  {
    step: "01",
    icon: MessageSquareText,
    title: "Describe",
    description: "Tell the agent what you want in plain language.",
  },
  {
    step: "02",
    icon: Brain,
    title: "Reason",
    description: "The Mastra Harness plans the composition strategy.",
  },
  {
    step: "03",
    icon: Wand2,
    title: "Compose",
    description: "Typed tools mutate the HyperFrames composition tree.",
  },
  {
    step: "04",
    icon: MonitorPlay,
    title: "Preview",
    description: "Watch your video render in real time via SSE streaming.",
  },
];

export function HowItWorks() {
  return (
    <section className="w-full px-4 pb-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
          <p className="mt-2 text-sm text-muted-foreground">Four steps from idea to video.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, i) => (
            <Card
              key={item.step}
              className="group relative overflow-hidden text-center transition-all hover:shadow-md"
            >
              <CardContent className="flex flex-col items-center gap-3 pt-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40">
                  Step {item.step}
                </span>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <item.icon className="size-5" />
                </div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
              </CardContent>
              <BorderBeam
                size={80}
                duration={10}
                delay={i * 2.5}
                colorFrom="oklch(0.55 0.22 264)"
                colorTo="oklch(0.65 0.18 300)"
                borderWidth={1}
              />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
