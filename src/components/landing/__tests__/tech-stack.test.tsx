import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TechStack } from "../tech-stack";

describe("TechStack", () => {
  it("renders the section heading", () => {
    render(<TechStack />);
    expect(screen.getByText("Built with")).toBeInTheDocument();
  });

  it("renders key stack badges", () => {
    const { container } = render(<TechStack />);
    const text = container.textContent ?? "";
    expect(text).toContain("Next.js 16");
    expect(text).toContain("React 19");
    expect(text).toContain("HyperFrames");
    expect(text).toContain("Mastra Harness");
    expect(text).toContain("AI SDK v4");
  });
});
