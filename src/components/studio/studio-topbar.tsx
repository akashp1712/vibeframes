import Link from "next/link";
import { Film, ArrowLeft, CloudCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { NumberTicker } from "@/components/ui/number-ticker";

interface StudioTopbarProps {
  projectName?: string;
  clipCount?: number;
  trackCount?: number;
}

export function StudioTopbar({
  projectName = "Untitled Project",
  clipCount = 0,
  trackCount = 0,
}: StudioTopbarProps) {
  return (
    <header className="grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-card/80 px-4 backdrop-blur-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-xs" nativeButton={false} render={<Link href="/" />}>
          <ArrowLeft />
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <Film className="size-4 text-primary" />
          <span className="text-sm font-semibold">VibeFrames</span>
          <span className="text-xs text-muted-foreground">Studio</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <Badge variant="secondary" className="gap-1.5 font-mono text-[10px] tabular-nums">
          <NumberTicker value={trackCount} /> {trackCount === 1 ? "track" : "tracks"}
          <span className="text-muted-foreground/40">·</span>
          <NumberTicker value={clipCount} /> {clipCount === 1 ? "clip" : "clips"}
        </Badge>
      </div>

      {/* Center */}
      <AnimatedShinyText className="justify-self-center text-xs">{projectName}</AnimatedShinyText>

      {/* Right */}
      <div className="flex items-center justify-end gap-3">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
          <CloudCheck className="size-3.5 text-emerald-500" />
          Saved
        </span>
        <Button
          size="sm"
          className="h-7 gap-1.5 px-3 font-mono text-[11px] font-semibold uppercase tracking-wider"
          disabled={clipCount === 0}
        >
          <Download className="size-3.5" />
          Export
        </Button>
      </div>
    </header>
  );
}
