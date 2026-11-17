import { staticFile } from "remotion";
let ready: Promise<void> | undefined;
/** Explicitly load a bundled font: a minimal rendering container may have no system fonts. */
export function loadFilmFont() {
  ready ||= new FontFace("VibeSans", `url("${staticFile("fonts/geist-latin.woff2")}")`, {
    weight: "100 900",
    style: "normal",
  })
    .load()
    .then((font) => {
      document.fonts.add(font);
      return document.fonts.load("500 32px VibeSans").then(() => undefined);
    })
    .catch((error) => {
      ready = undefined;
      throw error;
    });
  return ready;
}
