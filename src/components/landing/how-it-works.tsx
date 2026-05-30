"use client";

import { useEffect, useState } from "react";
import {
  MessageSquareText,
  Wand2,
  MonitorPlay,
  CheckCircle2,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";

/**
 * "How it works" — a 3-column row with per-step animated SVG mockups.
 *
 * Each card pairs explanatory copy with a live mini-animation that shows
 * exactly what happens in that step: typing → tool calls → timeline preview.
 * The mockups are pure CSS/SVG (no JS animation libs) apart from a single
 * tick interval used to drive a couple of staggered reveals — keeps it
 * cheap and SSR-friendly.
 */
export function HowItWorks() {
  return (
    <section className="w-full px-4 pb-20 pt-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl font-sans text-stone-900">
            How it works
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground font-sans sm:text-sm">
            Three steps from idea to video.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StepCard
            step="01"
            title="Describe"
            description="Tell the agent what you want in plain language."
            Icon={MessageSquareText}
            accent="peach"
            beamDelay={0}
          >
            <DescribeMock />
          </StepCard>

          <StepCard
            step="02"
            title="Compose"
            description="Typed tools mutate the HyperFrames composition tree."
            Icon={Wand2}
            accent="lavender"
            beamDelay={3}
          >
            <ComposeMock />
          </StepCard>

          <StepCard
            step="03"
            title="Preview"
            description="Watch your video render in real time via SSE streaming."
            Icon={MonitorPlay}
            accent="butter"
            beamDelay={6}
          >
            <PreviewMock />
          </StepCard>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * StepCard — generic bento cell. Same structure as the old FeatureGrid
 * cells, with a per-step pastel accent + colored icon chip + BorderBeam.
 * ─────────────────────────────────────────────────────────────────────── */

type Accent = "peach" | "sage" | "lavender" | "butter";

const ACCENTS: Record<
  Accent,
  { gradient: string; chipBg: string; chipFg: string; beamFrom: string; beamTo: string }
> = {
  peach: {
    gradient: "from-white via-white to-orange-50/50",
    chipBg: "bg-orange-100/80",
    chipFg: "text-orange-700",
    beamFrom: "oklch(0.85 0.05 65)",
    beamTo: "oklch(0.95 0.02 65)",
  },
  sage: {
    gradient: "from-white via-white to-green-50/40",
    chipBg: "bg-green-100/70",
    chipFg: "text-green-800",
    beamFrom: "oklch(0.85 0.05 140)",
    beamTo: "oklch(0.95 0.02 140)",
  },
  lavender: {
    gradient: "from-white via-white to-violet-50/40",
    chipBg: "bg-violet-100/70",
    chipFg: "text-violet-800",
    beamFrom: "oklch(0.85 0.05 285)",
    beamTo: "oklch(0.95 0.02 285)",
  },
  butter: {
    gradient: "from-white via-white to-amber-50/40",
    chipBg: "bg-amber-100/70",
    chipFg: "text-amber-800",
    beamFrom: "oklch(0.85 0.05 85)",
    beamTo: "oklch(0.95 0.02 85)",
  },
};

interface StepCardProps {
  step: string;
  title: string;
  description: string;
  Icon: typeof MessageSquareText;
  accent: Accent;
  beamDelay: number;
  children: React.ReactNode;
}

function StepCard({
  step,
  title,
  description,
  Icon,
  accent,
  beamDelay,
  children,
}: StepCardProps) {
  const a = ACCENTS[accent];
  return (
    <Card
      className={`group relative flex flex-col justify-between overflow-hidden border border-stone-200/80 bg-gradient-to-br ${a.gradient} p-1 shadow-3xs transition-all hover:shadow-md`}
    >
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            Step {step}
          </span>
          <div
            className={`flex size-9 items-center justify-center rounded-lg ${a.chipBg} ${a.chipFg}`}
          >
            <Icon className="size-5" />
          </div>
        </div>
        <CardTitle className="text-base font-sans tracking-tight text-stone-900">
          {title}
        </CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground font-sans">
          {description}
        </p>
      </div>

      <div className="mx-5 mb-5">{children}</div>

      <BorderBeam
        size={120}
        duration={8}
        delay={beamDelay}
        colorFrom={a.beamFrom}
        colorTo={a.beamTo}
        borderWidth={1.5}
      />
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Step 01 — Describe: an input bubble that types itself, blinking cursor.
 * ─────────────────────────────────────────────────────────────────────── */

const DESCRIBE_PHRASES = [
  "make me a 30s launch teaser",
  "add a title at the start and an outro CTA",
  "use a modern sans-serif font",
];

function DescribeMock() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const phrase = DESCRIBE_PHRASES[phraseIdx];

  useEffect(() => {
    if (charCount < phrase.length) {
      const t = setTimeout(() => setCharCount((c) => c + 1), 45);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setCharCount(0);
      setPhraseIdx((i) => (i + 1) % DESCRIBE_PHRASES.length);
    }, 1800);
    return () => clearTimeout(t);
  }, [charCount, phrase.length]);

  return (
    <div className="flex h-[140px] flex-col justify-end rounded-xl border border-stone-200/60 bg-stone-50/50 p-3 select-none">
      <div className="flex items-end justify-end">
        <div className="max-w-[88%] rounded-2xl rounded-br-md bg-orange-100/80 px-3 py-2 text-[11px] font-sans leading-relaxed text-orange-950 ring-1 ring-orange-200/70 shadow-2xs">
          {phrase.slice(0, charCount)}
          <span className="ml-0.5 inline-block w-[1.5px] h-3 bg-orange-700 align-middle animate-pulse" />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5">
        <span className="font-sans text-[10px] text-stone-400">describe a change…</span>
        <span className="ml-auto inline-flex size-4 items-center justify-center rounded-full bg-stone-900">
          <svg viewBox="0 0 12 12" className="size-2.5 text-white">
            <path d="M2 6h7m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Step 02 — Compose: tool call rows appearing one by one with checkmarks.
 * ─────────────────────────────────────────────────────────────────────── */

const TOOL_CALLS = [
  { name: "add-clip", target: "track-bg · 0–3s" },
  { name: "add-clip", target: "track-title · 3–8s" },
  { name: "update-clip", target: "track-bg · 1.2s offset" },
];

function ComposeMock() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const t = setTimeout(
      () => {
        setVisible((v) => (v >= TOOL_CALLS.length ? 0 : v + 1));
      },
      visible >= TOOL_CALLS.length ? 1600 : 700,
    );
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div className="flex h-[140px] flex-col gap-1.5 rounded-xl border border-stone-200/60 bg-stone-50/50 p-3 select-none">
      {TOOL_CALLS.map((tc, i) => (
        <div
          key={`${tc.name}-${i}`}
          className={`flex items-center gap-2 rounded-lg border border-violet-200/60 bg-white/80 px-2.5 py-1.5 transition-all duration-500 ${
            i < visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
          }`}
        >
          <CheckCircle2 className={`size-3.5 ${i < visible ? "text-emerald-600" : "text-stone-300"}`} />
          <span className="font-mono text-[10px] font-semibold text-stone-900">
            {tc.name}
          </span>
          <span className="font-mono text-[9px] text-stone-500 truncate">
            {tc.target}
          </span>
          <span className="ml-auto font-mono text-[8px] text-stone-300">218ms</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Step 03 — Preview: a faux preview window with evolving frame content,
 * playback meta, and a named-track timeline with a synced playhead.
 *
 * Loop is 6s long. The frame content rotates through three "scenes" that
 * mirror the timeline's clip layout (title → tagline → CTA), so the viewer
 * intuits that the playhead position drives what is rendered above.
 * ─────────────────────────────────────────────────────────────────────── */

interface PreviewFrame {
  title: string;
  subtitle: string;
  time: string;
  accent: string; // background gradient hue
}

const PREVIEW_FRAMES: PreviewFrame[] = [
  { title: "Launch.",        subtitle: "from VibeFrames",  time: "0:02 / 0:30", accent: "55"  }, // peach
  { title: "Built with AI.", subtitle: "agents → clips",   time: "0:14 / 0:30", accent: "285" }, // violet
  { title: "Start now →",    subtitle: "vibeframes.dev",   time: "0:28 / 0:30", accent: "145" }, // green
];

function PreviewMock() {
  const [frameIdx, setFrameIdx] = useState(0);
  // Switch scenes every 2s so the 6s playhead loop traverses all three.
  useEffect(() => {
    const t = setInterval(() => {
      setFrameIdx((i) => (i + 1) % PREVIEW_FRAMES.length);
    }, 2000);
    return () => clearInterval(t);
  }, []);
  const frame = PREVIEW_FRAMES[frameIdx];

  return (
    <div className="flex h-[140px] flex-col gap-1 rounded-xl border border-stone-200/60 bg-stone-50/50 p-2 select-none">
      {/* Window chrome */}
      <div className="flex h-3 items-center gap-1 px-0.5">
        <span className="size-1.5 rounded-full bg-rose-300/80" />
        <span className="size-1.5 rounded-full bg-amber-300/80" />
        <span className="size-1.5 rounded-full bg-emerald-300/80" />
        <span className="ml-1.5 font-mono text-[7px] uppercase tracking-wider text-stone-400">
          preview · vibeframes
        </span>
        <span className="ml-auto font-mono text-[7px] tabular-nums text-stone-500">
          {frame.time}
        </span>
      </div>

      {/* Frame stage — taller so the rendered frame is the visual hero */}
      <div className="relative flex h-[68px] items-center justify-center overflow-hidden rounded-md bg-stone-900">
        {/* Warm-hue spotlight that shifts with the scene */}
        <div
          aria-hidden
          className="absolute inset-0 transition-[background] duration-700"
          style={{
            background: `radial-gradient(circle at 70% 30%, oklch(0.72 0.17 ${frame.accent} / 0.55), transparent 65%)`,
          }}
        />
        {/* Subtle scanline noise */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 3px)",
          }}
        />
        {/* Frame text — keyed so it remounts and re-animates per scene */}
        <div
          key={frame.title}
          className="relative z-10 flex flex-col items-center text-center animate-in fade-in-0 zoom-in-95 duration-500"
        >
          <div className="font-sans text-[15px] font-bold leading-none tracking-tight text-white">
            {frame.title}
          </div>
          <div
            className="mt-1.5 font-sans text-[8.5px] font-medium tracking-wide"
            style={{ color: `oklch(0.85 0.12 ${frame.accent})` }}
          >
            {frame.subtitle}
          </div>
        </div>
        {/* Play indicator (top-left, glows during playback) */}
        <span className="absolute left-1.5 top-1 z-10 flex items-center gap-1">
          <span className="inline-block size-1.5 rounded-full bg-orange-400 animate-pulse" />
          <span className="font-mono text-[6.5px] uppercase tracking-wider text-white/60">
            live
          </span>
        </span>
      </div>

      {/* Timeline with named tracks + synced playhead */}
      <PreviewTimeline />
    </div>
  );
}

function PreviewTimeline() {
  // 6s loop matches the scene rotation above (3 scenes × 2s = 6s).
  // We use keyTimes so the playhead sweeps 0→100% over 95% of the loop, then
  // snaps back over the last 5% — feels like an actual video loop, not a
  // bounce.
  const PLAYHEAD_KEYTIMES = "0;0.95;1";
  const PLAYHEAD_VALUES_X = "6;254;6";
  const DUR = "6s";

  return (
    <svg viewBox="0 0 260 32" className="w-full h-8">
      {/* Track labels (left column) */}
      <text x="0" y="9"  fontSize="6" fontFamily="ui-monospace, monospace" fill="oklch(0.5 0.01 60)">bg</text>
      <text x="0" y="20" fontSize="6" fontFamily="ui-monospace, monospace" fill="oklch(0.5 0.01 60)">txt</text>
      <text x="0" y="31" fontSize="6" fontFamily="ui-monospace, monospace" fill="oklch(0.5 0.01 60)">out</text>

      {/* Track guide lines */}
      <line x1="14" y1="6"  x2="258" y2="6"  stroke="oklch(0.93 0.005 60)" strokeWidth="0.4" />
      <line x1="14" y1="17" x2="258" y2="17" stroke="oklch(0.93 0.005 60)" strokeWidth="0.4" />
      <line x1="14" y1="28" x2="258" y2="28" stroke="oklch(0.93 0.005 60)" strokeWidth="0.4" />

      {/* Clip: track-bg — fills 0–18s (≈ 14 → 158) */}
      <rect x="14" y="3"  width="144" height="6" rx="1.5" fill="oklch(0.93 0.05 65)"  stroke="oklch(0.78 0.12 65)"  strokeWidth="0.6" />
      {/* Clip: track-text — 4–14s (≈ 50 → 130) */}
      <rect x="50" y="14" width="80"  height="6" rx="1.5" fill="oklch(0.94 0.05 285)" stroke="oklch(0.78 0.12 285)" strokeWidth="0.6" />
      {/* Clip: track-bg continues with second cell — outro on its own track */}
      <rect x="160" y="3" width="98" height="6" rx="1.5" fill="oklch(0.93 0.04 65)"  stroke="oklch(0.78 0.1 65)"  strokeWidth="0.5" opacity="0.65" />
      {/* Clip: track-outro — 24–30s */}
      <rect x="200" y="25" width="58" height="6" rx="1.5" fill="oklch(0.93 0.05 145)" stroke="oklch(0.78 0.12 145)" strokeWidth="0.6" />

      {/* Playhead line spans all tracks */}
      <line stroke="oklch(0.55 0.2 55)" strokeWidth="1.1" opacity="0.85">
        <animate attributeName="x1" values={PLAYHEAD_VALUES_X} keyTimes={PLAYHEAD_KEYTIMES} dur={DUR} repeatCount="indefinite" />
        <animate attributeName="x2" values={PLAYHEAD_VALUES_X} keyTimes={PLAYHEAD_KEYTIMES} dur={DUR} repeatCount="indefinite" />
        <animate attributeName="y1" values="2;2;2"   keyTimes={PLAYHEAD_KEYTIMES} dur={DUR} repeatCount="indefinite" />
        <animate attributeName="y2" values="31;31;31" keyTimes={PLAYHEAD_KEYTIMES} dur={DUR} repeatCount="indefinite" />
      </line>
      {/* Playhead head dot */}
      <circle r="2" fill="oklch(0.55 0.2 55)">
        <animate attributeName="cx" values={PLAYHEAD_VALUES_X} keyTimes={PLAYHEAD_KEYTIMES} dur={DUR} repeatCount="indefinite" />
        <animate attributeName="cy" values="2;2;2"             keyTimes={PLAYHEAD_KEYTIMES} dur={DUR} repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
