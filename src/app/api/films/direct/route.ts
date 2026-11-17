import { z } from "zod";
import { BriefSchema } from "@/features/films/schema";
import { TraceSchema, importTrace } from "@/features/films/trace";
import { directFilm } from "@/features/films/director";
export const runtime = "nodejs";
export const maxDuration = 120;
const Input = z.object({ brief: BriefSchema, trace: TraceSchema, quality: z.enum(["balanced", "quality"]), reviewed: z.literal(true) });
// Single-user preview/local mode. A shared paid deployment must add durable auth + quotas.
export async function GET() { return Response.json({ available: Boolean(process.env.OPENAI_API_KEY) && (!process.env.VERCEL || process.env.VIBEFRAMES_PRIVATE_PREVIEW === "true") }); }
export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "AI direction is not connected. You can still compose, edit, and export a film without AI." }, { status: 503 });
  if (process.env.VERCEL && process.env.VIBEFRAMES_PRIVATE_PREVIEW !== "true") return Response.json({ error: "AI direction is disabled on this deployment until private access and usage limits are configured." }, { status: 503 });
  const origin = req.headers.get("origin");
  const previewOrigin = process.env.VIBEFRAMES_DEV_ORIGIN ? `https://${process.env.VIBEFRAMES_DEV_ORIGIN}` : null;
  if (origin && origin !== new URL(req.url).origin && origin !== previewOrigin) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const raw = await req.text();
  if (raw.length > 20000) return Response.json({ error: "Brief is too large" }, { status: 413 });
  let parsed;
  try { parsed = Input.safeParse(JSON.parse(raw)); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!parsed.success) return Response.json({ error: "Review the brief and source events before using AI direction." }, { status: 400 });
  try {
    const result = await directFilm(parsed.data.brief, importTrace(parsed.data.trace), parsed.data.quality, AbortSignal.any([req.signal, AbortSignal.timeout(105000)]));
    return Response.json(result);
  } catch { return Response.json({ error: "The director could not finish this cut. Your draft is safe; retry or use Compose film." }, { status: 502 }); }
}
