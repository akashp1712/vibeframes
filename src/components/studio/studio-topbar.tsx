import Link from "next/link";
import { Film, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";

interface StudioTopbarProps {
  projectName?: string;
}

export function StudioTopbar({ projectName = "Untitled Project" }: StudioTopbarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-xs" nativeButton={false} render={<Link href="/" />}>
          <ArrowLeft />
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <Film className="size-4 text-primary" />
          <span className="text-sm font-semibold">VibeFrames Studio</span>
        </div>
      </div>
      <AnimatedShinyText className="text-xs">
        {projectName}
      </AnimatedShinyText>
    </header>
  );
}
