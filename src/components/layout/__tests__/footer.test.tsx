import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "../footer";

describe("Footer", () => {
  it("renders the license text", () => {
    render(<Footer />);
    expect(screen.getByText("VibeFrames — MIT License")).toBeInTheDocument();
  });

  it("renders all external links", () => {
    render(<Footer />);
    const hrefs = [
      "https://mastra.ai",
      "https://www.hyperframes.dev",
      "https://github.com/akashp1712/vibeframes",
    ];
    for (const href of hrefs) {
      const link = document.querySelector(`a[href="${href}"]`);
      expect(link).toBeTruthy();
      expect(link).toHaveAttribute("target", "_blank");
    }
  });
});
