import { Composition } from "remotion";
import { VibeVideo } from "./VibeVideo";
import { SAMPLE_COMPOSITION, SAMPLE_FRAMES } from "./sample";

/**
 * The renderable root for Remotion SSR. `durationInFrames` and props are
 * overridden per-render via `inputProps` + `calculateMetadata`, so the
 * exported mp4 always matches the agent's actual composition.
 */
export const RemotionRoot: React.FC = () => (
  <Composition
    id="VibeFrames"
    component={VibeVideo}
    durationInFrames={SAMPLE_FRAMES}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ composition: SAMPLE_COMPOSITION }}
    calculateMetadata={({ props }) => {
      const clips = props.composition?.clips ?? [];
      const frames = clips.reduce(
        (max: number, c: { from: number; durationInFrames: number }) =>
          Math.max(max, c.from + c.durationInFrames),
        0,
      );
      return {
        durationInFrames: Math.max(1, frames),
        fps: props.composition?.fps ?? 30,
        width: props.composition?.width ?? 1920,
        height: props.composition?.height ?? 1080,
      };
    }}
  />
);
