/**
 * Backwards-compatible re-export. The real implementation lives in
 * `composition-store.ts` which is disk-backed for durability across process
 * restarts (see also `storage.ts` for the Mastra threads/messages store).
 */
export {
  getComposition,
  setComposition,
  deleteComposition,
  __resetCompositionStoreForTests,
} from "./composition-store";
