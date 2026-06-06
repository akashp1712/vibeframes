import { useState, useCallback } from "react";

export interface ToolCall {
  id: string;
  name: string;
  state: "calling" | "result" | "error";
  args?: Record<string, unknown>;
  result?: unknown;
  durationMs?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: ToolCall[];
}

export type AgentStatus = "idle" | "thinking" | "calling-tool" | "streaming" | "done" | "error";

export function useHarnessChat(projectId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [activeToolName, setActiveToolName] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const updateAssistant = useCallback(
    (id: string, mut: (m: ChatMessage) => ChatMessage) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? mut(m) : m)));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: input.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);
      setError(null);
      setStatus("thinking");
      setActiveToolName(null);

      const assistantMsgId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "", tools: [] }]);

      // Track tool call start times so we can compute durations.
      const toolStarts = new Map<string, number>();

      try {
        const res = await fetch(`/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [...messages, userMsg], data: { projectId } }),
        });

        if (!res.ok || !res.body) throw new Error(`Chat failed: ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() ?? "";

          for (const block of blocks) {
            if (!block.trim() || block.includes("event: heartbeat")) continue;
            const dataMatch = block.match(/^data: (.*)$/m);
            if (!dataMatch) continue;

            let envelope: { type: string; payload: Record<string, unknown> };
            try {
              envelope = JSON.parse(dataMatch[1]);
            } catch {
              continue;
            }

            const { type, payload } = envelope;

            switch (type) {
              case "run.start":
                setStatus("thinking");
                break;

              case "agent_start":
              case "message_start":
                setStatus("thinking");
                break;

              case "text_delta": {
                const delta = (payload.textDelta as string) ?? (payload.delta as string) ?? "";
                if (delta) {
                  setStatus("streaming");
                  updateAssistant(assistantMsgId, (m) => ({ ...m, content: m.content + delta }));
                }
                break;
              }

              case "message_update":
              case "message_end": {
                const msg = payload.message as { content?: unknown } | undefined;
                const parts = Array.isArray(msg?.content) ? (msg!.content as Array<{ type: string; text?: string }>) : [];
                const text = parts
                  .filter((p) => p.type === "text" && p.text)
                  .map((p) => p.text)
                  .join("");
                if (text) {
                  updateAssistant(assistantMsgId, (m) => ({ ...m, content: text }));
                }
                break;
              }

              case "tool_start": {
                const toolCallId = payload.toolCallId as string;
                const toolName = payload.toolName as string;
                const args = (payload.args as Record<string, unknown>) ?? {};
                toolStarts.set(toolCallId, Date.now());
                setStatus("calling-tool");
                setActiveToolName(toolName);
                updateAssistant(assistantMsgId, (m) => ({
                  ...m,
                  tools: [
                    ...(m.tools ?? []),
                    { id: toolCallId, name: toolName, state: "calling", args },
                  ],
                }));
                break;
              }

              case "tool_end": {
                const toolCallId = payload.toolCallId as string;
                const result = payload.result;
                const isError = payload.isError === true;
                const started = toolStarts.get(toolCallId);
                const durationMs = started ? Date.now() - started : undefined;
                updateAssistant(assistantMsgId, (m) => ({
                  ...m,
                  tools: (m.tools ?? []).map((t) =>
                    t.id === toolCallId
                      ? { ...t, state: isError ? "error" : "result", result, durationMs }
                      : t
                  ),
                }));
                setActiveToolName(null);
                setStatus("thinking");
                break;
              }

              // LLD-08 progressive render: surface every subagent tool
              // call as a synthetic tool entry on the assistant message
              // so useComposition can react in real time. Without this
              // the studio preview would only update after the entire
              // pipeline completes — Compose's per-beat create-beat
              // results carry compositionHtml that we want to stream.
              case "subagent_tool_start": {
                const subId = `${payload.toolCallId}::${payload.subToolName}::${payload.startedAt ?? Date.now()}` as string;
                const subToolName = payload.subToolName as string;
                const subToolArgs = (payload.subToolArgs as Record<string, unknown>) ?? {};
                toolStarts.set(subId, Date.now());
                setActiveToolName(`${payload.agentType}/${subToolName}`);
                updateAssistant(assistantMsgId, (m) => ({
                  ...m,
                  tools: [
                    ...(m.tools ?? []),
                    { id: subId, name: subToolName, state: "calling", args: subToolArgs },
                  ],
                }));
                break;
              }

              case "subagent_tool_end": {
                const baseId = `${payload.toolCallId}::${payload.subToolName}` as string;
                const subToolResult = payload.subToolResult;
                const isErr = payload.isError === true;
                updateAssistant(assistantMsgId, (m) => ({
                  ...m,
                  tools: (m.tools ?? []).map((t) =>
                    typeof t.id === "string" && t.id.startsWith(baseId)
                      ? { ...t, state: isErr ? "error" : "result", result: subToolResult }
                      : t
                  ),
                }));
                break;
              }

              case "run.complete":
                setStatus("done");
                break;

              case "run.error":
              case "error":
                setStatus("error");
                setError(new Error((payload.message as string) || "Run failed"));
                break;
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, projectId, updateAssistant]
  );

  return {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
    activeToolName,
    error,
  };
}
