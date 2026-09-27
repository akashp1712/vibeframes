import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../anim";

/** A compact identity card for an interview, product demo, or chapter change. */
export const LowerThird: React.FC<{
  title?: string;
  label?: string;
  accent?: string;
  total?: number;
}> = ({ title = "Untitled", label = "", accent = "#e08a5f", total = 90 }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [4, 20], [0, 1], clamp);
  const exit = interpolate(frame, [Math.max(20, total - 18), total], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 130px 140px", fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "stretch", maxWidth: 1050, opacity: Math.min(enter, exit), transform: `translateX(${(1 - enter) * -100}px)` }}>
        <div style={{ background: accent, width: 10, flexShrink: 0 }} />
        <div style={{ padding: "30px 48px", background: "#171a22e8", borderRadius: "0 20px 20px 0" }}>
          {label && <div style={{ color: accent, fontSize: 24, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 12 }}>{label}</div>}
          <div style={{ color: "#f7f3ec", fontSize: 68, fontWeight: 750, lineHeight: 1.1 }}>{title}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
