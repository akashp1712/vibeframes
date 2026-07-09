import { useMemo, useState } from "react";
import type { ChatMessage } from "./use-harness-chat";
import type { Composition } from "@/harness/composition/schema";

const EMPTY: Composition = { fps: 30, width: 1920, height: 1080, clips: [] };

/**
 * Derive the latest composition from the SSE tool results. Every add-clip /
 * get-composition tool_end payload carries the full `composition`.
 *
 * Crucially, we return a *stable reference* that only changes when the
 * composition's content changes — otherwise <Player> receives fresh
 * `inputProps` on every SSE tick and resets playback (the "auto-pause" bug).
 */
export function useComposition(messages: ChatMessage[]): Composition {
  const latest = useMemo(() => {
    let currentLatest: Composition = EMPTY;
    for (const m of messages) {
      for (const t of m.tools ?? []) {
        const result = t.result as { composition?: Composition } | undefined;
        if (result?.composition) currentLatest = result.composition;
      }
    }
    return currentLatest;
  }, [messages]);

  const [state, setState] = useState<{ sig: string; value: Composition }>({
    sig: JSON.stringify(EMPTY),
    value: EMPTY,
  });

  const sig = JSON.stringify(latest);
  if (sig !== state.sig) {
    setState({ sig, value: latest });
    return latest;
  }

  return state.value;
}

export function totalFrames(composition: Composition): number {
  return composition.clips.reduce((max, c) => Math.max(max, c.from + c.durationInFrames), 0);
}
