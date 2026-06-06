import type { Composition, Clip, Track } from "./schema";

function generateId(prefix: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${id}`;
}

export function createEmptyComposition(title: string): Composition {
  return {
    id: generateId("comp"),
    title,
    width: 1920,
    height: 1080,
    fps: 30,
    tracks: [],
  };
}

export function addClip(
  composition: Composition,
  params: {
    trackId: string;
    trackLabel?: string;
    startMs: number;
    durationMs: number;
    html: string;
  },
): Composition {
  if (params.startMs < 0) throw new Error("startMs must be non-negative");
  if (params.durationMs <= 0) throw new Error("durationMs must be positive");

  const clip: Clip = {
    id: generateId("clip"),
    trackId: params.trackId,
    startMs: params.startMs,
    durationMs: params.durationMs,
    html: params.html,
  };

  const existingTrack = composition.tracks.find((t) => t.id === params.trackId);

  if (existingTrack) {
    return {
      ...composition,
      tracks: composition.tracks.map((t) =>
        t.id === params.trackId ? { ...t, clips: [...t.clips, clip] } : t,
      ),
    };
  }

  const newTrack: Track = {
    id: params.trackId,
    label: params.trackLabel ?? `Track ${composition.tracks.length + 1}`,
    clips: [clip],
  };

  return {
    ...composition,
    tracks: [...composition.tracks, newTrack],
  };
}

export function updateClip(
  composition: Composition,
  params: {
    clipId: string;
    html?: string;
    startMs?: number;
    durationMs?: number;
  },
): Composition {
  let found = false;

  const tracks = composition.tracks.map((track) => ({
    ...track,
    clips: track.clips.map((clip) => {
      if (clip.id !== params.clipId) return clip;
      found = true;
      return {
        ...clip,
        ...(params.html !== undefined && { html: params.html }),
        ...(params.startMs !== undefined && { startMs: params.startMs }),
        ...(params.durationMs !== undefined && { durationMs: params.durationMs }),
      };
    }),
  }));

  if (!found) throw new Error(`Clip not found: ${params.clipId}`);

  return { ...composition, tracks };
}

export function removeClip(
  composition: Composition,
  params: { clipId: string },
): Composition {
  let found = false;

  const tracks = composition.tracks
    .map((track) => {
      const filtered = track.clips.filter((c) => {
        if (c.id === params.clipId) {
          found = true;
          return false;
        }
        return true;
      });
      return { ...track, clips: filtered };
    })
    .filter((track) => track.clips.length > 0);

  if (!found) throw new Error(`Clip not found: ${params.clipId}`);

  return { ...composition, tracks };
}

export function addTrack(
  composition: Composition,
  params: { label: string },
): Composition {
  const track: Track = {
    id: generateId("track"),
    label: params.label,
    clips: [],
  };

  return {
    ...composition,
    tracks: [...composition.tracks, track],
  };
}

export function removeTrack(
  composition: Composition,
  params: { trackId: string },
): Composition {
  const exists = composition.tracks.some((t) => t.id === params.trackId);
  if (!exists) throw new Error(`Track not found: ${params.trackId}`);

  return {
    ...composition,
    tracks: composition.tracks.filter((t) => t.id !== params.trackId),
  };
}
