import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * A browser window mockup that floats up with a subtle 3D tilt, showing a
 * headline "screen" with a fake UI. For product / app / launch videos.
 */
export const DeviceMockup: React.FC<{
  url?: string;
  screenTitle?: string;
  screenSub?: string;
  accent?: string;
  total?: number;
}> = ({ url = "yourapp.com", screenTitle = "", screenSub, accent = "#e8894a", total = 120 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p = spring({ frame, fps, config: { damping: 200 } });
  const y = interpolate(p, [0, 1], [80, 0]);
  const scale = interpolate(p, [0, 1], [0.9, 1]);
  const tilt = interpolate(frame, [0, total], [3, -3]);
  const exit = interpolate(frame, [total - 16, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleP = spring({ frame: frame - 16, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 1800, opacity: exit }}>
      <div
        style={{
          opacity: p,
          transform: `translateY(${y}px) scale(${scale}) rotateX(${tilt}deg)`,
          width: 1200,
          height: 680,
          borderRadius: 20,
          overflow: "hidden",
          background: "#0f0e12",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: `0 60px 140px -30px rgba(0,0,0,0.8), 0 0 80px -20px ${accent}44`,
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        {/* browser chrome */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ width: 12, height: 12, borderRadius: 99, background: "#f2564f" }} />
          <span style={{ width: 12, height: 12, borderRadius: 99, background: "#f5b64a" }} />
          <span style={{ width: 12, height: 12, borderRadius: 99, background: "#5fc04a" }} />
          <div style={{ marginLeft: 20, flex: 1, maxWidth: 420, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 14px", color: "#837c6e", fontFamily: "monospace", fontSize: 15 }}>
            {url}
          </div>
        </div>
        {/* screen content */}
        <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 20, padding: 60, textAlign: "center" }}>
          <div style={{ opacity: titleP, transform: `translateY(${interpolate(titleP, [0, 1], [16, 0])}px)`, color: "#f5f1ea", fontSize: 68, fontWeight: 800, letterSpacing: "-0.03em" }}>
            {screenTitle}
          </div>
          {screenSub && (
            <div style={{ opacity: interpolate(frame, [30, 46], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), color: "#a5a09a", fontSize: 28 }}>
              {screenSub}
            </div>
          )}
          <div style={{ marginTop: 14, opacity: interpolate(frame, [40, 56], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), padding: "14px 32px", borderRadius: 12, background: accent, color: "#1a0f08", fontSize: 22, fontWeight: 700 }}>
            Get started
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
