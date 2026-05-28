import { MessageSquare, Layers, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";

const features = [
  {
    icon: MessageSquare,
    title: "Chat-First Editing",
    description:
      "Describe your video in natural language. The agent plans, composes, and validates.",
    beamDelay: 0,
  },
  {
    icon: Layers,
    title: "HTML-Native Engine",
    description: "HyperFrames renders HTML into video. No proprietary timeline — just markup.",
    beamDelay: 2,
  },
  {
    icon: Sparkles,
    title: "Mastra Harness",
    description: "Typed state, modes, tools, skills, memory — a full agent runtime in one class.",
    beamDelay: 4,
  },
];

export function FeatureGrid() {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 pb-24 sm:grid-cols-3">
      {features.map((feature) => (
        <Card
          key={feature.title}
          className="group relative overflow-hidden transition-all hover:shadow-md"
        >
          <CardHeader>
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
              <feature.icon className="size-5" />
            </div>
            <CardTitle className="text-sm">{feature.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
          </CardContent>
          <BorderBeam
            size={120}
            duration={8}
            delay={feature.beamDelay}
            colorFrom="oklch(0.55 0.22 264)"
            colorTo="oklch(0.65 0.18 300)"
            borderWidth={1}
          />
        </Card>
      ))}
    </div>
  );
}
