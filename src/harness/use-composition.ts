"use client";

import { useMemo } from "react";
import type { ChatMessage } from "./use-harness-chat";

export interface ClipInfo {
  id: string;
  trackIndex: number;
  start: number;    // seconds
  duration: number; // seconds
  label: string;    // short text excerpt for the timeline bar
}

interface CompositionState {
  html: string | null;
  clipCount: number;
  trackCount: number;
  clips: ClipInfo[];
  totalDuration: number;
}

const CLIP_REGEX = /<div\s+data-clip-id="([^"]+)"[^>]*data-start="([\d.]+)"[^>]*data-duration="([\d.]+)"[^>]*data-track-index="(\d+)"[^>]*>([\s\S]*?)<\/div>\s*(?=<div\s+data-clip-id|<\/div>\s*$)/g;

function parseClips(html: string): ClipInfo[] {
  // Simple regex parse — the HTML we get is structured + machine-generated.
  const clips: ClipInfo[] = [];
  // Use a DOMParser-style scan if available; fall back to regex.
  if (typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(`<root>${html}</root>`, "text/html");
      const nodes = doc.querySelectorAll("[data-clip-id]");
      nodes.forEach((node) => {
        const el = node as HTMLElement;
        const id = el.getAttribute("data-clip-id") ?? "";
        const start = parseFloat(el.getAttribute("data-start") ?? "0");
        const duration = parseFloat(el.getAttribute("data-duration") ?? "0");
        const trackIndex = parseInt(el.getAttribute("data-track-index") ?? "0", 10);
        const text = (el.textContent ?? "").trim().slice(0, 24);
        clips.push({ id, start, duration, trackIndex, label: text || id });
      });
      return clips;
    } catch {
      // fall through
    }
  }
  // Fallback regex
  let match: RegExpExecArray | null;
  CLIP_REGEX.lastIndex = 0;
  while ((match = CLIP_REGEX.exec(html))) {
    clips.push({
      id: match[1],
      start: parseFloat(match[2]),
      duration: parseFloat(match[3]),
      trackIndex: parseInt(match[4], 10),
      label: match[1],
    });
  }
  return clips;
}

export function useComposition(messages: ChatMessage[]): CompositionState {
  return useMemo(() => {
    let latestHtml: string | null = null;
    let clipCount = 0;
    let trackCount = 0;

    for (const message of messages) {
      if (message.role !== "assistant" || !message.tools) continue;

      for (const tool of message.tools) {
        if (tool.state !== "result" || !tool.result) continue;

        const result = tool.result as Record<string, unknown>;
        if (typeof result.compositionHtml === "string") {
          latestHtml = result.compositionHtml;
        }
        if (typeof result.clipCount === "number") {
          clipCount = result.clipCount;
        }
        if (typeof result.trackCount === "number") {
          trackCount = result.trackCount;
        }
      }
    }

    const clips = latestHtml ? parseClips(latestHtml) : [];
    const totalDuration = clips.reduce((max, c) => Math.max(max, c.start + c.duration), 0);

    return { html: latestHtml, clipCount, trackCount, clips, totalDuration };
  }, [messages]);
}
