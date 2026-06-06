import { Harness } from "@mastra/core/harness";
import { Memory } from "@mastra/memory";
import { VibeFramesStateSchema, createInitialState, type VibeFramesState } from "./state";
import { createDirectorMode } from "./director/mode";
import { createHarnessServices, type HarnessServices } from "./services";
import { createHarnessStorage } from "./storage";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_PATH = join(__dirname, "skills");

export const services: HarnessServices = createHarnessServices();
const directorMode = createDirectorMode(services);
const instances = new Map<string, Harness<VibeFramesState>>();

export function createVibeFramesHarness(projectId: string) {
  // Single LibSQL store backs both Mastra threads/messages and any future
  // domains. File-backed by default (`file:./.data/vibeframes.db`); set
  // VIBEFRAMES_DB_URL to a `libsql://` URL + auth token to use Turso in
  // serverless deployments. See `storage.ts`.
  const storage = createHarnessStorage();
  const memory = new Memory({ storage });

  return new Harness<VibeFramesState>({
    id: "vibeframes",
    resourceId: projectId,
    stateSchema: VibeFramesStateSchema,
    storage,
    memory,
    modes: [directorMode],
    workspace: { skills: [SKILLS_PATH] },
    disableBuiltinTools: ["task_write", "task_check", "ask_user", "submit_plan"],
  });
}

export async function getVibeFramesHarness(projectId: string) {
  let harness = instances.get(projectId);
  if (!harness) {
    harness = createVibeFramesHarness(projectId);
    await harness.init();
    // yolo: true in initial state — disables tool approval gating so tools execute
    // without user confirmation. Required since Vercel serverless can't host
    // stateful human-in-the-loop approval flows.
    await harness.setState(createInitialState(projectId, true));
    instances.set(projectId, harness);
  }
  return harness;
}

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
