import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { pop, clamp } from "../anim";

// Words fly in one at a time with a spring + blur-clear, then the whole line
// drifts on a slow parallax and fades out. Cinematic kinetic typography.
export const KineticTitle: React.FC<{
  eyebrow?: string;
  words?: string[];
  accent?: string;
  total?: number;
}> = ({ eyebrow, words, accent = "#e08a5f", total = 90 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = Array.isArray(words) && words.length ? words : ["Untitled"];

  const eyebrowOp = interpolate(frame, [2, 16], [0, 1], clamp);
  const eyebrowExit = interpolate(frame, [total - 14, total], [1, 0], clamp);

  // whole-group slow parallax drift + exit
  const driftY = interpolate(frame, [0, total], [12, -18]);
  const groupExit = interpolate(frame, [total - 16, total], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div style={{ textAlign: "center", transform: `translateY(${driftY}px)`, opacity: groupExit }}>
        {eyebrow && (
          <div
            style={{
              opacity: Math.min(eyebrowOp, eyebrowExit),
              color: accent,
              fontFamily: "monospace",
              fontSize: 26,
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              marginBottom: 36,
            }}
          >
            {eyebrow}
          </div>
        )}
        <div style={{ display: "flex", gap: 28, justifyContent: "center", flexWrap: "wrap" }}>
          {items.map((w, i) => {
            const p = pop(frame, fps, 8 + i * 7, 14);
            const y = interpolate(p, [0, 1], [70, 0]);
            const blur = interpolate(p, [0, 1], [14, 0]);
            const scale = interpolate(p, [0, 1], [1.15, 1]);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: p,
                  transform: `translateY(${y}px) scale(${scale})`,
                  filter: `blur(${blur}px)`,
                  color: "#f7f3ec",
                  fontSize: 148,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
