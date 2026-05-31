export interface VibeFramesEvent {
  v: 1;
  runId: string;
  seq: number;
  projectId: string;
  ts: number;
  type: string;
  payload: unknown;
}
