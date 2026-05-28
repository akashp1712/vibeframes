import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Topbar } from "../topbar";

describe("Topbar", () => {
  it("renders the brand name", () => {
    render(<Topbar />);
    expect(screen.getByText("VibeFrames")).toBeInTheDocument();
  });

  it("renders GitHub link pointing to repo", () => {
    render(<Topbar />);
    const link = document.querySelector('a[href*="github.com/akashp1712"]');
    expect(link).toBeTruthy();
  });

  it("renders link to /studio", () => {
    render(<Topbar />);
    const link = document.querySelector('a[href="/studio"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toMatch(/open studio/i);
  });
});
