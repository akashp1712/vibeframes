"use client";

import type { ClipInfo } from "@/harness/use-composition";
import { cn } from "@/lib/utils";

interface TimelineStripProps {
  clips: ClipInfo[];
  totalDuration: number;
}

const TRACK_PALETTE = [
  "border-orange-500/40 bg-orange-500/10",
  "border-violet-500/40 bg-violet-500/10",
  "border-green-500/40 bg-green-500/10",
  "border-amber-500/40 bg-amber-500/10",
  "border-rose-500/40 bg-rose-500/10",
];

export function TimelineStrip({ clips, totalDuration }: TimelineStripProps) {
  if (!clips.length || totalDuration === 0) return null;

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

      {/* Tracks */}
      <div className="flex flex-col gap-1.5 p-3">
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
      </div>
    </div>
  );
}
