import { interpolate, spring } from "remotion";

// Small easing/animation helpers so blocks stay readable.
export const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// Fade+rise in over [inStart, inStart+dur], hold, fade out over the last `outDur`
// frames before `total`. Returns { opacity, y }.
export function enterExit(
  frame: number,
  total: number,
  { inStart = 0, inDur = 18, outDur = 16, rise = 40 } = {}
) {
  const opIn = interpolate(frame, [inStart, inStart + inDur], [0, 1], clamp);
  const opOut = interpolate(frame, [total - outDur, total], [1, 0], clamp);
  const opacity = Math.min(opIn, opOut);
  const y = interpolate(frame, [inStart, inStart + inDur], [rise, 0], clamp);
  return { opacity, y };
}

// Spring 0->1 with a delay, tuned for smooth cinematic motion.
export function pop(frame: number, fps: number, delay = 0, damping = 200) {
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.8 } });
}
