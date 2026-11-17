import React from "react";
import { Composition, registerRoot } from "remotion";
import { FeatureFilm } from "./FeatureFilm";
import { DEMO_FILM, DIMENSIONS, filmDuration } from "./schema";
function FilmRoot() {
  return <Composition id="WorkflowFilm" component={FeatureFilm} defaultProps={{ film: DEMO_FILM }} durationInFrames={filmDuration(DEMO_FILM)} fps={30} width={1920} height={1080} calculateMetadata={({ props }) => ({ ...DIMENSIONS[props.film.frame], durationInFrames: filmDuration(props.film) })} />;
}
registerRoot(FilmRoot);
