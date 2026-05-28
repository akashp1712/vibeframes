import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureGrid } from "../feature-grid";

describe("FeatureGrid", () => {
  it("renders the bento grid feature cards", () => {
    render(<FeatureGrid />);
    expect(screen.getByText("Chat-First Editing")).toBeInTheDocument();
    expect(screen.getByText("HTML-Native Serialization")).toBeInTheDocument();
    expect(screen.getByText("Mastra Harness Runtime")).toBeInTheDocument();
    expect(screen.getByText("Rigorous Test-First Quality")).toBeInTheDocument();
  });

  it("renders feature descriptions", () => {
    const { container } = render(<FeatureGrid />);
    const text = container.textContent ?? "";
    expect(text).toContain("Describe your video in plain text");
    expect(text).toContain("No proprietary timeline binaries");
    expect(text).toContain("A robust environment defining typed state");
    expect(text).toContain("All tools, schemas, and API handlers");
  });
});
