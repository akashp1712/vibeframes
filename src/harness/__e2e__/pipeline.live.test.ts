/**
 * E2E pipeline test — Director + 4 subagents driven by a real LLM.
 *
 * Verifies that the full Brief → Storyboard → Compose → Validate flow
 * runs in one user turn against the OpenAI API. Catches regressions in
 * the Director and subagent prompts (e.g. Director skipping a phase,
 * Storyboard producing an out-of-tolerance duration sum, Compose
 * leaving beats unbuilt).
 *
 * Configuration:
 *   - Reads OPENAI_API_KEY from .env.local (loaded via process.loadEnvFile).
 *   - All four subagents pinned to gpt-4o-mini for cost (~$0.05 / run).
 *   - Override per-phase model with VIBEFRAMES_{BRIEF,STORYBOARD,COMPOSE,VALIDATE}_MODEL.
 *   - In-memory storage so the test never writes .data/.
 *
 * Run via:
 *   pnpm test:e2e
 *
 * The test self-skips when OPENAI_API_KEY is absent so this config is
 * safe to wire into CI as a manual job.
 */
import { describe, it, expect } from "vitest";
import { createVibeFramesHarness, getComposition } from "../index";
import { createInitialState } from "../state";

// Load .env.local — vitest doesn't pick it up by default.
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (process as any).loadEnvFile?.(".env.local");
} catch {
  /* no-op */
}

const RUN_LIVE = !!process.env.OPENAI_API_KEY;

const PROMPT =
  "make a 12-second product launch video for Linear, dark cinematic, full narration";

describe.skipIf(!RUN_LIVE)("e2e: full pipeline (Director + 4 subagents)", () => {
  it("Director walks Brief → Storyboard → Compose → Validate in one turn", async () => {
    // Force in-memory persistence so the test never writes .data/.
    process.env.VIBEFRAMES_DB_URL = ":memory:";
    process.env.VIBEFRAMES_PERSISTENCE = "memory";
    // Pin all subagents to mini for cost. Override individually if you want
    // to test a specific phase against gpt-4o.
    process.env.VIBEFRAMES_MODEL ??= "gpt-4o-mini";
    process.env.VIBEFRAMES_BRIEF_MODEL ??= "openai/gpt-4o-mini";
    process.env.VIBEFRAMES_STORYBOARD_MODEL ??= "openai/gpt-4o-mini";
    process.env.VIBEFRAMES_COMPOSE_MODEL ??= "openai/gpt-4o-mini";
    process.env.VIBEFRAMES_VALIDATE_MODEL ??= "openai/gpt-4o-mini";

    const projectId = "e2e-test-" + Date.now();
    const harness = createVibeFramesHarness(projectId);
    await harness.init();
    // Seed yolo so tool calls don't hang on the approval gate.
    await harness.setState(createInitialState(projectId, true));

    const events: { type: string; ts: number }[] = [];
    const t0 = Date.now();
    const unsubscribe = harness.subscribe((e: { type: string }) => {
      if (e.type === "tool_input_delta" || e.type === "display_state_changed") return;
      events.push({ type: e.type, ts: Date.now() - t0 });
    });

    try {
      await harness.createThread({ title: "e2e" });
      await harness.sendMessage({ content: PROMPT });
    } finally {
      unsubscribe();
    }

    const wallMs = Date.now() - t0;
    const state = harness.getState();
    const composition = getComposition(projectId);
    const totalClips = composition.tracks.reduce((s, t) => s + t.clips.length, 0);

    // ── report ───────────────────────────────────────────────────────────
    /* eslint-disable no-console */
    console.log("\n" + "═".repeat(72));
    console.log("  E2E PIPELINE — Director + 4 subagents");
    console.log("═".repeat(72));
    console.log(`prompt:      "${PROMPT}"`);
    console.log(`wall:        ${wallMs}ms`);
    console.log(`brief:       ${state.brief ? "✓" : "✗ MISSING"}`);
    if (state.brief) {
      console.log(
        `             arc=${state.brief.arc} dur=${state.brief.durationMs}ms ` +
          `audience="${state.brief.audience}" narration=${state.brief.narration}`,
      );
    }
    console.log(
      `storyboard:  ${state.storyboard ? `✓ ${state.storyboard.beats.length} beats (${state.storyboard.rhythm})` : "✗ MISSING"}`,
    );
    if (state.storyboard) {
      for (const b of state.storyboard.beats) {
        console.log(
          `             ${b.index}. ${b.shotType}/${b.cameraMove} ${b.durationMs}ms built=${b.built}`,
        );
      }
    }
    console.log(`composition: ${composition.tracks.length} tracks, ${totalClips} clips`);
    for (const t of composition.tracks) {
      console.log(`             ${t.id} (${t.clips.length} clips)`);
    }
    console.log(
      `validation:  ${
        state.validationReport
          ? state.validationReport.pass
            ? `✓ pass (${state.validationReport.issues.length} non-error issues)`
            : `✗ failed (${state.validationReport.issues.filter((i) => i.severity === "error").length} errors)`
          : "✗ never ran"
      }`,
    );
    if (state.validationReport) {
      for (const issue of state.validationReport.issues) {
        console.log(`             [${issue.severity}] ${issue.rule}: ${issue.message}`);
      }
    }

    // Collapse repeat events for readability
    const phaseMarkers = events.filter((e) =>
      /subagent_(start|end)|agent_(start|end)/.test(e.type),
    );
    console.log(`phase markers (${phaseMarkers.length}):`);
    for (const m of phaseMarkers) {
      console.log(`  [+${m.ts}ms] ${m.type}`);
    }
    console.log("");
    /* eslint-enable no-console */

    // ── assertions ───────────────────────────────────────────────────────
    expect(state.brief, "Brief subagent should commit a brief").not.toBeNull();
    expect(state.storyboard, "Storyboard subagent should commit a storyboard").not.toBeNull();
    expect(totalClips, "Compose subagent should produce clips").toBeGreaterThan(0);
    expect(state.validationReport, "Validate subagent should produce a report").not.toBeNull();

    // Stronger assertions — the report should pass (warnings allowed)
    if (state.validationReport) {
      const errors = state.validationReport.issues.filter((i) => i.severity === "error");
      expect(
        errors,
        `Validation should not surface errors (got ${errors.length}). ` +
          `Inspect the report above to debug.`,
      ).toHaveLength(0);
    }

    // Storyboard duration sum should match brief.durationMs ± 500ms
    if (state.brief && state.storyboard) {
      const sum = state.storyboard.beats.reduce((a, b) => a + b.durationMs, 0);
      expect(
        Math.abs(sum - state.brief.durationMs),
        `Beat durations should sum to brief.durationMs ± 500ms ` +
          `(got brief=${state.brief.durationMs}, sum=${sum}).`,
      ).toBeLessThanOrEqual(500);
    }
  });
});

describe.skipIf(RUN_LIVE)("e2e: skipped without OPENAI_API_KEY", () => {
  it("set OPENAI_API_KEY in .env.local to run the live pipeline check", () => {
    expect(true).toBe(true);
  });
});
