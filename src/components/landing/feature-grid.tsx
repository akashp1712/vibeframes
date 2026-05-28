"use client";

import { MessageSquare, Layers, Sparkles, Terminal, Play, CheckCircle2 } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";
import { useEffect, useState } from "react";

export function FeatureGrid() {
  const [dots, setDots] = useState("");
  const [activeTool, setActiveTool] = useState(0);

  // Simple thinking indicator loop for Bento Card 1
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  // Simple tool execution cycle for Bento Card 3
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTool((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="mx-auto w-full max-w-4xl px-4 pb-24">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl font-sans text-stone-900 dark:text-stone-100">
          Engineered for Video Automation
        </h2>
        <p className="mt-2 text-sm text-muted-foreground font-sans">
          A modular harness pairing conversational planning with pixel-perfect native HTML rendering.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Cell 1: Chat-First editing */}
        <Card className="group relative flex flex-col justify-between overflow-hidden border border-stone-200/80 bg-gradient-to-br from-white via-white to-blue-50/20 p-1 shadow-3xs transition-all hover:shadow-md dark:border-stone-800 dark:from-stone-900 dark:via-stone-900 dark:to-blue-950/10">
          <div className="flex flex-col gap-3 p-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
              <MessageSquare className="size-5" />
            </div>
            <CardTitle className="text-base font-sans tracking-tight text-stone-900 dark:text-stone-100">
              Chat-First Editing
            </CardTitle>
            <p className="text-xs leading-relaxed text-muted-foreground font-sans">
              Describe your video in plain text. The Mastra Harness plans transitions, selects assets, and plans timestamps.
            </p>
          </div>

          {/* Interactive Chat Mockup */}
          <div className="mx-5 mb-5 flex flex-col gap-2.5 rounded-xl border border-stone-200/60 bg-stone-50/50 p-4 dark:border-stone-800/80 dark:bg-stone-950/40 select-none">
            {/* User message */}
            <div className="flex items-end gap-2">
              <div className="rounded-lg bg-stone-900 px-3 py-1.5 text-[11px] font-sans text-stone-100 shadow-2xs dark:bg-stone-100 dark:text-stone-900">
                make me a 30s launch teaser with modern sans-serif headings...
              </div>
            </div>
            {/* Agent thinking message */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500">
              <span className="flex size-2.5 items-center justify-center rounded-full bg-stone-900/10 dark:bg-stone-100/10">
                <span className="size-1 rounded-full bg-stone-400 animate-pulse" />
              </span>
              <span>Agent Planner: thinking{dots}</span>
            </div>
          </div>
          
          <BorderBeam
            size={120}
            duration={8}
            delay={0}
            colorFrom="oklch(0.82 0.03 80)"
            colorTo="oklch(0.85 0.02 240)"
            borderWidth={1.5}
          />
        </Card>

        {/* Cell 2: HTML-Native Serialization */}
        <Card className="group relative flex flex-col justify-between overflow-hidden border border-stone-200/80 bg-gradient-to-br from-white via-white to-sky-50/20 p-1 shadow-3xs transition-all hover:shadow-md dark:border-stone-800 dark:from-stone-900 dark:via-stone-900 dark:to-sky-950/10">
          <div className="flex flex-col gap-3 p-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
              <Layers className="size-5" />
            </div>
            <CardTitle className="text-base font-sans tracking-tight text-stone-900 dark:text-stone-100">
              HTML-Native Serialization
            </CardTitle>
            <p className="text-xs leading-relaxed text-muted-foreground font-sans">
              No proprietary timeline binaries. The canvas is compiled deterministically into clean Web Components.
            </p>
          </div>

          {/* Interactive Code Serialization Mockup */}
          <div className="mx-5 mb-5 grid grid-cols-2 gap-2 rounded-xl border border-stone-200/60 bg-stone-950 p-3.5 font-mono text-[9px] text-stone-400 select-none dark:border-stone-800/80">
            {/* JSON side */}
            <div className="flex flex-col gap-1 border-r border-stone-800 pr-2">
              <span className="text-stone-600">{/* AST Node */}</span>
              <span className="text-indigo-400 font-semibold">&#123;</span>
              <span className="pl-2 text-stone-300">type: <span className="text-emerald-400">&quot;text&quot;</span>,</span>
              <span className="pl-2 text-stone-300">start: <span className="text-amber-400">0.0</span>,</span>
              <span className="pl-2 text-stone-300">duration: <span className="text-amber-400">5.0</span></span>
              <span className="text-indigo-400 font-semibold">&#125;</span>
            </div>
            {/* HTML side */}
            <div className="flex flex-col justify-center pl-2">
              <span className="text-stone-600">{/* HTML Output */}</span>
              <span className="text-stone-500">&lt;<span className="text-sky-400">div</span>&gt;</span>
                <span className="pl-2 text-stone-300" data-start="&quot;0&quot;"></span>
                <span className="pl-2 text-stone-300" data-dur="&quot;5&quot;"></span>
              <span className="text-stone-500">&gt;...&lt;/<span className="text-sky-400">div</span>&gt;</span>
            </div>
          </div>

          <BorderBeam
            size={120}
            duration={8}
            delay={2}
            colorFrom="oklch(0.82 0.03 80)"
            colorTo="oklch(0.85 0.02 240)"
            borderWidth={1.5}
          />
        </Card>

        {/* Cell 3: Mastra Harness Agent */}
        <Card className="group relative flex flex-col justify-between overflow-hidden border border-stone-200/80 bg-gradient-to-br from-white via-white to-indigo-50/15 p-1 shadow-3xs transition-all hover:shadow-md dark:border-stone-800 dark:from-stone-900 dark:via-stone-900 dark:to-indigo-950/10">
          <div className="flex flex-col gap-3 p-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Sparkles className="size-5" />
            </div>
            <CardTitle className="text-base font-sans tracking-tight text-stone-900 dark:text-stone-100">
              Mastra Harness Runtime
            </CardTitle>
            <p className="text-xs leading-relaxed text-muted-foreground font-sans">
              A robust environment defining typed state, tools, validation layers, and memory in a singular class.
            </p>
          </div>

          {/* Interactive Mastra Toolkit Mockup */}
          <div className="mx-5 mb-5 flex flex-col gap-1.5 rounded-xl border border-stone-200/60 bg-stone-50/50 p-3.5 dark:border-stone-800/80 dark:bg-stone-950/40 select-none">
            <div className="flex flex-wrap gap-1.5">
              {["add-clip()", "update-clip()", "remove-clip()", "validate()"].map((tool, idx) => (
                <div
                  key={tool}
                  className={`rounded-md border px-2 py-1 font-mono text-[9px] font-medium transition-all duration-300 ${
                    activeTool === idx
                      ? "border-indigo-650 bg-indigo-950 text-white shadow-2xs dark:border-indigo-300 dark:bg-indigo-200 dark:text-indigo-950"
                      : "border-stone-200 bg-white text-stone-500 dark:border-stone-800 dark:bg-stone-900"
                  }`}
                >
                  {tool}
                </div>
              ))}
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[8px] text-stone-400">
              <Terminal className="size-3 text-stone-400" />
              <span>
                harness.execute(
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                    {["add-clip", "update-clip", "remove-clip", "validate"][activeTool]}
                </span>
                )
              </span>
            </div>
          </div>

          <BorderBeam
            size={120}
            duration={8}
            delay={4}
            colorFrom="oklch(0.82 0.03 80)"
            colorTo="oklch(0.85 0.02 240)"
            borderWidth={1.5}
          />
        </Card>

        {/* Cell 4: Vitest Quality Suite */}
        <Card className="group relative flex flex-col justify-between overflow-hidden border border-stone-200/80 bg-gradient-to-br from-white via-white to-emerald-50/20 p-1 shadow-3xs transition-all hover:shadow-md dark:border-stone-800 dark:from-stone-900 dark:via-stone-900 dark:to-emerald-950/10">
          <div className="flex flex-col gap-3 p-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Play className="size-5" />
            </div>
            <CardTitle className="text-base font-sans tracking-tight text-stone-900 dark:text-stone-100">
              Rigorous Test-First Quality
            </CardTitle>
            <p className="text-xs leading-relaxed text-muted-foreground font-sans">
              All tools, schemas, and API handlers are covered by a comprehensive Vitest unit testing suite.
            </p>
          </div>

          {/* Vitest Mock Terminal */}
          <div className="mx-5 mb-5 flex flex-col gap-1.5 rounded-xl border border-stone-200/60 bg-stone-50/50 p-3.5 dark:border-stone-800/80 dark:bg-stone-950/40 select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[9px] font-semibold text-stone-600 dark:text-stone-400">
                <CheckCircle2 className="size-3.5 text-emerald-800 dark:text-emerald-500" />
                <span>Vitest Suite</span>
              </div>
              <span className="font-mono text-[8px] text-stone-400">PASS</span>
            </div>
            <div className="flex flex-col gap-0.5 border-t border-stone-200/60 pt-2 font-mono text-[8px] text-stone-500 dark:border-stone-800/80">
              <div className="flex justify-between">
                <span>✓ src/harness/tools.test.ts</span>
                <span className="text-stone-400">7 passed</span>
              </div>
              <div className="flex justify-between">
                <span>✓ src/harness/types.test.ts</span>
                <span className="text-stone-400">4 passed</span>
              </div>
              <div className="flex justify-between font-semibold text-stone-800 dark:text-stone-200">
                <span>Tests: 44 passed (44 total)</span>
                <span className="text-emerald-800 dark:text-emerald-500">100% Green</span>
              </div>
            </div>
          </div>

          <BorderBeam
            size={120}
            duration={8}
            delay={6}
            colorFrom="oklch(0.82 0.03 80)"
            colorTo="oklch(0.85 0.02 240)"
            borderWidth={1.5}
          />
        </Card>
      </div>
    </section>
  );
}
