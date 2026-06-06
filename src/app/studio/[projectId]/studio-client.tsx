"use client";

import { useHarnessChat } from "@/harness/react/use-harness-chat";
import { useEffect } from "react";
import { toast } from "sonner";
import { StudioTopbar } from "@/components/studio/studio-topbar";
import { StudioStatusbar } from "@/components/studio/studio-statusbar";
import { ChatPanel } from "@/components/studio/chat-panel";
import { PreviewPanel } from "@/components/studio/preview-panel";
import { CodePanel } from "@/components/studio/code-panel";
import { useComposition } from "@/harness/react/use-composition";

/**
 * Client-side Studio shell. Receives `projectId` as a plain prop from the
 * server page (`/studio/[projectId]/page.tsx`) so we never have to deal with
 * `useParams()` returning `null` during hydration on Next 16.
 */
export function StudioClient({ projectId, model }: { projectId: string; model: string }) {
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
    activeToolName,
    error,
  } = useHarnessChat(projectId);

  const composition = useComposition(messages);

  useEffect(() => {
    if (error) toast.error(error.message || "Something went wrong");
  }, [error]);

  return (
    <div className="flex h-dvh flex-col">
      <StudioTopbar clipCount={composition.clipCount} trackCount={composition.trackCount} />
      <div className="flex flex-1 overflow-hidden">
        <ChatPanel
          messages={messages}
          input={input}
          isLoading={isLoading}
          status={status}
          activeToolName={activeToolName}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onSelectPrompt={setInput}
        />
        <PreviewPanel
          html={composition.html}
          clips={composition.clips}
          totalDuration={composition.totalDuration}
          isLoading={isLoading}
        />
        <CodePanel html={composition.html} />
      </div>
      <StudioStatusbar
        projectId={projectId}
        model={model}
        status={status}
        activeToolName={activeToolName}
        clipCount={composition.clipCount}
        trackCount={composition.trackCount}
      />
    </div>
  );
}
