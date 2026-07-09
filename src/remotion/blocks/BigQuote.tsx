import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * A large pull-quote that fades up word-agnostic, with an oversized accent
 * quotation mark and an author line that slides in after. For testimonials
 * or a punchy closing thought.
 */
export const BigQuote: React.FC<{
  quote?: string;
  author?: string;
  accent?: string;
  total?: number;
}> = ({ quote = "", author, accent = "#e8894a", total = 110 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p = spring({ frame, fps, config: { damping: 200 } });
  const y = interpolate(p, [0, 1], [30, 0]);
  const authorP = spring({ frame: frame - 22, fps, config: { damping: 200 } });
  const exit = interpolate(frame, [total - 16, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 220px",
        textAlign: "center",
        fontFamily: "Georgia, 'Times New Roman', serif",
        opacity: exit,
      }}
    >
      <div style={{ position: "relative", opacity: p, transform: `translateY(${y}px)` }}>
        <span
          style={{
            position: "absolute",
            top: -80,
            left: -60,
            fontSize: 200,
            lineHeight: 1,
            color: accent,
            opacity: 0.35,
          }}
        >
          &ldquo;
        </span>
        <div style={{ color: "#f7f3ec", fontSize: 72, fontWeight: 500, lineHeight: 1.25, fontStyle: "italic" }}>
          {quote}
        </div>
      </div>
      {author && (
        <div
          style={{
            marginTop: 40,
            opacity: authorP,
            transform: `translateY(${interpolate(authorP, [0, 1], [16, 0])}px)`,
            color: accent,
            fontFamily: "monospace",
            fontSize: 28,
            letterSpacing: "0.04em",
            fontStyle: "normal",
          }}
        >
          — {author}
        </div>
      )}
    </AbsoluteFill>
  );
};
