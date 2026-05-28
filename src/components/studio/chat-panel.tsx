"use client";

import { type UIMessage } from "ai";
import { Film, Send, Loader2, MessageSquare } from "lucide-react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BorderBeam } from "@/components/ui/border-beam";
import { ChatMessage } from "./chat-message";

interface ChatPanelProps {
  messages: UIMessage[];
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatPanel({ messages, input, isLoading, onInputChange, onSubmit }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex w-80 shrink-0 flex-col border-r border-border bg-background lg:w-96">
      <div className="flex h-10 items-center gap-2 border-b border-border px-4">
        <MessageSquare className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Chat</span>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="p-4">
          {messages.length === 0 ? (
            <ChatEmptyState />
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Thinking…
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="relative">
        <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-border p-3">
          <Textarea
            value={input}
            onChange={onInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            placeholder="Describe your video…"
            rows={1}
            className="min-h-9 flex-1 resize-none"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
        {isLoading && (
          <BorderBeam
            size={80}
            duration={3}
            colorFrom="oklch(0.55 0.22 264)"
            colorTo="oklch(0.65 0.18 300)"
            borderWidth={2}
          />
        )}
      </div>
    </div>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 pt-12 text-center">
      <div className="relative flex size-12 items-center justify-center rounded-xl bg-primary/10">
        <Film className="size-5 text-primary" />
        <BorderBeam
          size={40}
          duration={6}
          colorFrom="oklch(0.55 0.22 264)"
          colorTo="oklch(0.65 0.18 300)"
          borderWidth={1}
        />
      </div>
      <p className="text-sm font-medium text-foreground">Welcome to the Studio</p>
      <p className="text-xs text-muted-foreground">Describe a video to get started.</p>
    </div>
  );
}
