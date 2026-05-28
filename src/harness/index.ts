export { HARNESS_CONFIG } from "./config";
export type {
  HarnessState,
  HarnessMode,
  CompositionStatus,
  Composition,
  Track,
  Clip,
} from "./types";
export { HarnessStateSchema, CompositionSchema, TrackSchema, ClipSchema } from "./types";
export { addClipTool, updateClipTool, removeClipTool } from "./tools";
