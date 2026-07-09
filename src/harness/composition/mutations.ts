import type { Composition, Clip } from "./schema";

function generateId(prefix: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${id}`;
}

export function createEmptyComposition(): Composition {
  return { fps: 30, width: 1920, height: 1080, clips: [] };
}

/** Append a clip. Pure — returns a new composition. */
export function addClip(
  composition: Composition,
  params: {
    block: Clip["block"];
    from: number;
    durationInFrames: number;
    props?: Record<string, unknown>;
  },
): Composition {
  const clip: Clip = {
    id: generateId("clip"),
    block: params.block,
    from: params.from,
    durationInFrames: params.durationInFrames,
    props: params.props ?? {},
  };
  return { ...composition, clips: [...composition.clips, clip] };
}

/** Total length of the video in frames. */
export function totalFrames(composition: Composition): number {
  return composition.clips.reduce((max, c) => Math.max(max, c.from + c.durationInFrames), 0);
}
