import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

/**
 * A continuous visual thread that persists across the ENTIRE video, behind
 * every scene. A single flowing curve draws itself in over the whole runtime
 * with a light comet travelling along it — the through-line that makes a
 * sequence of scenes feel like one designed film.
 *
 * Rendered once at the composition root (not per-scene), so it never resets.
 */
export const ThroughLine: React.FC<{ accent?: string; durationInFrames: number }> = ({
  accent = "#e8894a",
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // A gentle sine curve spanning the full width, sitting low in frame.
  const midY = height * 0.82;
  const amp = height * 0.06;
  const pts: string[] = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const y = midY + Math.sin((i / steps) * Math.PI * 3) * amp;
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  const path = pts.join(" ");

  // Draw the line across the whole video; comet leads the drawn edge.
  const total = Math.max(1, durationInFrames);
  const drawn = interpolate(frame, [0, total * 0.9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const LEN = 6000; // safely longer than the path

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="tl-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="50%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill="none"
          stroke="url(#tl-grad)"
          strokeWidth={2.5}
          strokeDasharray={LEN}
          strokeDashoffset={LEN * (1 - drawn)}
          strokeLinecap="round"
        />
      </svg>
    </AbsoluteFill>
  );
};
