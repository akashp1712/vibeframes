import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ChatPanel } from "../chat-panel";

/**
 * Regression: user reported "can't hit Enter or click Send button".
 * These tests pin both paths.
 */
describe("ChatPanel — submit paths", () => {
  function setup(opts: { input?: string; isLoading?: boolean } = {}) {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const onInputChange = vi.fn();
    const utils = render(
      <ChatPanel
        messages={[]}
        input={opts.input ?? "make me an intro"}
        isLoading={opts.isLoading ?? false}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
      />,
    );
    return { ...utils, onSubmit, onInputChange };
  }

  it("clicking the Send button fires onSubmit", () => {
    const { container, onSubmit } = setup();
    const btn = container.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    expect(btn, "submit button must exist").not.toBeNull();
    expect(btn?.disabled, "button must be enabled when input has text").toBe(false);
    btn!.click();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("pressing Enter (no shift) in the textarea fires onSubmit", () => {
    const { container, onSubmit } = setup();
    const ta = container.querySelector("textarea")!;
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: false });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("pressing Shift+Enter does NOT submit (newline only)", () => {
    const { container, onSubmit } = setup();
    const ta = container.querySelector("textarea")!;
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("button is disabled when input is empty", () => {
    const { container } = setup({ input: "" });
    const btn = container.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    expect(btn?.disabled).toBe(true);
  });

  it("button is disabled while loading", () => {
    const { container } = setup({ isLoading: true });
    const btn = container.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    expect(btn?.disabled).toBe(true);
  });

  it("button has type=submit (not overridden to type=button by base-ui)", () => {
    const { container } = setup();
    const btn = container.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    expect(btn, "button must have type='submit'").not.toBeNull();
  });
});
