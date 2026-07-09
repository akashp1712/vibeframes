import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * Two panels slide in from opposite edges and meet at a glowing divider —
 * classic before/after or "us vs them" comparison. The winning side (right)
 * carries the accent.
 */
export const SplitCompare: React.FC<{
  leftLabel?: string;
  leftValue?: string;
  rightLabel?: string;
  rightValue?: string;
  accent?: string;
  total?: number;
}> = ({
  leftLabel = "Before",
  leftValue = "",
  rightLabel = "After",
  rightValue = "",
  accent = "#e8894a",
  total = 110,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p = spring({ frame, fps, config: { damping: 200 } });
  const leftX = interpolate(p, [0, 1], [-120, 0]);
  const rightX = interpolate(p, [0, 1], [120, 0]);
  const dividerH = interpolate(p, [0, 1], [0, 100]);
  const exit = interpolate(frame, [total - 16, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const Panel = (
    label: string,
    value: string,
    x: number,
    win: boolean,
  ) => (
    <div
      style={{
        flex: 1,
        opacity: p,
        transform: `translateX(${x}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: 60,
      }}
    >
      <div style={{ color: win ? accent : "#a5a09a", fontFamily: "monospace", fontSize: 28, letterSpacing: "0.06em" }}>
        {label}
      </div>
      {value && (
        <div
          style={{
            color: win ? "#f7f3ec" : "#8c867d",
            fontSize: win ? 128 : 92,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            textShadow: win ? `0 0 60px ${accent}55` : "none",
          }}
        >
          {value}
        </div>
      )}
    </div>
  );

  return (
    <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", fontFamily: "Helvetica, Arial, sans-serif", opacity: exit }}>
      {Panel(leftLabel, leftValue, leftX, false)}
      <div style={{ width: 2, height: `${dividerH}%`, background: accent, boxShadow: `0 0 30px ${accent}` }} />
      {Panel(rightLabel, rightValue, rightX, true)}
    </AbsoluteFill>
  );
};
