"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useHarnessChat } from "@/harness/react/use-harness-chat";
import { useComposition, totalFrames } from "@/harness/react/use-composition";
import { useExport } from "@/harness/react/use-export";
import { Topbar } from "@/components/studio/Topbar";
import { Stage } from "@/components/studio/Stage";
import { Timeline } from "@/components/studio/Timeline";
import { Feed } from "@/components/studio/Feed";
import { Composer } from "@/components/studio/Composer";
import { PalettePicker } from "@/components/studio/PalettePicker";
import { DEFAULT_PALETTE, type Palette } from "@/remotion/palettes";

/**
 * The Director's Console. A dark, cinematic two-pane workspace:
 * a framed stage + timeline on the left, the live agent rail + composer
 * on the right. Everything is driven by the SSE stream.
 */
export function StudioClient({ projectId }: { projectId: string }) {
  const { messages, input, setInput, submit, isLoading, status, error } =
    useHarnessChat(projectId);
  const composition = useComposition(messages);
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE);
  const { run: runExport, exporting } = useExport(projectId);
  const busy = isLoading;

  useEffect(() => {
    if (error) toast.error(error.message || "Something went wrong");
  }, [error]);

  const handleExport = async () => {
    try {
      const url = await toast.promise(runExport(palette.id), {
        loading: "Rendering your video…",
        success: "Video ready — downloading.",
        error: (e) => (e instanceof Error ? e.message : "Render failed"),
      }).unwrap();
      if (url) window.open(url, "_blank");
    } catch {
      /* toast already surfaced it */
    }
  };

  return (
    <>
      <div className="studio-atmosphere" />
      <div className="studio-grain" />

      <div className="studio-shell">
        <Topbar
          status={status}
          canExport={composition.clips.length > 0 && !busy}
          exporting={exporting}
          onExport={handleExport}
        />

        <aside className="studio-rail">
          <div className="studio-rail-head">Director</div>
          <Feed messages={messages} status={status} />
          {composition.clips.length > 0 && (
            <div className="studio-palette-bar">
              <span className="studio-palette-label">Palette</span>
              <PalettePicker value={palette} onChange={setPalette} />
            </div>
          )}
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={submit}
            busy={busy}
            showSuggestions={messages.length === 0}
          />
        </aside>

        <main className="studio-stage">
          <Stage
            composition={composition}
            frames={totalFrames(composition)}
            busy={busy}
            palette={palette}
          />
          <Timeline composition={composition} />
        </main>
      </div>
    </>
  );
}
