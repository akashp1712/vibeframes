import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../anim";

/** Timeline-style progress indicator for a process or milestone. */
export const ProgressTrack: React.FC<{
  heading?: string;
  label?: string;
  value?: number;
  accent?: string;
  total?: number;
}> = ({ heading = "In progress", label = "", value = 100, accent = "#e08a5f", total = 90 }) => {
  const frame = useCurrentFrame();
  const target = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const progress = interpolate(frame, [8, Math.max(30, total - 20)], [0, target], clamp);
  const exit = interpolate(frame, [Math.max(30, total - 14), total], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 180px", fontFamily: "Helvetica, Arial, sans-serif", opacity: exit }}>
      <div style={{ width: "100%", maxWidth: 1400 }}>
        <div style={{ fontSize: 90, color: "#f7f3ec", fontWeight: 750, marginBottom: 65 }}>{heading}</div>
        <div style={{ height: 24, borderRadius: 20, background: "#f7f3ec33", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: accent, borderRadius: 20, boxShadow: `0 0 28px ${accent}` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, color: accent, fontSize: 31, fontFamily: "monospace" }}>
          <span>{label}</span><span>{Math.round(progress)}%</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
