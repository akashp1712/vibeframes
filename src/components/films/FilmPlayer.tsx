"use client";
import { Player, type PlayerRef } from "@remotion/player";
import { FeatureFilm } from "@/features/films/FeatureFilm";
import { DIMENSIONS, filmDuration, type Film } from "@/features/films/schema";
import type { Ref } from "react";
export function FilmPlayer({
  film,
  autoPlay = false,
  playerRef,
}: {
  film: Film;
  autoPlay?: boolean;
  playerRef?: Ref<PlayerRef>;
}) {
  const size = DIMENSIONS[film.frame];
  return (
    <Player
      ref={playerRef}
      component={FeatureFilm}
      inputProps={{ film }}
      durationInFrames={filmDuration(film)}
      compositionWidth={size.width}
      compositionHeight={size.height}
      fps={30}
      initialFrame={35}
      controls
      autoPlay={autoPlay}
      loop
      initiallyMuted
      style={{ width: "100%", height: "100%", aspectRatio: `${size.width}/${size.height}` }}
      acknowledgeRemotionLicense
    />
  );
}
