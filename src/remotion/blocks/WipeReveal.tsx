import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../anim";

/** A headline disclosed by a sliding accent panel. Deterministic at every frame. */
export const WipeReveal: React.FC<{
  heading?: string;
  label?: string;
  accent?: string;
  total?: number;
}> = ({ heading = "The reveal", label = "", accent = "#e08a5f", total = 90 }) => {
  const frame = useCurrentFrame();
  const open = interpolate(frame, [5, 35], [0, 100], clamp);
  const exit = interpolate(frame, [Math.max(35, total - 16), total], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 170px", fontFamily: "Helvetica, Arial, sans-serif", opacity: exit }}>
      <div style={{ width: "100%", maxWidth: 1400 }}>
        {label && <div style={{ color: accent, fontFamily: "monospace", fontSize: 28, letterSpacing: "0.2em", marginBottom: 30, textTransform: "uppercase" }}>{label}</div>}
        <div style={{ position: "relative", overflow: "hidden", padding: "30px 0" }}>
          <div style={{ color: "#f7f3ec", fontSize: 140, fontWeight: 800, lineHeight: 1.04, letterSpacing: "-0.05em", overflowWrap: "anywhere" }}>{heading}</div>
          <div style={{ position: "absolute", inset: 0, background: accent, transform: `translateX(${open}%)` }} />
        </div>
        <div style={{ height: 6, width: `${open}%`, background: accent, marginTop: 20 }} />
      </div>
    </AbsoluteFill>
  );
};
