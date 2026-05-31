import type { VibeFramesEvent } from "./events";

export function createSSEStream() {
  let controller: ReadableStreamDefaultController;
  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  const writeEvent = (event: VibeFramesEvent) => {
    try {
      const json = JSON.stringify(event);
      controller.enqueue(new TextEncoder().encode(`id: ${event.seq}\n`));
      controller.enqueue(new TextEncoder().encode(`event: ${event.type}\n`));
      controller.enqueue(new TextEncoder().encode(`data: ${json}\n\n`));
    } catch {
      // Ignore if closed
    }
  };

  const writeHeartbeat = () => {
    try {
      controller.enqueue(new TextEncoder().encode(`event: heartbeat\ndata: {}\n\n`));
    } catch {}
  };

  const endStream = () => {
    try {
      controller.close();
    } catch {}
  };

  return { stream, writeEvent, writeHeartbeat, endStream };
}
