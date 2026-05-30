import { Play } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";
import { DotPattern } from "@/components/ui/dot-pattern";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { cn } from "@/lib/utils";
import { TimelineStrip } from "./timeline-strip";
import type { ClipInfo } from "@/harness/use-composition";

interface PreviewPanelProps {
  html: string | null;
  clips?: ClipInfo[];
  totalDuration?: number;
}

function buildSrcDoc(html: string): string {
  return `<!DOCTYPE html>
<html><head>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; }
  body { background: #0a0a0a; overflow: hidden; display: flex; flex-direction: column; }
  .stage-wrap { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px; }
  #stage {
    position: relative;
    aspect-ratio: 16 / 9;
    width: min(100%, calc((100vh - 80px) * 16 / 9));
    max-width: 100%;
    max-height: 100%;
    background: #000;
    border: 1px solid #262626;
    border-radius: 8px;
    overflow: hidden;
  }
  #stage [data-composition-id] {
    position: absolute; inset: 0;
    width: 1920px; height: 1080px;
    transform-origin: top left;
  }
  #stage .clip { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; }
  .controls {
    display: flex; gap: 8px; align-items: center;
    padding: 8px 12px; background: #171717; border-top: 1px solid #262626;
    font-family: ui-sans-serif, system-ui; color: #e5e5e5; font-size: 12px;
  }
  .controls button {
    background: #262626; border: 1px solid #404040; color: #e5e5e5;
    padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;
  }
  .controls button:hover { background: #404040; }
  .controls .time { font-family: ui-monospace, SF Mono, monospace; min-width: 70px; }
  .controls input[type=range] { flex: 1; accent-color: #fff; }
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
  }});

  clips.forEach(c => {
    const end = c.start + c.duration;
    // Only fade out if another clip on the same track starts soon — otherwise
    // let this clip remain visible until the timeline loops.
    const successor = clips.find(o => o !== c && o.track === c.track && o.start >= end - 0.05 && o.start <= end + 0.5);
    const inDur = Math.min(0.6, c.duration * 0.3);
    tl.fromTo(c.el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: inDur, ease: 'power2.out' }, c.start);
    if (successor) {
      const outDur = Math.min(0.4, c.duration * 0.2);
      tl.to(c.el, { opacity: 0, duration: outDur, ease: 'power2.in' }, end - outDur);
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

export function PreviewPanel({ html, clips = [], totalDuration = 0 }: PreviewPanelProps) {
  const srcdoc = html ? buildSrcDoc(html) : null;

  return (
    <div className="relative flex min-w-0 flex-1 flex-col bg-muted/20">
      {/* Floating glass header overlay */}
      <div className="absolute left-0 right-0 top-0 z-10 flex h-10 items-center gap-2 border-b border-border/50 bg-card/60 px-4 backdrop-blur-md">
        <Play className="size-3.5 text-muted-foreground" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Preview
        </span>
      </div>

      {/* Stage area */}
      <div className="flex flex-1 items-center justify-center overflow-hidden pt-10">
        {srcdoc ? (
          <iframe
            key={html?.slice(0, 40)}
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
      {clips.length > 0 && <TimelineStrip clips={clips} totalDuration={totalDuration} />}
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
