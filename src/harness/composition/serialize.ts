import type { Composition } from "./schema";

export function serialize(composition: Composition): string {
  const clipElements = composition.tracks.flatMap((track, trackIndex) =>
    track.clips.map((clip) => {
      const startSec = clip.startMs / 1000;
      const durationSec = clip.durationMs / 1000;

      return [
        `  <div data-clip-id="${clip.id}" class="clip"`,
        `       data-start="${startSec}" data-duration="${durationSec}"`,
        `       data-track-index="${trackIndex}">`,
        `    ${clip.html}`,
        `  </div>`,
      ].join("\n");
    }),
  );

  return [
    `<div id="root"`,
    `     data-composition-id="${composition.id}"`,
    `     data-width="${composition.width}"`,
    `     data-height="${composition.height}">`,
    "",
    ...clipElements,
    "",
    `</div>`,
  ].join("\n");
}
