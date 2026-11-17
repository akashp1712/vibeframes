import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { FilmSchema } from "@/features/films/schema";
export const runtime = "nodejs";
export const maxDuration = 300;
let rendering = false;
let bundled: Promise<string> | undefined;

/** Native fallback for local/self-hosted installations. Serverless uses WebCodecs or CLI. */
export async function POST(req: Request) {
  if (process.env.VERCEL)
    return Response.json(
      {
        error:
          "This browser cannot render video. Download the project and run pnpm render:film for an MP4, or use a browser with WebGL and WebCodecs enabled.",
      },
      { status: 503 },
    );
  const origin = req.headers.get("origin");
  const previewOrigin = process.env.VIBEFRAMES_DEV_ORIGIN
    ? `https://${process.env.VIBEFRAMES_DEV_ORIGIN}`
    : null;
  if (origin && origin !== new URL(req.url).origin && origin !== previewOrigin)
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  if (rendering)
    return Response.json(
      { error: "Another film is rendering. Please retry shortly." },
      { status: 429 },
    );
  const raw = await req.text();
  if (raw.length > 10000000) return Response.json({ error: "Project too large" }, { status: 413 });
  let film;
  try {
    film = FilmSchema.parse(JSON.parse(raw));
  } catch {
    return Response.json({ error: "Invalid film project" }, { status: 400 });
  }
  if (!film.reviewed)
    return Response.json({ error: "Review the source and scene copy first" }, { status: 400 });
  rendering = true;
  let directory: string | undefined;
  try {
    directory = await mkdtemp(join(tmpdir(), "vf-film-"));
    bundled ||= bundle({
      entryPoint: resolve("src/features/films/remotion-entry.tsx"),
      enableCaching: false,
    }).catch((error) => {
      bundled = undefined;
      throw error;
    });
    const serveUrl = await bundled;
    const inputProps = { film };
    const composition = await selectComposition({ serveUrl, id: "WorkflowFilm", inputProps });
    const outputLocation = join(directory, "film.mp4");
    await renderMedia({
      serveUrl,
      composition,
      inputProps,
      codec: "h264",
      outputLocation,
      concurrency: 2,
    });
    return new Response(await readFile(outputLocation), {
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": "no-store",
        "Content-Disposition": 'attachment; filename="workflow-film.mp4"',
      },
    });
  } catch {
    return Response.json(
      {
        error:
          "Native rendering failed. Install Remotion's Chromium system dependencies or use the CLI renderer.",
      },
      { status: 500 },
    );
  } finally {
    rendering = false;
    if (directory) await rm(directory, { recursive: true, force: true });
  }
}
