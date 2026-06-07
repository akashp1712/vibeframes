import type { ChatMessage as CustomChatMessage, ToolCall } from "@/harness/react/use-harness-chat";
import { cn } from "@/lib/utils";
import { toolNoun, toolVerb } from "@/lib/tool-labels";
import { Markdown } from "./markdown";

interface ChatMessageProps {
  message: CustomChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasTools = !!message.tools?.length;
  const hasContent = !!message.content;

  if (isUser) {
    return (
      <div className="w-full rounded-xl border border-border bg-card px-4 py-3 shadow-sm mb-2">
        <div className="text-[14px] font-medium leading-relaxed text-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {/* Tool activity stream renders BEFORE assistant content */}
      {hasTools && (
        <ActivityStream tools={message.tools!} />
      )}
      {hasContent && (
        <div
          data-testid="assistant-content"
          className="mt-2 text-[13px] leading-relaxed text-muted-foreground pl-4"
        >
          <Markdown>{message.content}</Markdown>
        </div>
      )}
    </div>
  );
}

function ActivityStream({
  tools,
}: {
  tools: ToolCall[];
}) {
  return (
    <div className="mt-1 w-full pl-3">
      <div className="flex flex-col border-l-2 border-stone-200 py-1">
        {tools.map((tool) => (
          <ActivityItem key={tool.id} tool={tool} />
        ))}
      </div>
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
      className={cn(
        "relative flex items-center gap-2 py-1.5 pl-5 pr-2 min-h-8",
        isActive && "bg-[#fff8f3] rounded-r-md"
      )}
    >
      <StatusDot isActive={isActive} isError={isError} />
      <span
        className={cn(
          isActive
            ? "text-sm font-semibold text-foreground"
            : isError
              ? "text-xs text-destructive"
              : "text-xs text-muted-foreground"
        )}
      >
        {isActive ? (
          <span className="bg-gradient-to-r from-orange-700 via-orange-500 to-orange-700 bg-[length:200%_100%] bg-clip-text text-transparent [animation:shimmer_2.4s_linear_infinite]">
            {verb}
          </span>
        ) : (
          noun
        )}
      </span>
      {!isActive && typeof tool.durationMs === "number" && (
        <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
          {tool.durationMs}ms
        </span>
      )}
    </div>
  );
}

function StatusDot({ isActive, isError }: { isActive: boolean; isError: boolean }) {
  if (isActive) {
    return (
      <span className="absolute left-[-5px] top-1/2 -translate-y-1/2 flex size-[10px] items-center justify-center">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-400 opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-orange-700" />
      </span>
    );
  }
  if (isError) {
    return (
      <span className="absolute left-[-5px] top-1/2 -translate-y-1/2 flex size-[10px] items-center justify-center">
        <span className="relative inline-flex size-1.5 rounded-full bg-destructive" />
      </span>
    );
  }
  return (
    <span className="absolute left-[-5px] top-1/2 -translate-y-1/2 flex size-[10px] items-center justify-center">
      <span className="relative inline-flex size-1.5 rounded-full bg-[#65a986]" />
    </span>
  );
}
