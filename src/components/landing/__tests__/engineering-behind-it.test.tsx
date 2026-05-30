import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EngineeringBehindIt } from "../engineering-behind-it";

describe("EngineeringBehindIt", () => {
  it("renders the section heading and harness narrative", () => {
    const { container } = render(<EngineeringBehindIt />);
    const text = container.textContent ?? "";
    expect(text).toContain("The engineering behind it");
    expect(text).toContain("Agentic Harness");
    expect(text).toContain("Mastra");
  });

  it("renders all five satellite labels around the harness", () => {
    const { container } = render(<EngineeringBehindIt />);
    const text = container.textContent ?? "";
    expect(text).toContain("State");
    expect(text).toContain("Modes");
    expect(text).toContain("Tools");
    expect(text).toContain("Skills");
    expect(text).toContain("Memory");
  });

});
