/**
 * Composition store — persists the per-project Composition across process
 * restarts. Pluggable via env:
 *
 *   VIBEFRAMES_DATA_DIR   (default: "./.data/compositions")
 *
 * The store is read-through / write-through:
 *   - First `getComposition(projectId)` after boot hydrates from disk.
 *   - `setComposition` updates the in-memory map AND synchronously persists
 *     to disk (small JSON blob — sub-ms cost, eliminates any read-after-write
 *     race for callers that read the file immediately).
 *
 * Tests / serverless can disable disk by passing `--ephemeral` (the
 * `CompositionPersistenceMode` env knob), making the store a plain Map.
 */

import { mkdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Composition } from "./schema";
import { createEmptyComposition } from "./mutations";

const DEFAULT_DATA_DIR = "./.data/compositions";
const persistenceMode = (): "disk" | "memory" => {
  const mode = process.env.VIBEFRAMES_PERSISTENCE?.trim().toLowerCase();
  if (mode === "memory" || mode === "ephemeral") return "memory";
  if (process.env.NODE_ENV === "test") return "memory";
  return "disk";
};

const dataDir = (): string => process.env.VIBEFRAMES_DATA_DIR?.trim() || DEFAULT_DATA_DIR;

const compositions = new Map<string, Composition>();
const hydrated = new Set<string>();

function pathFor(projectId: string): string {
  return join(dataDir(), `${encodeURIComponent(projectId)}.json`);
}

function hydrateFromDisk(projectId: string): Composition | null {
  if (persistenceMode() !== "disk") return null;
  const file = pathFor(projectId);
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Composition;
    return parsed;
  } catch {
    return null;
  }
}

function persistToDisk(projectId: string, composition: Composition): void {
  if (persistenceMode() !== "disk") return;
  try {
    mkdirSync(dataDir(), { recursive: true });
    // Synchronous on purpose. Compositions are small JSON blobs (~few KB),
    // so the write is sub-millisecond, and sync removes the read-after-write
    // race that fire-and-forget had. The in-memory map remains the source
    // of truth within the process; disk is for cross-process durability.
    writeFileSync(pathFor(projectId), JSON.stringify(composition, null, 2));
  } catch {
    // surface as a no-op; don't break the chat loop over a disk hiccup
  }
}

export function getComposition(projectId: string): Composition {
  if (!hydrated.has(projectId)) {
    const restored = hydrateFromDisk(projectId);
    if (restored) compositions.set(projectId, restored);
    hydrated.add(projectId);
  }

  const existing = compositions.get(projectId);
  if (existing) return existing;

  const fresh = createEmptyComposition("Untitled");
  compositions.set(projectId, fresh);
  persistToDisk(projectId, fresh);
  return fresh;
}

export function setComposition(projectId: string, composition: Composition): void {
  compositions.set(projectId, composition);
  hydrated.add(projectId);
  persistToDisk(projectId, composition);
}

export function deleteComposition(projectId: string): boolean {
  hydrated.delete(projectId);
  return compositions.delete(projectId);
}

/** Test helper — wipes the in-memory cache so tests don't bleed into each other. */
export function __resetCompositionStoreForTests(): void {
  compositions.clear();
  hydrated.clear();
}
