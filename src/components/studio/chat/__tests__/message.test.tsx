import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChatMessage } from "../message";
import type { ChatMessage as CustomChatMessage, ToolCall } from "@/harness/react/use-harness-chat";

const userMessage: CustomChatMessage = {
  id: "msg-1",
  role: "user",
  content: "Make a 5-second intro",
};

const assistantMessage: CustomChatMessage = {
  id: "msg-2",
  role: "assistant",
  content: "I will create a title card with a fade-in.",
};

describe("ChatMessage", () => {
  it("renders user message content", () => {
    const { container } = render(<ChatMessage message={userMessage} />);
    expect(container.textContent).toContain("Make a 5-second intro");
  });

  it("does not render 'You' or 'Agent' labels anymore", () => {
    const { container: c1 } = render(<ChatMessage message={userMessage} />);
    expect(c1.textContent).not.toContain("You");

    const { container: c2 } = render(<ChatMessage message={assistantMessage} />);
    expect(c2.textContent).not.toContain("Agent");
  });

  describe("markdown rendering in assistant messages", () => {
    it("renders **bold** as <strong>", () => {
      const { container } = render(
        <ChatMessage
          message={{ id: "m", role: "assistant", content: "Use **caution** here." }}
        />,
      );
      const strong = container.querySelector("strong");
      expect(strong).not.toBeNull();
      expect(strong?.textContent).toBe("caution");
    });

    it("renders inline `code` as <code>", () => {
      const { container } = render(
        <ChatMessage
          message={{ id: "m", role: "assistant", content: "Call `add-clip` next." }}
        />,
      );
      const code = container.querySelector("code");
      expect(code).not.toBeNull();
      expect(code?.textContent).toBe("add-clip");
    });

    it("renders fenced code blocks as <pre><code>", () => {
      const { container } = render(
        <ChatMessage
          message={{
            id: "m",
            role: "assistant",
            content: "```\nadd-clip { trackId: 'track-0' }\n```",
          }}
        />,
      );
      const pre = container.querySelector("pre");
      expect(pre).not.toBeNull();
      expect(pre?.querySelector("code")).not.toBeNull();
    });

    it("renders unordered lists as <ul><li>", () => {
      const { container } = render(
        <ChatMessage
          message={{
            id: "m",
            role: "assistant",
            content: "- hook 1.2s\n- hold 4s\n- resolve 2.8s",
          }}
        />,
      );
      const ul = container.querySelector("ul");
      expect(ul).not.toBeNull();
      expect(ul?.querySelectorAll("li")).toHaveLength(3);
    });

    it("renders headings as <h2>/<h3>", () => {
      const { container } = render(
        <ChatMessage
          message={{
            id: "m",
            role: "assistant",
            content: "## Storyboard\n\n### Beat 1",
          }}
        />,
      );
      expect(container.querySelector("h2")?.textContent).toBe("Storyboard");
      expect(container.querySelector("h3")?.textContent).toBe("Beat 1");
    });

    it("renders GFM tables", () => {
      const { container } = render(
        <ChatMessage
          message={{
            id: "m",
            role: "assistant",
            content: "| beat | duration |\n|---|---|\n| hook | 1.2s |",
          }}
        />,
      );
      expect(container.querySelector("table")).not.toBeNull();
      expect(container.querySelector("th")?.textContent).toBe("beat");
    });

    it("does NOT parse user messages as markdown (preserves literal text)", () => {
      const { container } = render(
        <ChatMessage
          message={{ id: "u", role: "user", content: "use **bold** for the headline" }}
        />,
      );
      // User input stays literal — no <strong> rendered
      expect(container.querySelector("strong")).toBeNull();
      expect(container.textContent).toContain("**bold**");
    });
  });

  // ─── tool activity stream ─────────────────────────────────────────────────
  describe("tool activity stream", () => {
    const doneTools: ToolCall[] = [
      { id: "t1", name: "get-composition", state: "result", result: { trackCount: 0, clipCount: 0 } },
      { id: "t2", name: "get-block-schemas", state: "result", result: [{ id: "block-1" }] },
      { id: "t3", name: "add-clip", state: "result", result: { clipId: "c1", clipCount: 1 } },
    ];

    const inFlight: ToolCall[] = [
      ...doneTools,
      { id: "t4", name: "add-clip", state: "calling" },
    ];

    it("renders tool stream BEFORE assistant content (tools execute first, summary last)", () => {
      const { container } = render(
        <ChatMessage
          message={{
            id: "a",
            role: "assistant",
            content: "Here is your composition.",
            tools: doneTools,
          }}
        />,
      );
      const items = container.querySelectorAll('[data-testid="activity-item"]');
      const content = container.querySelector('[data-testid="assistant-content"]');
      expect(items.length).toBe(3);
      expect(content, "content bubble must exist").not.toBeNull();
      // First item is rendered before content
      expect(
        items[0]!.compareDocumentPosition(content!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("does NOT collapse tools, always flat stream", () => {
      const { container } = render(
        <ChatMessage
          message={{
            id: "a",
            role: "assistant",
            content: "All done.",
            tools: doneTools,
          }}
        />,
      );
      expect(container.querySelectorAll('[data-testid="activity-item"]')).toHaveLength(3);
    });

    it("renders the active state for in-flight tools", () => {
      const { container } = render(
        <ChatMessage
          message={{
            id: "a",
            role: "assistant",
            content: "Working on it…",
            tools: inFlight,
          }}
        />,
      );
      expect(container.querySelectorAll('[data-testid="activity-item"]').length).toBe(4);
    });

    it("renders if there is no assistant content yet (tools-only state)", () => {
      const { container } = render(
        <ChatMessage
          message={{
            id: "a",
            role: "assistant",
            content: "",
            tools: doneTools,
          }}
        />,
      );
      expect(container.querySelectorAll('[data-testid="activity-item"]').length).toBe(3);
    });
  });
});
