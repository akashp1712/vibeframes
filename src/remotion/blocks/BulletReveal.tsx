import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

/**
 * Rich point reveal: each item is a card with a glowing numbered badge that
 * springs + slides in, staggered. Not a flat dash list — designed rows.
 */
export const BulletReveal: React.FC<{
  heading?: string;
  bullets?: string[];
  accent?: string;
  total?: number;
}> = ({ heading, bullets, accent = "#e08a5f", total = 110 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = Array.isArray(bullets) ? bullets : [];

  const headP = spring({ frame, fps, config: { damping: 200 } });
  const headY = interpolate(headP, [0, 1], [20, 0]);
  const exit = interpolate(frame, [total - 16, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: "0 160px",
        fontFamily: "Helvetica, Arial, sans-serif",
        opacity: exit,
      }}
    >
      {heading && (
        <h2
          style={{
            opacity: headP,
            transform: `translateY(${headY}px)`,
            color: accent,
            fontFamily: "monospace",
            fontSize: 34,
            letterSpacing: "0.04em",
            marginBottom: 44,
          }}
        >
          {heading}
        </h2>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {items.map((b, i) => {
          const delay = 10 + i * 9;
          const p = spring({ frame: frame - delay, fps, config: { damping: 180, mass: 0.7 } });
          const x = interpolate(p, [0, 1], [50, 0]);
          return (
            <div
              key={i}
              style={{
                opacity: p,
                transform: `translateX(${x}px)`,
                display: "flex",
                alignItems: "center",
                gap: 28,
                padding: "20px 28px",
                borderRadius: 18,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "monospace",
                  fontSize: 26,
                  fontWeight: 700,
                  color: accent,
                  background: "rgba(232,137,74,0.12)",
                  border: `1px solid rgba(232,137,74,0.4)`,
                  boxShadow: `0 0 24px -6px ${accent}`,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ color: "#f5f1ea", fontSize: 46, fontWeight: 500, letterSpacing: "-0.01em" }}>
                {b}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
