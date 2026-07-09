import type { Composition } from "@/harness/composition/schema";

/** A proportional filmstrip of the composition's clips, under the stage. */
export function Timeline({ composition }: { composition: Composition }) {
  const total = composition.clips.reduce(
    (max, c) => Math.max(max, c.from + c.durationInFrames),
    0,
  );

  if (composition.clips.length === 0) {
    return (
      <div className="studio-timeline">
        <span className="studio-timeline-empty">— timeline —</span>
      </div>
    );
  }

  return (
    <div className="studio-timeline">
      {composition.clips.map((clip) => (
        <div
          key={clip.id}
          className="studio-clip-cell"
          style={{ flex: total ? clip.durationInFrames / total : 1 }}
          title={`${clip.block} · ${(clip.durationInFrames / composition.fps).toFixed(1)}s`}
        >
          {clip.block}
        </div>
      ))}
    </div>
  );
}
