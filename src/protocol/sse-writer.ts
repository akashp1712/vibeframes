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
    } catch (e) {
      // Ignore if closed
    }
  };

  const writeHeartbeat = () => {
    try {
      controller.enqueue(new TextEncoder().encode(`event: heartbeat\ndata: {}\n\n`));
    } catch (e) {}
  };

  const endStream = () => {
    try {
      controller.close();
    } catch (e) {}
  };

  return { stream, writeEvent, writeHeartbeat, endStream };
}
