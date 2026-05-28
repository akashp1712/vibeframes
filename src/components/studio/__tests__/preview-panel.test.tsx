import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PreviewPanel } from "../preview-panel";

describe("PreviewPanel", () => {
  it("renders the panel header", () => {
    render(<PreviewPanel />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("renders the empty state message", () => {
    const { container } = render(<PreviewPanel />);
    expect(container.textContent).toContain("HyperFrames preview will render here.");
  });

  it("renders the hint text", () => {
    const { container } = render(<PreviewPanel />);
    expect(container.textContent).toContain("Start a conversation to compose your first clip.");
  });
});
