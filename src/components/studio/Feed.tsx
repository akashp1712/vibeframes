import type { ChatMessage, ToolCall, AgentStatus } from "@/harness/react/use-harness-chat";

/** The agent activity rail: user messages, meaningful tool events, replies. */
export function Feed({ messages, status }: { messages: ChatMessage[]; status: AgentStatus }) {
  // Show a "thinking" line only while reasoning (not mid tool-call or done).
  const thinking = status === "thinking";

  return (
    <div className="studio-feed">
      {messages.map((m) =>
        m.role === "user" ? (
          <div key={m.id} className="studio-msg-user">
            {m.content}
          </div>
        ) : (
          <AgentTurn key={m.id} message={m} />
        ),
      )}
      {thinking && (
        <div className="studio-thinking">
          <span className="studio-thinking-dots">
            <span /><span /><span />
          </span>
          Thinking through the scenes…
        </div>
      )}
    </div>
  );
}

function AgentTurn({ message }: { message: ChatMessage }) {
  return (
    <>
      {(message.tools ?? []).map((t) => (
        <div key={t.id} className="studio-tool" data-state={t.state}>
          <span className="studio-tool-icon">{icon(t)}</span>
          <span className="studio-tool-text">{describe(t)}</span>
          {t.durationMs != null && t.state === "result" && (
            <span className="studio-tool-time">{(t.durationMs / 1000).toFixed(1)}s</span>
          )}
        </div>
      ))}
      {message.content && <div className="studio-msg-agent">{message.content}</div>}
    </>
  );
}

function icon(t: ToolCall): string {
  if (t.state === "error") return "!";
  if (t.state === "result") return "✓";
  return "◇";
}

/**
 * Turn a raw tool call into a human sentence. "add-clip {block:StatReveal}"
 * becomes "Added a stat — 40x". This is what makes the rail feel alive
 * instead of dumping API names at the user.
 */
function describe(t: ToolCall): string {
  const verb = t.state === "calling" ? "Adding" : "Added";
  if (t.name !== "add-clip") {
    return t.state === "calling" ? "Reviewing the composition…" : "Reviewed the composition";
  }
  const props = (t.args?.props ?? {}) as Record<string, unknown>;
  const block = t.args?.block as string | undefined;

  switch (block) {
    case "KineticTitle": {
      const words = Array.isArray(props.words) ? props.words.join(" ") : "";
      return `${verb} a title${words ? ` — “${words}”` : ""}`;
    }
    case "BulletReveal": {
      const n = Array.isArray(props.bullets) ? props.bullets.length : 0;
      return `${verb} ${n} key point${n === 1 ? "" : "s"}`;
    }
    case "StatReveal": {
      const stat = props.value != null ? `${props.value}${props.suffix ?? ""}` : "a stat";
      return `${verb} a stat — ${stat}`;
    }
    case "LogoOutro":
      return `${verb} the outro${props.title ? ` — ${props.title}` : ""}`;
    default:
      return `${verb} a scene`;
  }
}
