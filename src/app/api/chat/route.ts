import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, model: modelId } = await req.json();

  const model = openai(modelId || process.env.VIBEFRAMES_MODEL || "gpt-4o-mini");

  const result = streamText({
    model,
    system: `You are VibeFrames, a video composition assistant. You help users create video compositions using HyperFrames — an HTML-native video rendering framework. You can reason about video structure, suggest scenes, transitions, and animations. Be concise and creative.`,
    messages,
  });

  return result.toDataStreamResponse();
}
