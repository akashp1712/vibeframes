import { getVibeFramesHarness } from "@/harness";
import { createSSEStream } from "@/protocol/sse-writer";
import { randomUUID } from "crypto";

export const maxDuration = 60;

// Events that are pure noise for the UI — skip them to keep payload lean.
const FILTERED_EVENT_TYPES = new Set([
  "display_state_changed",
  "tool_input_delta",
  "tool_input_start",
  "tool_input_end",
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
