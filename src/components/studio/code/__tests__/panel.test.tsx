import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CodePanel } from "../panel";

describe("CodePanel", () => {
  it("renders the panel header", () => {
    render(<CodePanel html={null} />);
    expect(screen.getByText("Composition HTML")).toBeInTheDocument();
  });

  it("renders the empty state when html is null", () => {
    const { container } = render(<CodePanel html={null} />);
    // Expand the panel
    fireEvent.click(container.firstChild as Element);
    expect(container.textContent).toContain("HTML source will appear here.");
  });

  it("renders HTML source when html is provided", () => {
    const html = '<div data-composition-id="comp-1">Hello</div>';
    const { container } = render(<CodePanel html={html} />);
    // Expand the panel
    fireEvent.click(container.firstChild as Element);
    expect(container.textContent).toContain("data-composition-id");
    expect(container.textContent).toContain("Hello");
  });
});
