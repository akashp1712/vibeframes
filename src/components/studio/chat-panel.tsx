"use client";

import type { ChatMessage as CustomChatMessage, AgentStatus } from "@/harness/use-harness-chat";
import { Film, Send, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { EphemeralStatus } from "./ephemeral-status";
import { useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BorderBeam } from "@/components/ui/border-beam";
import { DotPattern } from "@/components/ui/dot-pattern";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { ChatMessage } from "./chat-message";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "Vercel AI Gateway intro, 6s, black background",
  "Lower-third for \"Powered by Mastra\"",
  "3-clip product showcase with bold heading + subtitle",
];

interface ChatPanelProps {
  messages: CustomChatMessage[];
  input: string;
  isLoading: boolean;
  status?: AgentStatus;
  activeToolName?: string | null;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSelectPrompt?: (text: string) => void;
}

export function ChatPanel({
  messages,
  input,
  isLoading,
  status = "idle",
  activeToolName,
  onInputChange,
  onSubmit,
  onSelectPrompt,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Always submit via the form's native channel, regardless of how the user
  // triggered it (Send button click, Enter key, suggested-prompt button).
  // This avoids depending on base-ui Button forwarding `type="submit"`
  // through useButton (which injects `type='button'` by default) and gives a
  // single, testable entry point for both keyboard and mouse paths.
  const requestSubmit = () => formRef.current?.requestSubmit();

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading || !input.trim()) return;
    onSubmit(e);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // IME composition guard — Enter during Japanese/Chinese/Korean input
    // selection must not submit.
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    requestSubmit();
  };

  return (
    <div className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-border bg-background lg:w-96">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-4">
        <MessageSquare className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Chat</span>
      </div>

      <ScrollArea ref={scrollRef} className="min-h-0 flex-1">
        <div className="p-4">
          {messages.length === 0 ? (
            <ChatEmptyState onSelectPrompt={onSelectPrompt} />
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <EphemeralStatus status={status} activeToolName={activeToolName} />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="relative shrink-0 border-t border-border bg-background p-3">
        <form ref={formRef} onSubmit={handleFormSubmit} className="relative">
          <Textarea
            value={input}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe your video…"
            rows={1}
            className="min-h-11 resize-none pr-11"
            aria-label="Chat message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 top-1.5 size-8"
            aria-label={isLoading ? "Sending" : "Send message"}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
        {isLoading && (
          <BorderBeam
            size={80}
            duration={3}
            colorFrom="oklch(0.5 0.005 240)"
            colorTo="oklch(0.85 0.002 240)"
            borderWidth={2}
          />
        )}
      </div>
    </div>
  );
}

function ChatEmptyState({ onSelectPrompt }: { onSelectPrompt?: (text: string) => void }) {
  return (
    <div className="relative flex flex-col items-center gap-4 overflow-hidden pt-10 pb-4 text-center">
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(ellipse_at_top,white,transparent_60%)]",
          "text-foreground/15",
        )}
      />
      <div className="relative flex size-12 items-center justify-center rounded-xl bg-primary/10">
        <Film className="size-5 text-primary" />
        <BorderBeam
          size={40}
          duration={6}
          colorFrom="oklch(0.65 0.18 220)"
          colorTo="oklch(0.55 0.15 280)"
          borderWidth={1.5}
        />
      </div>
      <div className="relative flex flex-col items-center gap-1">
        <AnimatedShinyText className="text-sm font-semibold">
          Welcome to the Studio
        </AnimatedShinyText>
        <p className="text-xs text-muted-foreground">Describe a video to get started.</p>
      </div>
      {onSelectPrompt && (
        <div className="relative mt-2 flex w-full flex-col gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Try
          </span>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSelectPrompt(prompt)}
              className="group relative overflow-hidden rounded-lg border border-border bg-card/50 px-3 py-2 text-left text-xs text-foreground/80 transition hover:border-primary/40 hover:bg-card hover:text-foreground"
            >
              <Sparkles className="mr-1.5 inline size-3 text-primary/70 transition group-hover:text-primary" />
              {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
