import { describe, expect, it } from "vitest";
import { createClipRegistryService } from "../services/clip-registry.service";
import type { HyperFramesBlock } from "../services/types";

/**
 * Registry contract tests. The clip registry is the agent's "scenery
 * catalog" — broken entries mean broken renders. These tests enforce the
 * discipline laid out in `clip-registry.service.ts`:
 *   - every `{{slot}}` in a template appears in `vars`
 *   - every entry in `vars` is referenced in the template
 *   - block ids and var names are unique within their scope
 *   - templates obey the layout contract (fullscreen flex root OR overlay
 *     absolute root)
 *   - no `<script>` tags or `fade-in`/`fade-out` style hooks
 */

const TEMPLATE_VAR_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

function extractTemplateVars(template: string): Set<string> {
  const found = new Set<string>();
  for (const match of template.matchAll(TEMPLATE_VAR_RE)) {
    found.add(match[1]);
  }
  return found;
}

describe("clip-registry", () => {
  const service = createClipRegistryService();
  const blocks: HyperFramesBlock[] = service.getBlockSchemas();

  it("exposes the full catalog", () => {
    expect(blocks.length).toBeGreaterThanOrEqual(20);
  });

  it("includes the atomic blocks of the canonical 3-clip pattern", () => {
    const ids = new Set(blocks.map((b) => b.id));
    expect(ids.has("background-fill")).toBe(true);
    expect(ids.has("logo-headline")).toBe(true);
    expect(ids.has("subtitle-anchor")).toBe(true);
  });

  it("includes the social overlay units", () => {
    const socialIds = new Set(
      blocks.filter((b) => b.category === "social").map((b) => b.id),
    );
    expect(socialIds.has("social-avatar")).toBe(true);
    expect(socialIds.has("mention-card")).toBe(true);
    expect(socialIds.has("hashtag-pill")).toBe(true);
    expect(socialIds.has("comment-bubble")).toBe(true);
    expect(socialIds.has("like-counter")).toBe(true);
  });

  it("includes the follow CTAs", () => {
    const followIds = new Set(
      blocks.filter((b) => b.category === "follow").map((b) => b.id),
    );
    expect(followIds.has("follow-button")).toBe(true);
    expect(followIds.has("follow-arrow")).toBe(true);
  });

  it("includes the effect overlays", () => {
    const fxIds = new Set(
      blocks.filter((b) => b.category === "effect-overlay").map((b) => b.id),
    );
    expect(fxIds.has("grain-overlay")).toBe(true);
    expect(fxIds.has("scanlines-overlay")).toBe(true);
  });

  it("every block declares a kind of 'unit' or 'composition'", () => {
    for (const block of blocks) {
      expect(["unit", "composition"]).toContain(block.kind);
    }
  });

  it("social, follow, and effect-overlay categories are all units", () => {
    for (const block of blocks) {
      if (
        block.category === "social" ||
        block.category === "follow" ||
        block.category === "effect-overlay" ||
        block.category === "background"
      ) {
        expect(
          block.kind,
          `block ${block.id} (category=${block.category}) should be a unit`,
        ).toBe("unit");
      }
    }
  });

  it("has unique block ids", () => {
    const ids = blocks.map((b) => b.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  for (const block of blocks) {
    describe(`block: ${block.id}`, () => {
      it("has a non-empty name, description, and template", () => {
        expect(block.name).toBeTruthy();
        expect(block.description.length).toBeGreaterThan(20);
        expect(block.template.length).toBeGreaterThan(40);
      });

      it("has a fullscreen flex root OR an absolute overlay root", () => {
        const root = block.template.match(/^<div\s+class="([^"]+)"/);
        expect(root, `block ${block.id} should start with <div class="...">`).not.toBeNull();
        const cls = root![1];
        const isFullscreen = /\bh-full\b/.test(cls) && /\bw-full\b/.test(cls);
        const isOverlay = /\babsolute\b/.test(cls);
        expect(
          isFullscreen || isOverlay,
          `block ${block.id} root must be fullscreen (h-full w-full) or an overlay (absolute), got: ${cls}`,
        ).toBe(true);
      });

      it("does not contain <script> tags", () => {
        expect(block.template).not.toMatch(/<script/i);
      });

      it("does not author its own fade-in/out (renderer handles those)", () => {
        expect(block.template).not.toMatch(/animate-fade/i);
        expect(block.template).not.toMatch(/opacity-0|opacity:\s*0/);
      });

      it("declares vars with unique non-empty names", () => {
        const names = block.vars.map((v) => v.name);
        expect(new Set(names).size).toBe(names.length);
        for (const v of block.vars) {
          expect(v.name).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
          expect(v.description.length).toBeGreaterThan(0);
        }
      });

      it("every template {{slot}} is declared in vars", () => {
        const used = extractTemplateVars(block.template);
        const declared = new Set(block.vars.map((v) => v.name));
        for (const slot of used) {
          expect(
            declared.has(slot),
            `block ${block.id} template references {{${slot}}} but it is not declared in vars`,
          ).toBe(true);
        }
      });

      it("every declared var is referenced in the template", () => {
        const used = extractTemplateVars(block.template);
        for (const v of block.vars) {
          expect(
            used.has(v.name),
            `block ${block.id} declares var "${v.name}" but the template never references it`,
          ).toBe(true);
        }
      });
    });
  }
});
