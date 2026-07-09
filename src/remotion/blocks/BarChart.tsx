import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * Animated bar chart: bars spring up from zero, staggered, with value labels
 * that count up. Great for "X vs Y" or growth comparisons.
 */
export const BarChart: React.FC<{
  heading?: string;
  bars?: { label: string; value: number }[];
  accent?: string;
  total?: number;
}> = ({ heading, bars, accent = "#e08a5f", total = 110 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const data = Array.isArray(bars) && bars.length ? bars : [];
  const max = Math.max(1, ...data.map((b) => b.value));

  const headP = spring({ frame, fps, config: { damping: 200 } });
  const exit = interpolate(frame, [total - 16, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Helvetica, Arial, sans-serif",
        opacity: exit,
      }}
    >
      {heading && (
        <h2
          style={{
            opacity: headP,
            color: accent,
            fontFamily: "monospace",
            fontSize: 34,
            marginBottom: 56,
            letterSpacing: "0.04em",
          }}
        >
          {heading}
        </h2>
      )}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 40, height: 420 }}>
        {data.map((b, i) => {
          const delay = 12 + i * 8;
          const p = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.9 } });
          const h = interpolate(p, [0, 1], [0, (b.value / max) * 380]);
          const shown = Math.round(interpolate(p, [0, 1], [0, b.value]));
          const isPeak = b.value === max;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <span style={{ color: isPeak ? accent : "#f5f1ea", fontSize: 34, fontWeight: 700, fontFamily: "monospace" }}>
                {shown}
              </span>
              <div
                style={{
                  width: 96,
                  height: h,
                  borderRadius: "10px 10px 0 0",
                  background: isPeak
                    ? `linear-gradient(180deg, ${accent}, #b5532b)`
                    : "rgba(255,255,255,0.14)",
                  boxShadow: isPeak ? `0 0 40px -8px ${accent}` : "none",
                }}
              />
              <span style={{ color: "#a5a09a", fontSize: 22, opacity: p }}>{b.label}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
