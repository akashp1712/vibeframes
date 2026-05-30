import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PreviewPanel } from "../preview-panel";

describe("PreviewPanel", () => {
  it("renders the panel header", () => {
    render(<PreviewPanel html={null} />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("renders the empty state when html is null", () => {
    const { container } = render(<PreviewPanel html={null} />);
    expect(container.textContent).toContain("HyperFrames preview");
  });

  it("renders the hint text when html is null", () => {
    const { container } = render(<PreviewPanel html={null} />);
    expect(container.textContent).toContain("Start a conversation");
  });

  it("renders an iframe when html is provided", () => {
    const html = '<div id="root"><div class="clip">Hello</div></div>';
    render(<PreviewPanel html={html} />);
    const iframe = screen.getByTitle("HyperFrames Preview");
    expect(iframe).toBeInTheDocument();
    expect(iframe.tagName).toBe("IFRAME");
  });
});
