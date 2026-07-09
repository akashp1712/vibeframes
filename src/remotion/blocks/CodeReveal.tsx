import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * A code card that scales in, then types its lines out character-by-character
 * with a blinking cursor and window chrome. For dev/technical videos.
 */
export const CodeReveal: React.FC<{
  filename?: string;
  lines?: string[];
  accent?: string;
  total?: number;
}> = ({ filename = "example.ts", lines, accent = "#e08a5f", total = 130 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const code = Array.isArray(lines) && lines.length ? lines : ["// …"];

  const cardP = spring({ frame, fps, config: { damping: 200 } });
  const scale = interpolate(cardP, [0, 1], [0.94, 1]);
  const exit = interpolate(frame, [total - 16, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Type across all lines between frame 14 and total-24.
  const totalChars = code.reduce((n, l) => n + l.length, 0);
  const typed = Math.floor(
    interpolate(frame, [14, total - 24], [0, totalChars], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const shownLines: string[] = [];
  let remaining = typed;
  for (const l of code) {
    if (remaining <= 0) {
      shownLines.push("");
    } else {
      shownLines.push(l.slice(0, remaining));
      remaining -= l.length;
    }
  }
  const done = typed >= totalChars;
  const cursorOn = !done && Math.floor(frame / 8) % 2 === 0;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: exit }}>
      <div
        style={{
          opacity: cardP,
          transform: `scale(${scale})`,
          width: 1100,
          background: "linear-gradient(180deg, #15130e, #100e0a)",
          border: `1px solid rgba(232,137,74,0.25)`,
          borderRadius: 18,
          boxShadow: "0 50px 130px rgba(0,0,0,0.6)",
          fontFamily: "monospace",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Dot c="#f2564f" /><Dot c="#f5b64a" /><Dot c="#5fc04a" />
          <span style={{ marginLeft: 14, color: "#837c6e", fontSize: 20 }}>{filename}</span>
        </div>
        <div style={{ padding: "26px 34px", minHeight: 220 }}>
          {shownLines.map((l, i) => (
            <div key={i} style={{ color: "#cfc8ba", fontSize: 34, lineHeight: 1.75, whiteSpace: "pre" }}>
              {l}
              {cursorOn && i === lastNonEmpty(shownLines) && (
                <span style={{ color: accent }}>▌</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Dot: React.FC<{ c: string }> = ({ c }) => (
  <span style={{ width: 13, height: 13, borderRadius: 99, background: c, display: "inline-block" }} />
);

function lastNonEmpty(lines: string[]): number {
  for (let i = lines.length - 1; i >= 0; i--) if (lines[i].length) return i;
  return 0;
}
