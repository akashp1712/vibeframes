import { readFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { FilmSchema, DEMO_FILM } from "../src/features/films/schema";

async function main() {
  const source = process.argv[2];
  const output = resolve(process.argv[3] || "out/workflow-film.mp4");
  const film = FilmSchema.parse(source ? JSON.parse(await readFile(resolve(source), "utf8")) : DEMO_FILM);
  if (source && !film.reviewed) throw new Error("Review the source and scene copy in the studio before rendering this project.");
  await mkdir(dirname(output), { recursive: true });
  const serveUrl = await bundle({ entryPoint: resolve("src/features/films/remotion-entry.tsx"), enableCaching: false });
  const inputProps = { film };
  const composition = await selectComposition({ serveUrl, id: "WorkflowFilm", inputProps });
  await renderMedia({ serveUrl, composition, inputProps, codec: "h264", outputLocation: output, concurrency: 2 });
  console.log(`Rendered ${output}`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Render failed"); process.exitCode = 1; });
