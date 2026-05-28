import { Play } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";

export function PreviewPanel() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-10 items-center gap-2 border-b border-border px-4">
        <Play className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Preview</span>
      </div>
      <div className="flex flex-1 items-center justify-center bg-background">
        <PreviewEmptyState />
      </div>
    </div>
  );
}

function PreviewEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative flex size-14 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
        <Play className="size-5 text-muted-foreground" />
        <BorderBeam
          size={50}
          duration={8}
          colorFrom="oklch(0.55 0.22 264)"
          colorTo="oklch(0.65 0.18 300)"
          borderWidth={1}
        />
      </div>
      <p className="text-sm font-medium text-foreground">HyperFrames preview will render here.</p>
      <p className="text-xs text-muted-foreground/60">
        Start a conversation to compose your first clip.
      </p>
    </div>
  );
}
