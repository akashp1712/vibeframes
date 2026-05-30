"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { AgentStatus } from "@/harness/use-harness-chat";
import { toolVerb } from "@/lib/tool-labels";
import { cn } from "@/lib/utils";

interface EphemeralStatusProps {
  status: AgentStatus;
  activeToolName?: string | null;
}

/** Minimum time a phrase stays on screen before another may replace it. */
const MIN_HOLD_MS = 700;

/**
 * A Claude-style single-line status that replaces itself as the agent moves
 * through phases. While the agent is "thinking" we cycle through synonyms for
 * personality — disabled when an actual tool is firing.
 */
const THINKING_PHRASES = [
  "Thinking",
  "Planning the scene",
  "Sketching the layout",
  "Composing",
  "Choosing blocks",
];

export function EphemeralStatus({ status, activeToolName }: EphemeralStatusProps) {
  const [thinkingIdx, setThinkingIdx] = useState(0);
  const [visible, setVisible] = useState<{ status: AgentStatus; phrase: string } | null>(null);
  const lastChangeRef = useRef<number>(0);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rotate thinking synonyms every 2.4s, only while in thinking state.
  useEffect(() => {
    if (status !== "thinking") {
      setThinkingIdx(0);
      return;
    }
    const id = setInterval(() => {
      setThinkingIdx((i) => (i + 1) % THINKING_PHRASES.length);
    }, 2400);
    return () => clearInterval(id);
  }, [status]);

  // Debounce: a new phrase only swaps in if MIN_HOLD_MS has passed since the
  // last visible phrase. Terminal states (`done`, `idle`) clear immediately.
  useEffect(() => {
    if (status === "idle" || status === "done") {
      if (pendingRef.current) clearTimeout(pendingRef.current);
      setVisible(null);
      return;
    }
    const next = { status, phrase: pickPhrase(status, activeToolName, thinkingIdx) };
    if (visible && visible.phrase === next.phrase) return;

    const elapsed = Date.now() - lastChangeRef.current;
    const apply = () => {
      lastChangeRef.current = Date.now();
      setVisible(next);
    };

    if (pendingRef.current) clearTimeout(pendingRef.current);
    if (!visible || elapsed >= MIN_HOLD_MS) {
      apply();
    } else {
      pendingRef.current = setTimeout(apply, MIN_HOLD_MS - elapsed);
    }

    return () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
    };
  }, [status, activeToolName, thinkingIdx, visible]);

  if (!visible) return null;
  const phrase = visible.phrase;

  return (
    <div className="flex items-center gap-2 pl-1 pt-1">
      <Sparkles className="size-3 animate-pulse text-primary" />
      {/* key change forces a fade-in remount when phrase swaps */}
      <span
        key={phrase}
        className={cn(
          "text-[12px] italic text-muted-foreground",
          "animate-in fade-in-0 slide-in-from-bottom-0.5 duration-300",
        )}
      >
        {phrase}
        <DotsTrail />
      </span>
    </div>
  );
}

function pickPhrase(
  status: AgentStatus,
  activeToolName: string | null | undefined,
  thinkingIdx: number,
): string {
  if (status === "calling-tool" && activeToolName) return toolVerb(activeToolName);
  if (status === "streaming") return "Generating";
  if (status === "thinking") return THINKING_PHRASES[thinkingIdx];
  if (status === "error") return "Something went wrong";
  return "Working";
}

function DotsTrail() {
  return (
    <span className="ml-0.5 inline-flex gap-0.5 align-baseline">
      <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
      <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
      <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
    </span>
  );
}
