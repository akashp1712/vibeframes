import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig, interpolate, staticFile } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";

/**
 * An audio-reactive scene: a title over a live equalizer whose bars pulse to
 * the music's frequency spectrum (via visualizeAudio). Plays the bed track.
 * The whole scene "breathes" with the beat — feels produced, not static.
 */
export const AudioPulse: React.FC<{
  title?: string;
  src?: string;
  accent?: string;
  total?: number;
}> = ({ title = "", src = "audio/bed.m4a", accent = "#e8894a", total = 120 }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const file = staticFile(src);
  const audioData = useAudioData(file);

  const titleOp = interpolate(frame, [8, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exit = interpolate(frame, [total - 16, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const BARS = 48;
  const spectrum = audioData
    ? visualizeAudio({ fps, frame, audioData, numberOfSamples: 64 }).slice(0, BARS)
    : new Array(BARS).fill(0);

  // Overall energy drives a subtle title scale — the "breathe".
  const energy = spectrum.reduce((a, b) => a + b, 0) / BARS;
  const titleScale = 1 + Math.min(0.06, energy * 4);

  const barW = width / BARS;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: "Helvetica, Arial, sans-serif", opacity: exit }}>
      <Audio src={file} />

      {/* equalizer along the bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 320, display: "flex", alignItems: "flex-end", gap: 2 }}>
        {spectrum.map((v, i) => {
          const h = Math.max(4, Math.min(300, v * 1400));
          const lit = v > 0.06;
          return (
            <div
              key={i}
              style={{
                width: barW - 2,
                height: h,
                borderRadius: "4px 4px 0 0",
                background: lit
                  ? `linear-gradient(180deg, ${accent}, ${accent}22)`
                  : "rgba(255,255,255,0.08)",
                boxShadow: lit ? `0 0 20px -6px ${accent}` : "none",
              }}
            />
          );
        })}
      </div>

      {title && (
        <div style={{ opacity: titleOp, transform: `scale(${titleScale})`, color: "#f7f3ec", fontSize: 110, fontWeight: 800, letterSpacing: "-0.03em", textShadow: `0 0 60px ${accent}44` }}>
          {title}
        </div>
      )}
    </AbsoluteFill>
  );
};
