"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { StudioTopbar } from "@/components/studio/studio-topbar";
import { ChatPanel } from "@/components/studio/chat-panel";
import { PreviewPanel } from "@/components/studio/preview-panel";
import { CodePanel } from "@/components/studio/code-panel";

export default function StudioPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
  });

  useEffect(() => {
    if (error) toast.error(error.message || "Something went wrong");
  }, [error]);

  return (
    <div className="flex h-dvh flex-col">
      <StudioTopbar />
      <div className="flex flex-1 overflow-hidden">
        <ChatPanel
          messages={messages}
          input={input}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
        />
        <PreviewPanel />
        <CodePanel />
      </div>
    </div>
  );
}
