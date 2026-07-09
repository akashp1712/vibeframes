import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { pop, clamp, enterExit } from "../anim";

// A big number that counts up, with a label. The count-up is a pure function of
// frame, so it's deterministic and lands exactly on the target.
export const StatReveal: React.FC<{
  value: number;
  suffix?: string;
  label: string;
  accent?: string;
  total?: number;
}> = ({ value, suffix = "", label, accent = "#e08a5f", total = 80 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ease the count-up
  const t = interpolate(frame, [8, 46], [0, 1], clamp);
  const eased = 1 - Math.pow(1 - t, 3);
  const shown = Math.round(eased * value);

  const p = pop(frame, fps, 6, 16);
  const scale = interpolate(p, [0, 1], [0.7, 1]);
  const exit = interpolate(frame, [total - 16, total], [1, 0], clamp);
  const label_ = enterExit(frame, total, { inStart: 20, inDur: 16, rise: 20 });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div style={{ textAlign: "center", opacity: exit }}>
        <div
          style={{
            opacity: p,
            transform: `scale(${scale})`,
            fontSize: 320,
            fontWeight: 800,
            letterSpacing: "-0.05em",
            lineHeight: 0.9,
            color: "#f7f3ec",
            textShadow: `0 0 60px ${accent}55`,
          }}
        >
          {shown}
          <span style={{ color: accent }}>{suffix}</span>
        </div>
        <div
          style={{
            opacity: label_.opacity,
            transform: `translateY(${label_.y}px)`,
            marginTop: 20,
            color: "#b3ada0",
            fontSize: 40,
            fontFamily: "monospace",
            letterSpacing: "0.1em",
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};
