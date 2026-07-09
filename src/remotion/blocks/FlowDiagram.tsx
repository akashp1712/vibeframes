import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * A horizontal flow diagram: labelled nodes connected by paths that draw
 * themselves in, with a pulse of light flowing along each connector once drawn.
 * Delba-style — nodes pop, lines animate, energy flows. Great for pipelines /
 * "how it works" / architecture.
 */
export const FlowDiagram: React.FC<{
  heading?: string;
  nodes?: string[];
  accent?: string;
  total?: number;
}> = ({ heading, nodes, accent = "#e8894a", total = 130 }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const items = Array.isArray(nodes) && nodes.length ? nodes.slice(0, 5) : [];
  const n = items.length;

  const exit = interpolate(frame, [total - 16, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headP = spring({ frame, fps, config: { damping: 200 } });

  // Layout: evenly spaced node centers across a working width.
  const W = 1500;
  const left = (width - W) / 2;
  const gap = n > 1 ? W / (n - 1) : 0;
  const cy = 560;
  const nodeW = 210;
  const nodeH = 120;

  return (
    <AbsoluteFill style={{ opacity: exit, fontFamily: "Helvetica, Arial, sans-serif" }}>
      {heading && (
        <div
          style={{
            position: "absolute",
            top: 200,
            width: "100%",
            textAlign: "center",
            opacity: headP,
            color: accent,
            fontFamily: "monospace",
            fontSize: 34,
            letterSpacing: "0.04em",
          }}
        >
          {heading}
        </div>
      )}

      {/* connectors (SVG under the nodes) */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {items.slice(0, -1).map((_, i) => {
          const x1 = left + gap * i + nodeW / 2;
          const x2 = left + gap * (i + 1) - nodeW / 2;
          const len = x2 - x1;
          // each connector draws after its left node appears
          const drawStart = 16 + i * 16 + 10;
          const draw = interpolate(frame, [drawStart, drawStart + 14], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          // a light pulse travels along once drawn
          const pulseStart = drawStart + 14;
          const pulseT = interpolate(frame, [pulseStart, pulseStart + 22], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const px = x1 + len * pulseT;
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={cy}
                x2={x2}
                y2={cy}
                stroke="rgba(255,255,255,0.16)"
                strokeWidth={2}
                strokeDasharray={len}
                strokeDashoffset={len * (1 - draw)}
              />
              {pulseT > 0 && pulseT < 1 && (
                <circle cx={px} cy={cy} r={6} fill={accent} opacity={0.9}>
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* nodes */}
      {items.map((label, i) => {
        const delay = 12 + i * 16;
        const p = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.7 } });
        const scale = interpolate(p, [0, 1], [0.7, 1]);
        const x = left + gap * i;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - nodeW / 2,
              top: cy - nodeH / 2,
              width: nodeW,
              height: nodeH,
              opacity: p,
              transform: `scale(${scale})`,
              display: "grid",
              placeItems: "center",
              padding: "0 18px",
              textAlign: "center",
              borderRadius: 18,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${accent}66`,
              boxShadow: `0 0 40px -12px ${accent}`,
              color: "#f5f1ea",
              fontSize: 30,
              fontWeight: 600,
              lineHeight: 1.15,
            }}
          >
            {label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
