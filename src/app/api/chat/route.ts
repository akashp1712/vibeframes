import { getVibeFramesHarness } from "@/harness";
import { createSSEStream } from "@/protocol/sse-writer";
import { randomUUID } from "crypto";

export const maxDuration = 60;

// Events that are pure noise for the UI — skip them to keep payload lean.
// Per-token streaming events are particularly bad for our pipeline
// because subagents do all their thinking pre-tool-call: filtering them
// cuts ~95% of SSE volume on a typical pipeline run.
//
// What's left after filtering (~50-60 events for a full pipeline run):
//   tool_start / tool_end          — Director's subagent dispatches
//   subagent_start / subagent_end  — phase boundaries
//   subagent_tool_start / _end     — per-phase tool calls (the
//                                    composition.delta equivalents that
//                                    drive the UI's progressive render)
//   text_delta + message_*         — Director's final reply only
//   run.start / run.complete       — bookends
const FILTERED_EVENT_TYPES = new Set([
  "display_state_changed",
  "tool_input_delta",
  "tool_input_start",
  "tool_input_end",
  // Per-token streams from inside subagents. The post-tool one-line
  // confirmations land in `subagent_end.result` so we don't lose them.
  "subagent_text_delta",
  // Assistant message rebuilds — large payloads (full message JSON) on
  // every micro-update. The UI derives the same info from tool_end.
  "message_update",
  // Per-call token accounting — not user-visible.
  "usage_update",
  // Full state snapshots emitted on every setState (~1.5KB each, 6 per
  // pipeline run). The UI doesn't need them — it derives composition,
  // brief, storyboard, validationReport from the corresponding
  // subagent_tool_end payloads.
  "state_changed",
]);

export async function POST(req: Request) {
  const { messages, data } = await req.json();
  const projectId = (data?.projectId as string) || "default";

  const lastMessage = messages[messages.length - 1];
  const content = lastMessage?.content || "Hello";

  const harness = await getVibeFramesHarness(projectId);
  await harness.selectOrCreateThread();

  const { stream, writeEvent, writeHeartbeat, endStream } = createSSEStream();
  const runId = randomUUID();
  const seq = { value: 0 };
  const ts = () => Date.now();
  const emit = (type: string, payload: unknown) => {
    writeEvent({
      v: 1,
      runId,
      seq: ++seq.value,
      projectId,
      ts: ts(),
      type,
      payload,
    });
  };

  const hb = setInterval(writeHeartbeat, 5000);

  const unsubscribe = harness.subscribe((event: Record<string, unknown>) => {
    const type = event.type as string;
    if (FILTERED_EVENT_TYPES.has(type)) return;
    emit(type, event);
  });

  (async () => {
    try {
      emit("run.start", { status: "started", content });
      await harness.sendMessage({ content });
      emit("run.complete", { status: "completed" });
    } catch (err) {
      emit("run.error", { status: "error", message: String(err) });
    } finally {
      clearInterval(hb);
      unsubscribe();
      endStream();
    }
  })();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
