"use client";

import { useEffect, useRef, useState, startTransition } from "react";
import type { AgentStatus } from "@/harness/react/use-harness-chat";
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
      startTransition(() => setThinkingIdx(0));
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
      const id = setTimeout(() => setVisible(null), 0);
      return () => clearTimeout(id);
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
    <div className="mt-1 w-full pl-3">
      <div className="flex flex-col border-l-2 border-stone-200 py-1">
        <div className="relative flex items-center gap-2 py-1.5 pl-5 pr-2 min-h-8 bg-[#fff8f3] rounded-r-md">
          <span className="absolute left-[-5px] top-1/2 -translate-y-1/2 flex size-[10px] items-center justify-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-orange-700" />
          </span>
          <span
            key={phrase}
            className={cn(
              "text-sm font-semibold text-slate-900",
              "animate-in fade-in-0 slide-in-from-bottom-0.5 duration-300",
            )}
          >
            {phrase}
            <DotsTrail />
          </span>
        </div>
      </div>
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
