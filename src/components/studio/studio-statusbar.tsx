"use client";

import { Circle, Cpu, Film, Loader2, Sparkles, Wrench, Zap } from "lucide-react";
import type { AgentStatus } from "@/harness/use-harness-chat";
import { cn } from "@/lib/utils";

interface StudioStatusbarProps {
  projectId: string;
  status: AgentStatus;
  activeToolName?: string | null;
  clipCount: number;
  trackCount: number;
}

export function StudioStatusbar({
  projectId,
  status,
  activeToolName,
  clipCount,
  trackCount,
}: StudioStatusbarProps) {
  return (
    <footer className="flex h-9 shrink-0 items-center justify-between gap-4 border-t border-border bg-card/60 px-4 text-[11px] text-muted-foreground backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <StatusBadge status={status} activeToolName={activeToolName} />
        <Divider />
        <span className="flex items-center gap-1.5">
          <Film className="size-3.5" />
          <code className="text-foreground/70">{projectId}</code>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden items-center gap-1.5 md:flex">
          <Cpu className="size-3.5" />
          gpt-4o-mini
        </span>
        <Divider className="hidden md:block" />
        <span className="tabular-nums">
          {trackCount} {trackCount === 1 ? "track" : "tracks"} · {clipCount}{" "}
          {clipCount === 1 ? "clip" : "clips"}
        </span>
        <Divider />
        <span className="flex items-center gap-1.5">
          <Zap className="size-3.5" />
          VibeFrames
          <span className="text-foreground/40">v0.1</span>
        </span>
      </div>
    </footer>
  );
}

function StatusBadge({
  status,
  activeToolName,
}: {
  status: AgentStatus;
  activeToolName?: string | null;
}) {
  if (status === "calling-tool") {
    return (
      <span className="flex items-center gap-1.5 text-foreground">
        <Wrench className="size-3.5 animate-pulse text-primary" />
        Calling <code className="text-foreground">{activeToolName ?? "tool"}</code>
      </span>
    );
  }

  if (status === "streaming") {
    return (
      <span className="flex items-center gap-1.5 text-foreground">
        <Sparkles className="size-3.5 animate-pulse text-primary" />
        Generating
      </span>
    );
  }

  if (status === "thinking") {
    return (
      <span className="flex items-center gap-1.5 text-foreground">
        <Loader2 className="size-3.5 animate-spin text-primary" />
        Thinking
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-destructive">
        <Circle className="size-2.5 fill-current" />
        Error
      </span>
    );
  }

  if (status === "done") {
    return (
      <span className="flex items-center gap-1.5">
        <Circle className="size-2.5 fill-emerald-500 text-emerald-500" />
        Ready
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <Circle className={cn("size-2.5 fill-muted-foreground/40 text-muted-foreground/40")} />
      Idle
    </span>
  );
}

function Divider({ className }: { className?: string }) {
  return <span className={cn("text-foreground/20", className)}>|</span>;
}
