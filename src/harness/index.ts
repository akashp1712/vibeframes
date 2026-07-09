/**
 * VibeFrames controller factory.
 *
 * ONE Director agent turns a prompt into a composition (a list of clips) by
 * calling add-clip. Built on Mastra's AgentController (1.50) — the controller
 * is the shared host; each project drives work through its own Session.
 *
 * Cached singleton per project so LibSQL connections + memory aren't thrashed.
 */
import { AgentController, type Session } from "@mastra/core/agent-controller";
import { Workspace, LocalFilesystem } from "@mastra/core/workspace";
import { Memory } from "@mastra/memory";
import { join } from "path";
import { VibeFramesStateSchema, type VibeFramesState } from "./state";
import { createDirectorMode } from "./director/agent";
import { createHarnessStorage } from "./storage";

// The Director's skills live next to its agent. The workspace filesystem is
// rooted here so the `compose` skill (director/skills/compose/SKILL.md) is
// discoverable via the auto-generated skill tools — keeping the system prompt
// lean per agentskills.io.
const DIRECTOR_DIR = join(process.cwd(), "src", "harness", "director");

const controllers = new Map<string, AgentController<VibeFramesState>>();
const sessions = new Map<string, Session<VibeFramesState>>();

function createController(projectId: string) {
  const storage = createHarnessStorage();
  return new AgentController<VibeFramesState>({
    id: "vibeframes",
    resourceId: projectId,
    stateSchema: VibeFramesStateSchema,
    initialState: { projectId, yolo: true },
    storage,
    memory: new Memory({ storage }),
    // Workspace rooted at the director dir so the `compose` skill is loadable
    // via the built-in skill tools (keeps the system prompt minimal).
    workspace: new Workspace({
      filesystem: new LocalFilesystem({ basePath: DIRECTOR_DIR }),
      skills: ["skills"],
    }),
    modes: [createDirectorMode()],
    defaultModeId: "director",
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

/** Get (or lazily create) the live Session for a project. */
export async function getSession(projectId: string): Promise<Session<VibeFramesState>> {
  const existing = sessions.get(projectId);
  if (existing) return existing;

  let controller = controllers.get(projectId);
  if (!controller) {
    controller = createController(projectId);
    await controller.init();
    controllers.set(projectId, controller);
  }

  const session = await controller.createSession({ resourceId: projectId });
  sessions.set(projectId, session);
  return session;
}

// Flat public surface.
export type { Composition, Clip } from "./composition/schema";
export { CompositionSchema, ClipSchema } from "./composition/schema";
export { getComposition, setComposition } from "./composition/store";
export { createEmptyComposition, addClip, totalFrames } from "./composition/mutations";
export type { VibeFramesState };
