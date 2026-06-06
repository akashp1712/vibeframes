import type { ChatMessage as CustomChatMessage, ToolCall } from "@/harness/react/use-harness-chat";
import { cn } from "@/lib/utils";
import { toolNoun, toolVerb } from "@/lib/tool-labels";
import { Check, X, Loader2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Markdown } from "./markdown";

interface ChatMessageProps {
  message: CustomChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasTools = !!message.tools?.length;
  const hasContent = !!message.content;

  return (
    <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
        {isUser ? "You" : "Agent"}
      </span>
      {/* Tool activity stream renders BEFORE assistant content — the model
          runs tools first and then writes a summary, so the visual order
          should match the execution order. */}
      {hasTools && (
        <ActivityStream tools={message.tools!} hasContent={hasContent} />
      )}
      {hasContent && (
        <div
          data-testid={isUser ? "user-content" : "assistant-content"}
          className={cn(
            "max-w-[92%] border px-4 py-2.5 text-[13px] leading-relaxed shadow-sm",
            isUser
              ? "rounded-xl rounded-tr-none border-border bg-secondary text-foreground"
              : "rounded-xl rounded-tl-none border-border bg-card text-foreground",
          )}
        >
          {isUser ? message.content : <Markdown>{message.content}</Markdown>}
        </div>
      )}
    </div>
  );
}

function ActivityStream({
  tools,
  hasContent,
}: {
  tools: ToolCall[];
  hasContent: boolean;
}) {
  const anyActive = tools.some((t) => t.state === "calling");
  // Auto-collapse once all tools are settled AND the assistant has written
  // its summary. While work is in flight, keep the list open as a live trace.
  const canCollapse = !anyActive && hasContent;
  const [expanded, setExpanded] = useState(false);
  const showItems = !canCollapse || expanded;

  const total = tools.length;
  const totalMs = tools.reduce(
    (sum, t) => sum + (typeof t.durationMs === "number" ? t.durationMs : 0),
    0,
  );
  const errored = tools.filter((t) => t.state === "error").length;

  return (
    <div className="mt-2 w-full">
      {/* Unified header: status icon + count + toggle. The whole row is the
          collapse/expand button so the affordance is one click everywhere. */}
      <button
        type="button"
        data-testid="activity-header"
        onClick={canCollapse ? () => setExpanded((v) => !v) : undefined}
        disabled={!canCollapse}
        aria-label={
          canCollapse
            ? showItems
              ? `Hide ${total} actions`
              : `Show ${total} actions`
            : `${total} actions`
        }
        aria-expanded={showItems}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left",
          "text-[11px] text-muted-foreground/80",
          canCollapse && "hover:bg-muted/40 hover:text-muted-foreground",
        )}
      >
        {anyActive ? (
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
        ) : errored > 0 ? (
          <X className="size-3 text-destructive" />
        ) : (
          <Check className="size-3 text-emerald-500" />
        )}
        <span>
          {total} {total === 1 ? "action" : "actions"}
        </span>
        {totalMs > 0 && !anyActive && (
          <span className="text-muted-foreground/60">
            · {totalMs < 1000 ? `${totalMs}ms` : `${(totalMs / 1000).toFixed(1)}s`}
          </span>
        )}
        {errored > 0 && (
          <span className="text-destructive">· {errored} failed</span>
        )}
        {canCollapse && (
          <ChevronDown
            className={cn(
              "ml-auto size-3 text-muted-foreground/60 transition-transform",
              showItems ? "rotate-0" : "-rotate-90",
            )}
          />
        )}
      </button>

      {showItems && (
        <div className="mt-0.5 flex flex-col">
          {tools.map((tool) => (
            <ActivityItem key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ tool }: { tool: ToolCall }) {
  const isActive = tool.state === "calling";
  const isError = tool.state === "error";
  const verb = toolVerb(tool.name);
  const noun = toolNoun(tool.name);

  return (
    <div
      data-testid="activity-item"
      className="flex items-center gap-1.5 py-0.5 pl-4 pr-1"
    >
      <StatusDot isActive={isActive} isError={isError} />
      <span
        className={cn(
          "text-[11px]",
          isActive
            ? "text-muted-foreground"
            : isError
              ? "text-destructive"
              : "text-muted-foreground/90",
        )}
      >
        {isActive ? (
          <span className="bg-gradient-to-r from-muted-foreground/40 via-foreground/80 to-muted-foreground/40 bg-[length:200%_100%] bg-clip-text text-transparent [animation:shimmer_2.4s_linear_infinite]">
            {verb}
          </span>
        ) : (
          noun
        )}
      </span>
      {!isActive && (
        <ToolResultSummary toolName={tool.name} result={tool.result} />
      )}
      {!isActive && typeof tool.durationMs === "number" && (
        <span className="ml-auto font-mono text-[10px] text-muted-foreground/50">
          {tool.durationMs}ms
        </span>
      )}
    </div>
  );
}

function StatusDot({ isActive, isError }: { isActive: boolean; isError: boolean }) {
  if (isActive) return <Loader2 className="size-2.5 shrink-0 animate-spin text-muted-foreground" />;
  if (isError) return <X className="size-2.5 shrink-0 text-destructive" strokeWidth={3} />;
  return <Check className="size-2.5 shrink-0 text-emerald-500/80" strokeWidth={3} />;
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
