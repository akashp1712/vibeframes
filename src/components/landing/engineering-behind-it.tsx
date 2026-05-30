"use client";

import {
  ArrowRight,
  BookOpen,
  Activity,
  CheckCircle2,
  CornerDownRight,
  Database,
  HardDrive,
  Wrench,
  Workflow,
  Cpu,
  FileText,
} from "lucide-react";

/**
 * "Engineering behind it" — a Fin.ai-style product diorama in our warm-paper
 * palette. A bright focal "harness chat" card is surrounded by six low-opacity
 * ghost panels that hint at the broader engineering surface (director mode,
 * SSE stream, skills, constructs, storage, composition tree). Light mode only.
 *
 * The ghosts are decorative (aria-hidden) — they're vibes, not content. The
 * focal card and the proof row carry the real information.
 */
export function EngineeringBehindIt() {
  return (
    <section
      id="engineering"
      className="w-full px-4 pb-24 pt-8 scroll-mt-20 bg-stone-50/80"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
            The engineering behind it
          </span>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl font-sans text-stone-900">
            Agentic Harness, end&#8209;to&#8209;end.
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-sm leading-relaxed text-stone-600 font-sans">
            Not a wrapper around <span className="font-semibold text-stone-900">streamText</span>.
            A real Mastra <span className="font-semibold text-stone-900">Harness</span>: typed
            state, mode switching, a tool catalog, on&#8209;demand skills, durable LibSQL
            persistence, and a custom SSE event bus.
          </p>
        </div>

        <Diorama />
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Diorama — 12-col grid. Focal chat fills the centre; six ghosts orbit it.
 * Ghosts hide on small screens so mobile shows just the focal.
 * ─────────────────────────────────────────────────────────────────────── */

function Diorama() {
  return (
    <div className="relative">
      {/* Warm radial wash behind the diorama to lift the focal */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, oklch(0.97 0.04 65 / 0.55) 0%, transparent 55%)",
        }}
      />

      <div className="grid grid-cols-12 grid-rows-1 gap-3 lg:gap-4 min-h-[640px] lg:grid-rows-5">
        {/* Top-left ghost — Director mode state machine */}
        <Ghost
          area="hidden lg:flex lg:col-start-1 lg:col-end-4 lg:row-start-1 lg:row-end-3"
          title="mode · director"
          icon={Workflow}
        >
          <DirectorModeGhost />
        </Ghost>

        {/* Top-right ghost — Composition tree */}
        <Ghost
          area="hidden lg:flex lg:col-start-10 lg:col-end-13 lg:row-start-1 lg:row-end-3"
          title="composition.json"
          icon={FileText}
        >
          <CompositionGhost />
        </Ghost>

        {/* Middle-left ghost — SSE event stream */}
        <Ghost
          area="hidden lg:flex lg:col-start-1 lg:col-end-4 lg:row-start-3 lg:row-end-4"
          title="SSE stream"
          icon={Activity}
        >
          <SseGhost />
        </Ghost>

        {/* Middle-right ghost — Skills frontmatter */}
        <Ghost
          area="hidden lg:flex lg:col-start-10 lg:col-end-13 lg:row-start-3 lg:row-end-4"
          title="skills/hyperframes"
          icon={BookOpen}
        >
          <SkillGhost />
        </Ghost>

        {/* Bottom-left ghost — Mastra constructs */}
        <Ghost
          area="hidden lg:flex lg:col-start-1 lg:col-end-4 lg:row-start-4 lg:row-end-6"
          title="Mastra constructs"
          icon={Cpu}
        >
          <ConstructsGhost />
        </Ghost>

        {/* Bottom-right ghost — Storage / persistence */}
        <Ghost
          area="hidden lg:flex lg:col-start-10 lg:col-end-13 lg:row-start-4 lg:row-end-6"
          title="storage · libsql"
          icon={HardDrive}
        >
          <StorageGhost />
        </Ghost>

        {/* Focal — bright chat card */}
        <div className="col-span-12 lg:col-start-4 lg:col-end-10 lg:row-start-1 lg:row-end-6">
          <FocalChat />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Ghost — base wrapper for the dim satellite panels.
 * ─────────────────────────────────────────────────────────────────────── */

function Ghost({
  area,
  title,
  icon: Icon,
  children,
}: {
  area: string;
  title: string;
  icon: typeof Cpu;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      className={`${area} group relative flex flex-col overflow-hidden rounded-xl border border-stone-200/70 bg-white/55 px-3.5 py-2.5 backdrop-blur-xs shadow-3xs transition-all duration-300 hover:border-stone-300 hover:bg-white/95 hover:shadow-md hover:-translate-y-0.5`}
    >
      {/* Soft peach radial wash that fades in on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 25% 0%, oklch(0.96 0.05 65 / 0.55), transparent 65%)",
        }}
      />

      <div className="relative mb-2 flex items-center gap-1.5 border-b border-stone-200/60 pb-2 text-[9px] font-semibold uppercase tracking-wider text-stone-400/80 transition-colors duration-300 group-hover:text-stone-700">
        <Icon className="size-3 text-stone-400/80 transition-colors duration-300 group-hover:text-orange-600" />
        <span>{title}</span>
      </div>
      <div className="relative flex-1 select-none text-stone-400/70 transition-colors duration-300 group-hover:text-stone-700">
        {children}
      </div>
    </div>
  );
}

/* ─── Ghost contents ──────────────────────────────────────────────────── */

function DirectorModeGhost() {
  const modes = [
    { name: "director", note: "plans + delegates", active: true },
    { name: "composer", note: "calls tools",       active: false },
    { name: "critic",   note: "validates output",  active: false },
  ];
  return (
    <div className="flex flex-col gap-2 font-mono text-[9px] leading-tight">
      <div className="flex items-center justify-between text-stone-400/60">
        <span className="uppercase tracking-wider">harness.mode</span>
        <span>3 modes</span>
      </div>
      <ul className="flex flex-col gap-1">
        {modes.map((m) => (
          <li
            key={m.name}
            className={`flex items-center gap-1.5 rounded border px-1.5 py-1 ${
              m.active
                ? "border-orange-300/70 bg-orange-50/60 text-stone-700"
                : "border-stone-200/60 bg-white/40 text-stone-400/80"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                m.active ? "bg-orange-500 animate-pulse" : "bg-stone-300"
              }`}
            />
            <span className="font-semibold">{m.name}</span>
            <span className="ml-auto text-[8px] opacity-70">{m.note}</span>
          </li>
        ))}
      </ul>
      <div className="mt-0.5 flex items-center gap-1 text-stone-400/60">
        <CornerDownRight className="size-2.5" />
        <span>transition → composer on tool_request</span>
      </div>
    </div>
  );
}

function CompositionGhost() {
  return (
    <pre className="font-mono text-[9px] leading-relaxed text-stone-400/75">
{`{
  "id": "comp-7x4y2",
  "fps": 30,
  "tracks": [
    {
      "id": "track-bg",
      "clips": [
        { "id": "clip-a8z",
          "startMs": 0,
          "durationMs": 3000 }
      ]
    },
    { "id": "track-text", ... }
  ]
}`}
    </pre>
  );
}

function SseGhost() {
  const events = [
    "run.start",
    "tool_start · add-clip",
    "tool_end · ok",
    "text_delta",
    "composition.delta",
    "run.complete",
  ];
  return (
    <ul className="flex flex-col gap-0.5 font-mono text-[9px] text-stone-400/70">
      {events.map((e) => (
        <li key={e} className="flex items-center gap-1.5">
          <CornerDownRight className="size-2.5 opacity-50" />
          <span>{e}</span>
        </li>
      ))}
    </ul>
  );
}

function SkillGhost() {
  return (
    <pre className="font-mono text-[9px] leading-relaxed text-stone-400/75">
{`---
name: hyperframes
description: HTML/CSS clips
         + animation rules.
---
## When to use
- compose a video clip
- pick block templates
- estimate timing`}
    </pre>
  );
}

function ConstructsGhost() {
  const constructs = [
    { label: "State", note: "Zod", icon: Cpu },
    { label: "Modes", note: "Director", icon: Workflow },
    { label: "Tools", note: "5 typed", icon: Wrench },
    { label: "Skills", note: "1 loaded", icon: BookOpen },
    { label: "Memory", note: "LibSQL", icon: Database },
  ];
  return (
    <ul className="grid grid-cols-2 gap-1.5">
      {constructs.map((c) => {
        const Icon = c.icon;
        return (
          <li
            key={c.label}
            className="flex items-center gap-1.5 rounded border border-stone-200/50 bg-white/40 px-1.5 py-1"
          >
            <Icon className="size-2.5 text-stone-400/70" />
            <span className="text-[9px] font-semibold text-stone-500/80">{c.label}</span>
            <span className="ml-auto text-[8px] font-mono text-stone-400/60">{c.note}</span>
          </li>
        );
      })}
    </ul>
  );
}

function StorageGhost() {
  const tables = [
    { name: "threads",        rows: "12" },
    { name: "messages",       rows: "148" },
    { name: "working_memory", rows: "3"  },
    { name: "resources",      rows: "1"  },
  ];
  return (
    <div className="flex flex-col gap-1.5 font-mono text-[9px] leading-tight text-stone-400/80">
      <div className="flex items-center justify-between text-stone-400/60">
        <span className="uppercase tracking-wider">@mastra/libsql</span>
        <span className="flex items-center gap-1">
          <Database className="size-2.5" /> file
        </span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {tables.map((t) => (
          <li key={t.name} className="flex items-center justify-between rounded px-1.5 py-0.5 bg-white/40 border border-stone-200/40">
            <span>{t.name}</span>
            <span className="text-[8px] text-stone-400/60 tabular-nums">{t.rows} rows</span>
          </li>
        ))}
      </ul>
      <div className="mt-0.5 flex items-center gap-1 text-stone-400/60 text-[8px]">
        <CornerDownRight className="size-2.5" />
        <span>.data/vibeframes.db · swap → Turso</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Focal — the bright "this is the product" chat card.
 * ─────────────────────────────────────────────────────────────────────── */

function FocalChat() {
  return (
    <div className="relative h-full flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_30px_60px_-25px_rgba(28,25,23,0.12),0_8px_20px_-10px_rgba(28,25,23,0.06)]">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-stone-200/80 bg-stone-50/70 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="font-mono text-[11px] font-semibold text-stone-900">
            harness · director mode
          </span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-stone-400">
          run · 0R0XKJ2A
        </span>
      </div>

      {/* Conversation body */}
      <div className="flex-1 overflow-hidden px-4 pt-5 pb-3 flex flex-col gap-4">
        {/* User bubble */}
        <div className="flex justify-end">
          <div className="max-w-[78%] rounded-2xl rounded-br-md bg-orange-100/80 px-3.5 py-2 text-[12px] leading-relaxed text-orange-950 ring-1 ring-orange-200/70">
            make me a 30s launch teaser with a title at the start and an outro CTA at the end
          </div>
        </div>

        {/* Tool call 1 */}
        <ToolCallRow
          name="add-clip"
          subtitle="track-bg · 0&ndash;3s"
          html='<h1 class="text-6xl ...">Launch.</h1>'
          delayMs={420}
        />

        {/* Tool call 2 */}
        <ToolCallRow
          name="add-clip"
          subtitle="track-outro · 27&ndash;30s"
          html='<a href="/start" class="...">Start now &rarr;</a>'
          delayMs={680}
        />

        {/* Assistant text */}
        <div className="flex items-start gap-2">
          <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-stone-900 text-[9px] font-bold text-white">
            VF
          </span>
          <p className="text-[12px] leading-relaxed text-stone-700">
            Done — added a hero title from{" "}
            <span className="font-mono text-stone-900">0–3s</span> on{" "}
            <span className="font-mono text-stone-900">track-bg</span> and an
            outro CTA from{" "}
            <span className="font-mono text-stone-900">27–30s</span> on a new{" "}
            <span className="font-mono text-stone-900">track-outro</span>.
            Preview is live on the right.
          </p>
        </div>

        <div className="flex items-center gap-1.5 pl-7 text-[10px] font-mono text-stone-400">
          <span className="size-1 animate-pulse rounded-full bg-orange-500" />
          <span>composition.delta · clipCount: 2 · trackCount: 2</span>
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-stone-200/80 bg-stone-50/40 px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-3xs">
          <span className="font-sans text-[12px] text-stone-400">
            describe a change&hellip;
          </span>
          <span className="ml-auto inline-flex size-6 items-center justify-center rounded-full bg-stone-900 text-white">
            <ArrowRight className="size-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

function ToolCallRow({
  name,
  subtitle,
  html,
  delayMs,
}: {
  name: string;
  subtitle: string;
  html: string;
  delayMs: number;
}) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border border-stone-200/80 bg-stone-50/70 px-3 py-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-500"
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: "backwards" }}
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] font-semibold text-stone-900">
            {name}
          </span>
          <span
            className="font-mono text-[10px] text-stone-500"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        </div>
        <code className="mt-0.5 block truncate font-mono text-[10px] text-stone-400">
          {html}
        </code>
      </div>
      <span className="font-mono text-[9px] text-stone-300">218ms</span>
    </div>
  );
}

