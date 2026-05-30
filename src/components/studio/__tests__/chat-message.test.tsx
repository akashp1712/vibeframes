import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ChatMessage } from "../chat-message";
import type { ChatMessage as CustomChatMessage } from "@/harness/use-harness-chat";

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
});
