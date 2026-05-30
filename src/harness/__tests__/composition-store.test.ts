import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("composition-store (disk persistence)", () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = mkdtempSync(join(tmpdir(), "vibeframes-test-"));
    vi.stubEnv("VIBEFRAMES_DATA_DIR", dataDir);
    vi.stubEnv("VIBEFRAMES_PERSISTENCE", "disk");
    vi.stubEnv("NODE_ENV", "production"); // force disk mode despite vitest default
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (existsSync(dataDir)) rmSync(dataDir, { recursive: true, force: true });
  });

  it("creates an empty composition on first access", async () => {
    const store = await import("../composition-store");
    const comp = store.getComposition("proj-a");
    expect(comp.tracks).toEqual([]);
    expect(comp.id).toMatch(/^comp-/);
  });

  it("write-through to disk on setComposition", async () => {
    const store = await import("../composition-store");
    const { addClip } = await import("../mutations");
    const c1 = store.getComposition("proj-b");
    const updated = addClip(c1, {
      trackId: "track-main",
      startMs: 0,
      durationMs: 1000,
      html: "<p>hi</p>",
    });
    store.setComposition("proj-b", updated);

    const file = join(dataDir, "proj-b.json");
    expect(existsSync(file)).toBe(true);
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    expect(parsed.tracks[0].clips).toHaveLength(1);
  });

  it("hydrates from disk in a fresh module load", async () => {
    // first module instance: write
    const first = await import("../composition-store");
    const { addClip } = await import("../mutations");
    const c1 = first.getComposition("proj-c");
    const updated = addClip(c1, {
      trackId: "track-main",
      startMs: 0,
      durationMs: 1500,
      html: "<h1>persisted</h1>",
    });
    first.setComposition("proj-c", updated);

    // simulate process restart by resetting the module registry
    vi.resetModules();
    const second = await import("../composition-store");
    const rehydrated = second.getComposition("proj-c");

    expect(rehydrated.tracks[0].clips).toHaveLength(1);
    expect(rehydrated.tracks[0].clips[0].html).toBe("<h1>persisted</h1>");
  });

  it("memory mode bypasses disk", async () => {
    vi.stubEnv("VIBEFRAMES_PERSISTENCE", "memory");
    vi.resetModules();
    const store = await import("../composition-store");
    const { addClip } = await import("../mutations");
    const c1 = store.getComposition("proj-d");
    store.setComposition(
      "proj-d",
      addClip(c1, { trackId: "t", startMs: 0, durationMs: 500, html: "<i/>" }),
    );
    expect(existsSync(join(dataDir, "proj-d.json"))).toBe(false);
  });
});
