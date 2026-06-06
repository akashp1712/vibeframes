"use client";

import type { ClipInfo } from "@/harness/use-composition";
import { cn } from "@/lib/utils";

interface TimelineStripProps {
  clips: ClipInfo[];
  totalDuration: number;
  /** Current playhead position in seconds, synced from the iframe. */
  playheadSec?: number;
}

const TRACK_PALETTE = [
  "border-orange-500/40 bg-orange-500/10",
  "border-violet-500/40 bg-violet-500/10",
  "border-green-500/40 bg-green-500/10",
  "border-amber-500/40 bg-amber-500/10",
  "border-rose-500/40 bg-rose-500/10",
];

export function TimelineStrip({ clips, totalDuration, playheadSec = 0 }: TimelineStripProps) {
  if (!clips.length || totalDuration === 0) return null;

  // Clamp the playhead into [0, totalDuration] before converting to a %.
  const playheadPct = Math.max(0, Math.min(1, playheadSec / totalDuration)) * 100;

  // Group clips by track index.
  const byTrack = new Map<number, ClipInfo[]>();
  for (const clip of clips) {
    const list = byTrack.get(clip.trackIndex) ?? [];
    list.push(clip);
    byTrack.set(clip.trackIndex, list);
  }
  const trackIndices = Array.from(byTrack.keys()).sort((a, b) => a - b);

  // Time markers — 0s, mid, end (rounded)
  const markers = [
    0,
    Math.round(totalDuration / 2),
    Math.round(totalDuration),
  ];

  return (
    <div className="flex shrink-0 flex-col border-t border-border bg-card/40">
      {/* Header */}
      <div className="flex h-7 items-center justify-between border-b border-border bg-background px-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Composition Timeline
        </span>
        <div className="flex items-center gap-4">
          {markers.map((s) => (
            <span key={s} className="font-mono text-[10px] text-muted-foreground">
              {s}s
            </span>
          ))}
        </div>
      </div>

      {/* Tracks — the playhead is a single absolute line spanning all rows. */}
      <div className="relative flex flex-col gap-1.5 p-3">
        {trackIndices.map((trackIdx) => (
          <div key={trackIdx} className="flex items-center gap-2">
            <span className="w-10 shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
              T{trackIdx}
            </span>
            <div className="relative h-7 flex-1 rounded-sm bg-muted/30">
              {byTrack.get(trackIdx)!.map((clip) => {
                const leftPct = (clip.start / totalDuration) * 100;
                const widthPct = (clip.duration / totalDuration) * 100;
                const palette = TRACK_PALETTE[trackIdx % TRACK_PALETTE.length];
                return (
                  <div
                    key={clip.id}
                    className={cn(
                      "absolute top-0 flex h-full items-center overflow-hidden rounded-sm border px-2 shadow-sm transition hover:brightness-110",
                      palette,
                    )}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    title={`${clip.id} · ${clip.duration}s`}
                  >
                    <span className="truncate font-mono text-[10px] font-medium text-foreground/80">
                      {clip.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Playhead cursor: vertical line synced with the iframe's GSAP
            timeline via postMessage. Offset by the T-label gutter so 0%
            lines up with the start of the clip lanes. */}
        <div
          data-testid="timeline-playhead"
          aria-hidden
          className="pointer-events-none absolute bottom-3 top-3 w-px bg-primary/80 shadow-[0_0_6px_var(--color-primary)]"
          style={{
            // Lane starts after a 48px gutter (w-10 label + gap-2). Position
            // the cursor proportionally within the remaining width.
            left: `calc(48px + (100% - 48px) * ${playheadPct} / 100)`,
          }}
        >
          <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
        </div>
      </div>
    </div>
  );
}
