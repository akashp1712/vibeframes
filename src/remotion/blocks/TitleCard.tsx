import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const TitleCard: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
}> = ({ eyebrow, title, subtitle }) => {
  const frame = useCurrentFrame();

  // Deterministic fade + rise — pure function of the frame, no wall clock.
  const eyebrowOp = interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [10, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [10, 26], [28, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [22, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "#09090b",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Helvetica, Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {eyebrow && (
          <div
            style={{
              opacity: eyebrowOp,
              color: "#e08a5f",
              fontFamily: "monospace",
              fontSize: 22,
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h1
          style={{
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
            color: "#f5f1ea",
            fontSize: 128,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ opacity: subOp, color: "#b3ada0", fontSize: 34, marginTop: 12 }}>
            {subtitle}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};
