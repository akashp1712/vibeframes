import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * A living, atmospheric background: aurora gradient bands that sweep, a slow
 * rotating light beam, drifting + twinkling particles, a parallax dot grid,
 * and depth vignette. Everything is a deterministic function of `frame`.
 */
export const Backdrop: React.FC<{ hue?: number }> = ({ hue = 24 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // two big glows drift on slow sine paths
  const gx1 = width * 0.32 + Math.sin(frame / 90) * 200;
  const gy1 = height * 0.34 + Math.cos(frame / 110) * 150;
  const gx2 = width * 0.7 + Math.cos(frame / 130) * 180;
  const gy2 = height * 0.68 + Math.sin(frame / 100) * 130;

  // aurora bands sweep horizontally at different speeds
  const band1 = ((frame * 0.6) % (width + 800)) - 400;
  const band2 = ((frame * -0.4 + 600) % (width + 800)) - 400;

  // a slow rotating conic beam
  const beam = (frame * 0.25) % 360;

  const gridShift = (frame * 0.4) % 64;

  // deterministic particles — seeded by index, no Math.random
  const particles = Array.from({ length: 44 }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const rnd = seed / 233280;
    const rnd2 = ((i * 4013 + 12345) % 233280) / 233280;
    const baseX = rnd * width;
    const baseY = rnd2 * height;
    // slow upward drift + gentle horizontal sway, wrapping vertically
    const y = (baseY - frame * (0.25 + rnd * 0.5) + height * 3) % height;
    const x = baseX + Math.sin(frame / (40 + rnd * 60) + i) * 24;
    const twinkle = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(frame / (18 + rnd * 20) + i * 2));
    const size = 1.5 + rnd * 2.5;
    return { x, y, size, twinkle, key: i };
  });

  return (
    <AbsoluteFill style={{ background: "#060608", overflow: "hidden" }}>
      {/* aurora bands */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(1200px 500px at ${band1}px ${height * 0.28}px, hsla(${hue}, 80%, 55%, 0.14), transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(1000px 460px at ${band2}px ${height * 0.72}px, hsla(${hue + 190}, 60%, 50%, 0.1), transparent 70%)`,
          filter: "blur(50px)",
        }}
      />

      {/* rotating conic beam — very subtle */}
      <AbsoluteFill
        style={{
          background: `conic-gradient(from ${beam}deg at 50% 45%, transparent 0deg, hsla(${hue}, 70%, 60%, 0.05) 40deg, transparent 90deg, transparent 360deg)`,
          filter: "blur(30px)",
        }}
      />

      {/* parallax dot grid, masked to center */}
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(236,231,221,0.05) 1.5px, transparent 1.5px)",
          backgroundSize: "64px 64px",
          backgroundPosition: `${-gridShift}px ${-gridShift}px`,
          maskImage: "radial-gradient(ellipse at center, black 25%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 25%, transparent 80%)",
        }}
      />

      {/* two focal glows for depth */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(620px circle at ${gx1}px ${gy1}px, hsla(${hue}, 75%, 58%, 0.2), transparent 60%)`,
          filter: "blur(14px)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(540px circle at ${gx2}px ${gy2}px, hsla(${hue + 180}, 45%, 48%, 0.12), transparent 60%)`,
          filter: "blur(18px)",
        }}
      />

      {/* floating particles */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {particles.map((p) => (
          <circle
            key={p.key}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill={`hsla(${hue}, 60%, 75%, ${p.twinkle})`}
          />
        ))}
      </svg>

      {/* depth vignette */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
