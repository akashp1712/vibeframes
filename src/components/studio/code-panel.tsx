import { Code2 } from "lucide-react";

export function CodePanel() {
  return (
    <div className="hidden w-80 shrink-0 flex-col border-l border-border lg:flex xl:w-96">
      <div className="flex h-10 items-center gap-2 border-b border-border px-4">
        <Code2 className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Composition HTML
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center bg-background">
        <p className="text-xs text-muted-foreground/60">
          HTML source will appear here.
        </p>
      </div>
    </div>
  );
}
