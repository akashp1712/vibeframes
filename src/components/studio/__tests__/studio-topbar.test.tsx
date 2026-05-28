import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StudioTopbar } from "../studio-topbar";

describe("StudioTopbar", () => {
  it("renders the studio brand", () => {
    const { container } = render(<StudioTopbar />);
    expect(container.textContent).toContain("VibeFrames Studio");
  });

  it("shows default project name", () => {
    const { container } = render(<StudioTopbar />);
    expect(container.textContent).toContain("Untitled Project");
  });

  it("shows custom project name", () => {
    const { container } = render(<StudioTopbar projectName="My Video" />);
    expect(container.textContent).toContain("My Video");
  });
});
