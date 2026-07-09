import { getComposition } from "@/harness/composition/store";
import { totalFrames } from "@/harness/composition/mutations";
import { isValidProjectId } from "@/lib/project-id";
import { PALETTES, DEFAULT_PALETTE } from "@/remotion/palettes";

export const maxDuration = 120;

/**
 * Export the current composition to an mp4 via Remotion SSR.
 * Renderer deps are heavy + node-only, so they're imported lazily inside
 * the handler (keeps them out of the edge/client graph).
 */
export async function POST(req: Request) {
  const { projectId, paletteId } = await req.json();

  // `projectId` becomes a filename below — validate against the same tight
  // format the rest of the app uses so it can't escape the exports dir.
  if (typeof projectId !== "string" || !isValidProjectId(projectId)) {
    return Response.json({ error: "Invalid projectId" }, { status: 400 });
  }

  const composition = getComposition(projectId);
  const palette = PALETTES.find((p) => p.id === paletteId) ?? DEFAULT_PALETTE;

  if (composition.clips.length === 0) {
    return Response.json({ error: "Nothing to render yet." }, { status: 400 });
  }

  const { bundle } = await import("@remotion/bundler");
  const { renderMedia, selectComposition } = await import("@remotion/renderer");
  const path = await import("path");

  const serveUrl = await bundle({
    entryPoint: path.resolve(process.cwd(), "src/remotion/index.ts"),
    webpackOverride: (c) => c,
  });

  const inputProps = { composition, palette };
  const comp = await selectComposition({ serveUrl, id: "VibeFrames", inputProps });

  const outDir = path.resolve(process.cwd(), "public/exports");
  const file = `${projectId}-${totalFrames(composition)}.mp4`;
  const outputLocation = path.resolve(outDir, file);

  // Defence in depth: even with a validated id, ensure the resolved path
  // never escapes the exports directory.
  if (outputLocation !== path.join(outDir, file) || !outputLocation.startsWith(outDir + path.sep)) {
    return Response.json({ error: "Invalid output path" }, { status: 400 });
  }

  await renderMedia({
    composition: comp,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps,
  });

  return Response.json({ url: `/exports/${file}` });
}
