import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CodePanel } from "../code-panel";

describe("CodePanel", () => {
  it("renders the panel header", () => {
    render(<CodePanel />);
    expect(screen.getByText("Composition HTML")).toBeInTheDocument();
  });

  it("renders the empty state message", () => {
    const { container } = render(<CodePanel />);
    expect(container.textContent).toContain("HTML source will appear here.");
  });
});
