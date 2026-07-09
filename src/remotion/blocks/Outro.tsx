import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const Outro: React.FC<{ cta: string; note?: string }> = ({ cta, note }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p = spring({ frame, fps, config: { damping: 200 } });
  const scale = interpolate(p, [0, 1], [0.9, 1]);
  const noteOp = interpolate(frame, [18, 32], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "#09090b",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Helvetica, Arial, sans-serif",
      }}
    >
      <div style={{ opacity: p, transform: `scale(${scale})`, textAlign: "center" }}>
        <div style={{ color: "#f5f1ea", fontSize: 96, fontWeight: 700, letterSpacing: "-0.02em" }}>
          {cta}
        </div>
        {note && <div style={{ opacity: noteOp, color: "#837c6e", fontSize: 28, marginTop: 20, fontFamily: "monospace" }}>{note}</div>}
      </div>
    </AbsoluteFill>
  );
};
