import type { ChatMessage as CustomChatMessage, ToolCall } from "@/harness/use-harness-chat";
import { cn } from "@/lib/utils";
import { toolNoun, toolVerb } from "@/lib/tool-labels";
import { Check, X, Loader2 } from "lucide-react";

interface ChatMessageProps {
  message: CustomChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasTools = !!message.tools?.length;

  return (
    <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
        {isUser ? "You" : "Agent"}
      </span>
      {message.content && (
        <div
          className={cn(
            "max-w-[92%] border px-4 py-2.5 text-[13px] leading-relaxed shadow-sm",
            isUser
              ? "rounded-xl rounded-tr-none border-border bg-secondary text-foreground"
              : "rounded-xl rounded-tl-none border-border bg-card text-foreground",
          )}
        >
          {message.content}
        </div>
      )}
      {hasTools && <ActivityStream tools={message.tools!} />}
    </div>
  );
}

function ActivityStream({ tools }: { tools: ToolCall[] }) {
  return (
    <div className="mt-2 flex w-full flex-col pl-1">
      {tools.map((tool, i) => (
        <ActivityItem key={tool.id} tool={tool} isLast={i === tools.length - 1} />
      ))}
    </div>
  );
}

function ActivityItem({ tool, isLast }: { tool: ToolCall; isLast: boolean }) {
  const isActive = tool.state === "calling";
  const isError = tool.state === "error";
  const verb = toolVerb(tool.name);
  const noun = toolNoun(tool.name);

  return (
    <div className="flex">
      {/* Rail: single status badge + connecting line below */}
      <div className="flex w-7 shrink-0 flex-col items-center">
        <StatusBadge isActive={isActive} isError={isError} />
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>

      {/* Body */}
      <div className={cn("flex-1 pr-1", isLast ? "pb-0" : "pb-4")}>
        <div className="flex flex-col gap-0.5 pt-0.5">
          <span
            className={cn(
              "text-[12px] font-medium",
              isActive
                ? "text-foreground/90"
                : isError
                  ? "text-destructive"
                  : "text-foreground",
            )}
          >
            {isActive ? (
              <span className="relative inline-flex overflow-hidden">
                <span className="bg-gradient-to-r from-foreground/40 via-foreground to-foreground/40 bg-[length:200%_100%] bg-clip-text text-transparent [animation:shimmer_2.4s_linear_infinite]">
                  {verb}
                </span>
              </span>
            ) : (
              noun
            )}
          </span>
          {!isActive && (
            <div className="font-mono text-[10px] text-muted-foreground">
              <ToolResultSummary toolName={tool.name} result={tool.result} />
              {typeof tool.durationMs === "number" && (
                <span className="ml-1 text-muted-foreground/60">· {tool.durationMs}ms</span>
              )}
              {isError && <span className="text-destructive">failed</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ isActive, isError }: { isActive: boolean; isError: boolean }) {
  if (isActive) {
    return (
      <div className="z-10 flex size-5 items-center justify-center rounded-full bg-primary/15 outline outline-2 outline-background">
        <Loader2 className="size-3 animate-spin text-primary" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="z-10 flex size-5 items-center justify-center rounded-full bg-destructive outline outline-2 outline-background">
        <X className="size-3 text-destructive-foreground" />
      </div>
    );
  }
  return (
    <div className="z-10 flex size-5 items-center justify-center rounded-full bg-emerald-500 outline outline-2 outline-background">
      <Check className="size-3 text-white" strokeWidth={3} />
    </div>
  );
}

function ToolResultSummary({ toolName, result }: { toolName: string; result: unknown }) {
  const r = result as Record<string, unknown>;

  if (toolName === "add-clip" && r.clipId) {
    return (
      <span className="text-[11px] text-muted-foreground">
        Added clip <code className="text-[10px]">{String(r.clipId)}</code> · {String(r.clipCount)}{" "}
        total
      </span>
    );
  }

  if (toolName === "remove-clip" && r.removedClipId) {
    return (
      <span className="text-[11px] text-muted-foreground">
        Removed <code className="text-[10px]">{String(r.removedClipId)}</code> ·{" "}
        {String(r.clipCount)} remaining
      </span>
    );
  }

  if (toolName === "update-clip" && r.clipId) {
    return (
      <span className="text-[11px] text-muted-foreground">
        Updated <code className="text-[10px]">{String(r.clipId)}</code>
      </span>
    );
  }

  if (toolName === "get-composition") {
    return (
      <span className="text-[11px] text-muted-foreground">
        {String(r.trackCount)} tracks · {String(r.clipCount)} clips
      </span>
    );
  }

  if (toolName === "get-block-schemas" && Array.isArray(result)) {
    return (
      <span className="text-[11px] text-muted-foreground">
        Fetched {result.length} block templates
      </span>
    );
  }

  return null;
}
