"use client";

import { useHarnessChat } from "@/harness/use-harness-chat";
import { useEffect } from "react";
import { toast } from "sonner";
import { StudioTopbar } from "@/components/studio/studio-topbar";
import { StudioStatusbar } from "@/components/studio/studio-statusbar";
import { ChatPanel } from "@/components/studio/chat-panel";
import { PreviewPanel } from "@/components/studio/preview-panel";
import { CodePanel } from "@/components/studio/code-panel";
import { useComposition } from "@/harness/use-composition";

const PROJECT_ID = "default";

export default function StudioPage() {
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
  } = useHarnessChat(PROJECT_ID);

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
        />
        <CodePanel html={composition.html} />
      </div>
      <StudioStatusbar
        projectId={PROJECT_ID}
        status={status}
        activeToolName={activeToolName}
        clipCount={composition.clipCount}
        trackCount={composition.trackCount}
      />
    </div>
  );
}
