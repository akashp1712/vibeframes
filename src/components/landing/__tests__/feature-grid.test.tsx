import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureGrid } from "../feature-grid";

describe("FeatureGrid", () => {
  it("renders all three feature cards", () => {
    render(<FeatureGrid />);
    expect(screen.getByText("Chat-First Editing")).toBeInTheDocument();
    expect(screen.getByText("HTML-Native Engine")).toBeInTheDocument();
    expect(screen.getByText("Mastra Harness")).toBeInTheDocument();
  });

  it("renders feature descriptions", () => {
    const { container } = render(<FeatureGrid />);
    const text = container.textContent ?? "";
    expect(text).toContain("Describe your video in natural language");
    expect(text).toContain("HyperFrames renders HTML into video");
    expect(text).toContain("Typed state, modes, tools, skills, memory");
  });
});
