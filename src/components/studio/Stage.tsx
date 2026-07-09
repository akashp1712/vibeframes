"use client";

import { Player } from "@remotion/player";
import { VibeVideo } from "@/remotion/VibeVideo";
import type { Composition } from "@/harness/composition/schema";
import type { Palette } from "@/remotion/palettes";

/** The main screen: a framed 16:9 stage with a refined Player experience. */
export function Stage({
  composition,
  frames,
  busy,
  palette,
}: {
  composition: Composition;
  frames: number;
  busy: boolean;
  palette: Palette;
}) {
  const hasVideo = composition.clips.length > 0;
  const seconds = (Math.max(1, frames) / composition.fps).toFixed(1);

  return (
    <div className="studio-stage-inner">
      <div className="studio-screen">
        {hasVideo ? (
          <>
            <Player
              component={VibeVideo}
              inputProps={{ composition, palette }}
              durationInFrames={Math.max(1, frames)}
              fps={composition.fps}
              compositionWidth={composition.width}
              compositionHeight={composition.height}
              style={{ width: "100%", height: "100%" }}
              controls
              autoPlay
              loop
              clickToPlay
              doubleClickToFullscreen
              spaceKeyToPlayOrPause
              allowFullscreen
              showVolumeControls={false}
              hideControlsWhenPointerDoesntMove
              renderLoading={() => (
                <div className="studio-screen-empty">
                  <div className="studio-reel"><span /><span /><span /><span /><span /></div>
                  loading preview
                </div>
              )}
            />
            <div className="studio-screen-badge">{seconds}s · {composition.clips.length} scenes</div>
          </>
        ) : (
          <div className="studio-screen-empty">
            <div className="studio-reel"><span /><span /><span /><span /><span /></div>
            {busy ? "directing your video" : "your video will play here"}
          </div>
        )}
      </div>
    </div>
  );
}
