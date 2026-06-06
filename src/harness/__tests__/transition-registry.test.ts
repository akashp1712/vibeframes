import { describe, expect, it } from "vitest";
import { createTransitionRegistryService } from "../services/transition-registry.service";
import type { HyperFramesTransition } from "../services/types";

/**
 * Registry contract tests for transitions. Mirrors the clip-registry tests —
 * if an entry's metadata is wrong, the agent picks the wrong tool and the
 * renderer chokes. We enforce:
 *   - unique transition ids
 *   - tier ∈ {1,2,3}, kind ∈ valid set
 *   - Tier 1 entries (except `cut`) have a renderable template; Tier 2/3 do not
 *   - every template `{{slot}}` is declared in vars and vice versa
 *   - templates obey the overlay layout contract (`absolute` root)
 */

const TEMPLATE_VAR_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

function extractTemplateVars(template: string): Set<string> {
  const found = new Set<string>();
  for (const match of template.matchAll(TEMPLATE_VAR_RE)) {
    found.add(match[1]);
  }
  return found;
}

const TIER_1_IDS = [
  "cut",
  "fade",
  "fade-through-black",
  "fade-through-white",
  "slide-left",
  "slide-up",
  "zoom-in",
  "zoom-out",
  // First round of Tier 2 promotions
  "wipe-circle",
  "zoom-punch-in",
  "blur-bridge",
  // Second round of Tier 2 promotions
  "wipe-diagonal",
  "slide-stack",
  "zoom-punch-out",
  // Third round of Tier 2 promotions
  "wipe-checker",
  "iris-open",
  "iris-close",
  "glitch-cut",
] as const;

describe("transition-registry", () => {
  const service = createTransitionRegistryService();
  const transitions: HyperFramesTransition[] = service.getTransitionSchemas();

  it("exposes a substantial catalog (Tier 1 + 2 + 3 stubs)", () => {
    expect(transitions.length).toBeGreaterThanOrEqual(20);
  });

  it("has unique transition ids", () => {
    const ids = transitions.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes every Tier 1 transition we expect", () => {
    const ids = new Set(transitions.filter((t) => t.tier === 1).map((t) => t.id));
    for (const id of TIER_1_IDS) {
      expect(ids.has(id), `missing Tier 1 transition: ${id}`).toBe(true);
    }
  });

  it("still has Tier 2 catalog stubs to promote", () => {
    const tier2 = transitions.filter((t) => t.tier === 2);
    // We've promoted 10 of the original 12 Tier 2 stubs to Tier 1 across three
    // rounds; only morph-shapes and morph-type remain (both need SVG path
    // tweening and likely move to Tier 2 sub-composition architecture instead
    // of Tier 1 inline templates). Relax / replace the floor when we add new
    // Tier 2 entries, not when we promote the existing ones.
    expect(tier2.length).toBeGreaterThanOrEqual(2);
  });

  it("has Tier 3 VFX stubs", () => {
    const tier3 = transitions.filter((t) => t.tier === 3);
    expect(tier3.length).toBeGreaterThanOrEqual(1);
  });

  for (const transition of transitions) {
    describe(`transition: ${transition.id}`, () => {
      it("has a non-empty name and description", () => {
        expect(transition.name).toBeTruthy();
        expect(transition.description.length).toBeGreaterThan(20);
      });

      it("has a valid tier and kind", () => {
        expect([1, 2, 3]).toContain(transition.tier);
        expect([
          "cut",
          "fade",
          "slide",
          "zoom",
          "wipe",
          "blur",
          "morph",
          "vfx",
        ]).toContain(transition.kind);
      });

      it("has a non-negative defaultDurationMs", () => {
        expect(transition.defaultDurationMs).toBeGreaterThanOrEqual(0);
      });

      it("Tier 1 (non-cut) entries ship a renderable template; Tier 2/3 do not", () => {
        if (transition.tier === 1 && transition.kind !== "cut") {
          expect(transition.template, `${transition.id} should have a template`).toBeTruthy();
        } else if (transition.tier !== 1) {
          expect(
            transition.template,
            `${transition.id} is a Tier ${transition.tier} stub — it should not ship a template yet`,
          ).toBeUndefined();
        }
      });

      it("templates use an absolute / fullscreen overlay root", () => {
        if (!transition.template) return;
        const root = transition.template.match(/^<div\s+class="([^"]+)"/);
        expect(
          root,
          `${transition.id} template should start with <div class="...">`,
        ).not.toBeNull();
        const cls = root![1];
        const isOverlay =
          /\babsolute\b/.test(cls) || (/\bh-full\b/.test(cls) && /\bw-full\b/.test(cls));
        expect(isOverlay, `${transition.id} root must be an overlay, got: ${cls}`).toBe(true);
      });

      it("does not contain <script> tags", () => {
        if (!transition.template) return;
        expect(transition.template).not.toMatch(/<script/i);
      });

      it("declares vars with unique non-empty names", () => {
        const names = transition.vars.map((v) => v.name);
        expect(new Set(names).size).toBe(names.length);
        for (const v of transition.vars) {
          expect(v.name).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
          expect(v.description.length).toBeGreaterThan(0);
        }
      });

      it("template ↔ vars bidirectional consistency", () => {
        if (!transition.template) {
          expect(transition.vars).toHaveLength(0);
          return;
        }
        const used = extractTemplateVars(transition.template);
        const declared = new Set(transition.vars.map((v) => v.name));
        for (const slot of used) {
          expect(
            declared.has(slot),
            `${transition.id} template references {{${slot}}} but it is not declared in vars`,
          ).toBe(true);
        }
        for (const v of transition.vars) {
          expect(
            used.has(v.name),
            `${transition.id} declares var "${v.name}" but the template never references it`,
          ).toBe(true);
        }
      });
    });
  }
});
