"use client";

import Link from "next/link";
import { Player } from "@remotion/player";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { VibeVideo } from "@/remotion/VibeVideo";
import { SAMPLE_COMPOSITION, SAMPLE_FRAMES } from "@/remotion/sample";


export function Hero() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 w-full">

      <div className="flex max-w-2xl flex-col items-center gap-4 pt-12 pb-6 text-center">
        <div className="flex items-center gap-2 rounded-full border border-orange-200/70 bg-orange-50/60 px-3.5 py-1 shadow-3xs">
          <Sparkles className="size-3 text-orange-700 animate-pulse" />
          <AnimatedShinyText className="text-xs font-semibold text-slate-700">
            alpha · chat-first video editor
          </AnimatedShinyText>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-slate-900 leading-tight">
          Compose videos
          <br />
          <span className="bg-gradient-to-r from-stone-900 via-stone-800 to-orange-700 bg-clip-text text-transparent">
            through conversation.
          </span>
        </h1>

        <p className="max-w-lg text-sm sm:text-base leading-relaxed text-slate-600 font-sans">
          You describe what you want. The agent reasons, calls tools, and builds a{" "}
          <a
            href="https://www.remotion.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-stone-900 hover:text-stone-700 underline decoration-orange-300 hover:decoration-orange-500 decoration-2 underline-offset-2 transition-all"
          >
            Remotion
          </a>{" "}
          composition — scene by scene — while you watch in real time.
        </p>

        <div className="flex items-center gap-3 pt-1">
          <Link href="/studio">
            <ShimmerButton
              shimmerColor="#ffffff"
              shimmerSize="0.05em"
              background="var(--color-primary)"
              borderRadius="8px"
              className="px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm"
            >
              Open Studio
              <ArrowRight className="ml-1.5 size-4" />
            </ShimmerButton>
          </Link>
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<a href="#engineering" />}
          >
            See the engineering
          </Button>
        </div>
      </div>

      {/* Premium macOS Browser Window Promo Showcase */}
      <div className="relative w-full max-w-4xl rounded-2xl border border-stone-200/80 bg-white/40 p-2 shadow-[0_30px_60px_-15px_rgba(28,25,23,0.06),0_1px_3px_rgba(28,25,23,0.02)] backdrop-blur-xs mb-24 transition-all duration-300 hover:shadow-[0_40px_80px_-20px_rgba(28,25,23,0.08)]">
        <div className="relative flex flex-col h-full w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
          
          {/* Mock Window Top Bar */}
          <div className="flex h-11 items-center justify-between border-b border-stone-200/80 bg-stone-100/50 px-4 select-none">
            {/* Traffic Lights */}
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-full bg-stone-300/80 border border-stone-400/20" />
              <div className="size-3 rounded-full bg-stone-300/80 border border-stone-400/20" />
              <div className="size-3 rounded-full bg-stone-300/80 border border-stone-400/20" />
            </div>
            {/* File Path Title */}
            <div className="flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1 font-mono text-[10px] text-stone-500 shadow-3xs">
              <span className="text-stone-300">~/vibeframes/</span>
              <span className="font-semibold text-stone-700">composition.tsx</span>
            </div>
            {/* Engine Badge */}
            <div className="flex items-center gap-1 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
              <span className="size-1.5 rounded-full bg-emerald-700 animate-pulse" />
              Remotion
            </div>
          </div>

          {/* Video Container — live Remotion preview of a sample composition */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#09090b]">
            <Player
              component={VibeVideo}
              inputProps={{ composition: SAMPLE_COMPOSITION }}
              durationInFrames={SAMPLE_FRAMES}
              fps={SAMPLE_COMPOSITION.fps}
              compositionWidth={SAMPLE_COMPOSITION.width}
              compositionHeight={SAMPLE_COMPOSITION.height}
              style={{ width: "100%", height: "100%" }}
              autoPlay
              loop
              controls
            />
          </div>
        </div>
      </div>
    </section>
  );
}
