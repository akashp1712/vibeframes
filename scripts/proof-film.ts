import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { DEMO_FILM } from "../src/features/films/schema";

async function main() {
  const serveUrl = await bundle({
    entryPoint: resolve("src/features/films/remotion-entry.tsx"),
    enableCaching: false,
  });
  await mkdir("public/motion-proof", { recursive: true });
  for (const format of ["landscape", "portrait", "square"] as const) {
    const inputProps = { film: { ...DEMO_FILM, frame: format } };
    const composition = await selectComposition({ serveUrl, id: "WorkflowFilm", inputProps });
    for (const frame of [35, 125, 300, 420, 510, 610]) {
      await renderStill({
        serveUrl,
        composition,
        inputProps,
        frame,
        output: resolve(`public/motion-proof/${format}-${frame}.png`),
        scale: 0.5,
      });
    }
    console.log(`Proof frames ready: ${format}`);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
