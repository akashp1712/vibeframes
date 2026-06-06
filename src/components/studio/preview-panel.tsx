"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import { DotPattern } from "@/components/ui/dot-pattern";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { cn } from "@/lib/utils";
import { TimelineStrip } from "./timeline-strip";
import type { ClipInfo } from "@/harness/react/use-composition";

interface PreviewPanelProps {
  html: string | null;
  clips?: ClipInfo[];
  totalDuration?: number;
  /**
   * True while the agent is mid-turn. We freeze the iframe to the last
   * stable composition during this window so the preview doesn't restart
   * playback on every intermediate `add-clip` tool result.
   */
  isLoading?: boolean;
}

function buildSrcDoc(html: string): string {
  return `<!DOCTYPE html>
<html><head>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; }
  /* Light "studio backdrop" — the iframe sits inside the light chat shell
     so a fully-black surround looked jarring. The stage itself stays dark. */
  body {
    background:
      radial-gradient(ellipse at top, #ffffff 0%, #f4f4f5 60%, #e4e4e7 100%);
    overflow: hidden; display: flex; flex-direction: column;
  }
  .stage-wrap { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; }
  #stage {
    position: relative;
    aspect-ratio: 16 / 9;
    width: min(100%, calc((100vh - 80px) * 16 / 9));
    max-width: 100%;
    max-height: 100%;
    background: #0a0a0a;
    border-radius: 10px;
    overflow: hidden;
    box-shadow:
      0 1px 2px rgba(0,0,0,0.08),
      0 10px 30px -10px rgba(0,0,0,0.25),
      0 0 0 1px rgba(0,0,0,0.06);
  }
  #stage [data-composition-id] {
    position: absolute; inset: 0;
    width: 1920px; height: 1080px;
    transform-origin: top left;
  }
  #stage .clip { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; }
  .controls {
    display: flex; gap: 10px; align-items: center;
    padding: 10px 14px;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(8px);
    border-top: 1px solid rgba(0,0,0,0.06);
    font-family: ui-sans-serif, system-ui; color: #18181b; font-size: 12px;
  }
  .controls button {
    background: #ffffff; border: 1px solid #e4e4e7; color: #18181b;
    padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px;
    transition: background .15s, border-color .15s;
  }
  .controls button:hover { background: #f4f4f5; border-color: #d4d4d8; }
  .controls .time { font-family: ui-monospace, SF Mono, monospace; min-width: 70px; color: #52525b; }
  .controls input[type=range] { flex: 1; accent-color: #18181b; }
</style>
</head><body>
<div class="stage-wrap"><div id="stage">${html}</div></div>
<div class="controls">
  <button id="play">▶</button>
  <button id="pause">⏸</button>
  <button id="restart">↻</button>
  <span class="time" id="time">0.0s / 0.0s</span>
  <input type="range" id="scrub" min="0" max="1" step="0.01" value="0" />
</div>
<script>
  function fitStage() {
    const stage = document.getElementById('stage');
    const root = stage.querySelector('[data-composition-id]');
    if (!stage || !root) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    const scale = Math.min(w / 1920, h / 1080);
    root.style.transform = 'scale(' + scale + ')';
  }
  window.addEventListener('resize', fitStage);
  fitStage();

  const clips = Array.from(document.querySelectorAll('#stage .clip')).map(el => ({
    el,
    start: parseFloat(el.dataset.start) || 0,
    duration: parseFloat(el.dataset.duration) || 1,
    track: parseInt(el.dataset.trackIndex || '0', 10),
  }));
  const total = clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);

  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.5, onUpdate: () => {
    const t = tl.time();
    document.getElementById('time').textContent = t.toFixed(1) + 's / ' + total.toFixed(1) + 's';
    document.getElementById('scrub').value = t;
    // Surface playhead to the parent so the Composition Timeline can render
    // a synced cursor. Throttled implicitly by GSAP's RAF onUpdate.
    try { window.parent.postMessage({ type: 'vf-playhead', time: t, total }, '*'); } catch {}
  }});

  clips.forEach(c => {
    const end = c.start + c.duration;
    const inDur = Math.min(0.6, c.duration * 0.3);
    tl.fromTo(c.el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: inDur, ease: 'power2.out' }, c.start);

    // Fade-out policy: a clip should disappear at its end-of-duration if the
    // composition continues past it (anything else starts at or after this
    // clip ends). Otherwise it's a trailing/background clip and we let it
    // hold until the timeline loops.
    //
    // Cross-fade timing: start the fade-out AT \`end\` (= successor.start
    // for back-to-back clips on the same track) and run it over the same
    // window as the successor's fade-in. This avoids the brief blank frame
    // that the previous logic produced by fading out BEFORE the successor
    // started fading in.
    const hasFollowOn = clips.some(o => o !== c && o.start >= end - 0.05);
    if (hasFollowOn) {
      const outDur = Math.min(0.6, c.duration * 0.3);
      tl.to(c.el, { opacity: 0, duration: outDur, ease: 'power2.in' }, end);
    }
  });

  const scrub = document.getElementById('scrub');
  scrub.max = total;
  document.getElementById('play').onclick = () => tl.play();
  document.getElementById('pause').onclick = () => tl.pause();
  document.getElementById('restart').onclick = () => tl.restart();
  scrub.addEventListener('input', e => { tl.pause(); tl.time(parseFloat(e.target.value)); });

  tl.play();
</script>
</body></html>`;
}

export function PreviewPanel({
  html,
  clips = [],
  totalDuration = 0,
  isLoading = false,
}: PreviewPanelProps) {
  const [playheadSec, setPlayheadSec] = useState(0);

  // Stable html — what the iframe actually renders. We freeze updates while
  // the agent is working so the preview doesn't restart playback every time
  // an intermediate `add-clip` tool result lands. Exception: if we currently
  // have nothing to show (displayHtml === null), let the first composition
  // through so the user doesn't stare at an empty stage for the whole turn.
  const [displayHtml, setDisplayHtml] = useState<string | null>(html);
  useEffect(() => {
    if (!isLoading || displayHtml === null) {
      setDisplayHtml(html);
    }
  }, [html, isLoading, displayHtml]);

  const srcdoc = displayHtml ? buildSrcDoc(displayHtml) : null;

  // Listen for playhead updates posted from the iframe's GSAP timeline so
  // the Composition Timeline can render a synced cursor. The iframe sends
  // `{ type: 'vf-playhead', time, total }` on every RAF tick.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { type?: string; time?: number } | null;
      if (data && data.type === "vf-playhead" && typeof data.time === "number") {
        setPlayheadSec(data.time);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Reset cursor whenever the composition itself changes (new key on iframe).
  useEffect(() => {
    setPlayheadSec(0);
  }, [displayHtml]);

  return (
    <div className="relative flex min-w-0 flex-1 flex-col bg-muted/20">
      {/* Floating glass header overlay */}
      <div className="absolute left-0 right-0 top-0 z-10 flex h-10 items-center gap-2 border-b border-border/50 bg-card/60 px-4 backdrop-blur-md">
        <Play className="size-3.5 text-muted-foreground" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Preview
        </span>
      </div>

      {/* Stage area — while the agent is building, we hide the iframe and
          show a dedicated building state. Showing the previous composition
          underneath is confusing when the new prompt is unrelated. */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden pt-10">
        {isLoading ? (
          <BuildingState />
        ) : srcdoc ? (
          <iframe
            key={displayHtml?.slice(0, 40)}
            srcDoc={srcdoc}
            title="HyperFrames Preview"
            className="h-full w-full border-0"
            sandbox="allow-scripts"
          />
        ) : (
          <PreviewEmptyState />
        )}
      </div>

      {/* Timeline strip below stage */}
      {clips.length > 0 && (
        <TimelineStrip
          clips={clips}
          totalDuration={totalDuration}
          playheadSec={playheadSec}
        />
      )}
    </div>
  );
}

function BuildingState() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]",
          "text-foreground/15",
        )}
        glow
      />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur-sm">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/70" />
            <span className="relative inline-flex size-3 rounded-full bg-primary" />
          </span>
        </div>
        <AnimatedShinyText className="text-sm font-medium">
          Building your composition
        </AnimatedShinyText>
        <p className="max-w-xs text-xs text-muted-foreground/70">
          Preview appears here when the agent finishes the turn.
        </p>
      </div>
    </div>
  );
}

function PreviewEmptyState() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]",
          "text-foreground/20",
        )}
        glow
      />
      <div className="relative flex flex-col items-center gap-4 text-center">
        <div className="relative flex size-16 items-center justify-center rounded-2xl border border-border bg-card/80 shadow-lg backdrop-blur-sm">
          <Play className="size-6 text-primary" />
          <BorderBeam
            size={60}
            duration={6}
            colorFrom="oklch(0.65 0.18 220)"
            colorTo="oklch(0.55 0.15 280)"
            borderWidth={1.5}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <AnimatedShinyText className="text-base font-semibold">
            HyperFrames preview
          </AnimatedShinyText>
          <p className="max-w-xs text-xs text-muted-foreground/70">
            Start a conversation to compose your first clip — playback appears here.
          </p>
        </div>
      </div>
    </div>
  );
}
