/**
 * VibeFrames harness factory.
 *
 * Architecture: ONE Director agent walks brief → storyboard → compose
 * → validate inside one user turn. See docs/architecture.md for the
 * end-to-end map.
 *
 * Public surface (exported below):
 *   getVibeFramesHarness(projectId)  cached singleton per project
 *   createVibeFramesHarness(projectId)  fresh instance (tests)
 *   composition primitives: Composition, Clip, Track, get/setComposition,
 *                           addClip/updateClip/removeClip, serialize
 *
 * Almost all callers want `getVibeFramesHarness` — the cached instance
 * holds in-process LibSQL connections and Mastra Memory state. Building
 * a fresh harness per request would thrash both.
 */
import { Harness } from "@mastra/core/harness";
import { Memory } from "@mastra/memory";
import { VibeFramesStateSchema, createInitialState, type VibeFramesState } from "./state";
import { createDirectorMode } from "./director/agent";
import { createHarnessServices, type HarnessServices } from "./services";
import { createHarnessStorage } from "./storage";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_PATH = join(__dirname, "director", "skills");

export const services: HarnessServices = createHarnessServices();
const instances = new Map<string, Harness<VibeFramesState>>();

export function createVibeFramesHarness(projectId: string) {
  // Single LibSQL store backs Mastra threads/messages. File-backed by
  // default (`file:./.data/vibeframes.db`); set VIBEFRAMES_DB_URL to
  // a `libsql://` URL + auth token for Turso in serverless. See
  // storage.ts.
  const storage = createHarnessStorage();
  const memory = new Memory({ storage });

  return new Harness<VibeFramesState>({
    id: "vibeframes",
    resourceId: projectId,
    stateSchema: VibeFramesStateSchema,
    storage,
    memory,
    modes: [createDirectorMode(services)],
    workspace: { skills: [SKILLS_PATH] },
    // Strip Mastra's built-in tools we don't use. ask_user / submit_plan
    // imply human-in-the-loop (we run YOLO). subagent / task_* are not
    // part of our pipeline.
    disableBuiltinTools: [
      "task_write",
      "task_check",
      "task_complete",
      "task_update",
      "ask_user",
      "submit_plan",
      "subagent",
    ],
  });
}

export async function getVibeFramesHarness(projectId: string) {
  let harness = instances.get(projectId);
  if (!harness) {
    harness = createVibeFramesHarness(projectId);
    await harness.init();
    // yolo: true → tools execute without human approval. Vercel's
    // serverless runtime can't host stateful approval flows; YOLO is
    // also the right UX for a single-turn pipeline.
    await harness.setState(createInitialState(projectId, true));
    instances.set(projectId, harness);
  }
  return harness;
}

// Re-exports — flat surface for callers outside `harness/` so they
// don't reach into deep paths.
export { HARNESS_CONFIG } from "./config";
export type { Composition, Track, Clip } from "./composition/schema";
export { CompositionSchema, TrackSchema, ClipSchema } from "./composition/schema";
export { getComposition, setComposition } from "./composition/store";
export {
  createEmptyComposition,
  addClip,
  updateClip,
  removeClip,
  addTrack,
  removeTrack,
} from "./composition/mutations";
export { serialize } from "./composition/serialize";
export type { VibeFramesState };
