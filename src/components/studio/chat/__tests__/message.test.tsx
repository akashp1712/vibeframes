import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
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

  it("labels user messages as 'You'", () => {
    const { container } = render(<ChatMessage message={userMessage} />);
    expect(container.textContent).toContain("You");
  });

  it("labels assistant messages as 'Agent'", () => {
    const { container } = render(<ChatMessage message={assistantMessage} />);
    expect(container.textContent).toContain("Agent");
  });

  it("renders assistant message content", () => {
    const { container } = render(<ChatMessage message={assistantMessage} />);
    expect(container.textContent).toContain("I will create a title card with a fade-in.");
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
      // Activity header sits ABOVE the assistant content bubble.
      const header = container.querySelector('[data-testid="activity-header"]');
      const content = container.querySelector('[data-testid="assistant-content"]');
      expect(header, "activity header must exist").not.toBeNull();
      expect(content, "content bubble must exist").not.toBeNull();
      expect(
        header!.compareDocumentPosition(content!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("collapses tools into a summary once the assistant has produced content", () => {
      const { container, getByRole } = render(
        <ChatMessage
          message={{
            id: "a",
            role: "assistant",
            content: "All done.",
            tools: doneTools,
          }}
        />,
      );
      // Collapsed: header visible, no item rows rendered
      expect(container.querySelector('[data-testid="activity-header"]')).not.toBeNull();
      expect(container.querySelectorAll('[data-testid="activity-item"]')).toHaveLength(0);
      // Click the header toggle → items appear
      fireEvent.click(getByRole("button", { name: /show.*action|activity/i }));
      expect(container.querySelectorAll('[data-testid="activity-item"]')).toHaveLength(3);
    });

    it("expanded view places the toggle in the HEADER (top), not at the bottom", () => {
      const { container, getByRole } = render(
        <ChatMessage
          message={{
            id: "a",
            role: "assistant",
            content: "All done.",
            tools: doneTools,
          }}
        />,
      );
      // Expand
      fireEvent.click(getByRole("button", { name: /show.*action|activity/i }));
      // Header (with toggle) must appear BEFORE the first item in the DOM
      const header = container.querySelector('[data-testid="activity-header"]');
      const firstItem = container.querySelector('[data-testid="activity-item"]');
      expect(header).not.toBeNull();
      expect(firstItem).not.toBeNull();
      expect(
        header!.compareDocumentPosition(firstItem!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      // And no separate "Collapse" button hanging at the bottom of the list
      expect(container.querySelector('[data-testid="bottom-collapse"]')).toBeNull();
    });

    it("does NOT render the heavy timeline rail (no connector lines)", () => {
      const { container, getByRole } = render(
        <ChatMessage
          message={{
            id: "a",
            role: "assistant",
            content: "All done.",
            tools: doneTools,
          }}
        />,
      );
      fireEvent.click(getByRole("button", { name: /show.*action|activity/i }));
      // The previous design used [data-testid="activity-rail"] for the
      // connector between status badges. The redesigned stream is flat.
      expect(container.querySelector('[data-testid="activity-rail"]')).toBeNull();
    });

    it("does NOT collapse while a tool is still calling", () => {
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
      // Even with content present, an in-flight tool keeps items visible
      expect(container.querySelectorAll('[data-testid="activity-item"]').length).toBeGreaterThan(0);
    });

    it("does NOT collapse if there is no assistant content yet (tools-only state)", () => {
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
