import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HowItWorks } from "../how-it-works";

describe("HowItWorks", () => {
  it("renders the section heading", () => {
    render(<HowItWorks />);
    expect(screen.getByText("How it works")).toBeInTheDocument();
  });

  it("renders all four steps", () => {
    const { container } = render(<HowItWorks />);
    const text = container.textContent ?? "";
    expect(text).toContain("Describe");
    expect(text).toContain("Reason");
    expect(text).toContain("Compose");
    expect(text).toContain("Preview");
  });

  it("renders step descriptions", () => {
    const { container } = render(<HowItWorks />);
    const text = container.textContent ?? "";
    expect(text).toContain("Tell the agent what you want in plain language.");
    expect(text).toContain("Watch your video render in real time");
  });
});
