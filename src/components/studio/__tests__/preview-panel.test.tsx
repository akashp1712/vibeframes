import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PreviewPanel } from "../preview-panel";

describe("PreviewPanel", () => {
  it("renders the panel header", () => {
    render(<PreviewPanel html={null} />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("renders the empty state when html is null", () => {
    const { container } = render(<PreviewPanel html={null} />);
    expect(container.textContent).toContain("HyperFrames preview");
  });

  it("renders the hint text when html is null", () => {
    const { container } = render(<PreviewPanel html={null} />);
    expect(container.textContent).toContain("Start a conversation");
  });

  it("renders an iframe when html is provided", () => {
    const html = '<div id="root"><div class="clip">Hello</div></div>';
    render(<PreviewPanel html={html} />);
    const iframe = screen.getByTitle("HyperFrames Preview");
    expect(iframe).toBeInTheDocument();
    expect(iframe.tagName).toBe("IFRAME");
  });

  describe("building state during agent activity", () => {
    const oldHtml = '<div id="root" data-marker="old"><div class="clip">Old</div></div>';
    const newHtml = '<div id="root" data-marker="new"><div class="clip">New</div></div>';

    it("hides the iframe entirely while isLoading is true (no stale preview)", () => {
      const { rerender, container } = render(
        <PreviewPanel html={oldHtml} isLoading={false} />,
      );
      // Iframe visible with the previous composition.
      expect(container.querySelector("iframe")).not.toBeNull();

      // Agent turn begins. The iframe should disappear — we don't want the
      // user to see the previous composition while the new one is being
      // built (especially if the prompts are unrelated).
      rerender(<PreviewPanel html={newHtml} isLoading={true} />);
      expect(container.querySelector("iframe")).toBeNull();
    });

    it("shows a Building… state while isLoading is true", () => {
      const { container } = render(
        <PreviewPanel html={oldHtml} isLoading={true} />,
      );
      expect(container.textContent).toMatch(/building/i);
    });

    it("hides the Building… state and shows the new iframe when isLoading flips to false", () => {
      const { rerender, container } = render(
        <PreviewPanel html={oldHtml} isLoading={true} />,
      );
      expect(container.querySelector("iframe")).toBeNull();
      expect(container.textContent).toMatch(/building/i);

      rerender(<PreviewPanel html={newHtml} isLoading={false} />);
      const iframe = container.querySelector("iframe") as HTMLIFrameElement | null;
      expect(iframe).not.toBeNull();
      expect(iframe!.srcdoc).toContain('data-marker="new"');
      expect(container.textContent).not.toMatch(/building/i);
    });

    it("freezes the underlying html state during loading (no flicker of intermediate states)", () => {
      // Even though intermediate htmls are not visible (iframe is hidden),
      // displayHtml should still settle once isLoading flips to false. This
      // protects the swap-in moment from showing a half-built composition.
      const { rerender, container } = render(
        <PreviewPanel html={oldHtml} isLoading={false} />,
      );
      rerender(<PreviewPanel html={newHtml} isLoading={true} />);
      // Iframe hidden during build.
      expect(container.querySelector("iframe")).toBeNull();
      // Settle.
      rerender(<PreviewPanel html={newHtml} isLoading={false} />);
      const iframe = container.querySelector("iframe") as HTMLIFrameElement | null;
      expect(iframe!.srcdoc).toContain('data-marker="new"');
    });
  });
});
