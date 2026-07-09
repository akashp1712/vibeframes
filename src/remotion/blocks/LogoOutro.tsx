import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { pop, clamp } from "../anim";

// Final beat: a mark scales in with a sweeping shine line, tagline fades under it.
export const LogoOutro: React.FC<{
  title: string;
  tagline?: string;
  accent?: string;
  total?: number;
}> = ({ title, tagline, accent = "#e08a5f" }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const p = pop(frame, fps, 4, 16);
  const scale = interpolate(p, [0, 1], [0.86, 1]);
  const tagOp = interpolate(frame, [26, 44], [0, 1], clamp);

  // a shine sweep across the title once
  const shineX = interpolate(frame, [20, 55], [-width * 0.5, width * 0.5], clamp);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div style={{ textAlign: "center", opacity: p, transform: `scale(${scale})`, position: "relative" }}>
        <div style={{ position: "relative", display: "inline-block", overflow: "hidden" }}>
          <div style={{ color: "#f7f3ec", fontSize: 150, fontWeight: 800, letterSpacing: "-0.04em" }}>
            {title}
          </div>
          {/* shine */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: shineX,
              width: 160,
              height: "100%",
              background: "linear-gradient(105deg, transparent, rgba(255,255,255,0.55), transparent)",
              filter: "blur(6px)",
            }}
          />
        </div>
        {tagline && (
          <div style={{ opacity: tagOp, marginTop: 26, color: "#837c6e", fontSize: 34, fontFamily: "monospace", letterSpacing: "0.14em" }}>
            {tagline}
          </div>
        )}
        <div
          style={{
            opacity: tagOp,
            margin: "34px auto 0",
            width: interpolate(frame, [30, 60], [0, 260], clamp),
            height: 3,
            background: accent,
            borderRadius: 2,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
