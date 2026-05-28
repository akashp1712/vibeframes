import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";

export function Hero() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex max-w-2xl flex-col items-center gap-6 py-24 text-center">
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1 shadow-sm">
          <Sparkles className="size-3 text-primary" />
          <AnimatedShinyText className="text-xs font-medium">
            docs-first, now code
          </AnimatedShinyText>
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Compose videos
          <br />
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            through conversation.
          </span>
        </h1>

        <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
          You describe what you want. The agent reasons, calls tools, and
          builds a{" "}
          <a
            href="https://github.com/heygen-com/hyperframes"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
          >
            HyperFrames
          </a>{" "}
          composition — clip by clip, track by track — while you watch in
          real time.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <Link href="/studio">
            <ShimmerButton
              shimmerColor="#a5b4fc"
              shimmerSize="0.06em"
              background="oklch(0.49 0.22 264)"
              borderRadius="10px"
              className="px-5 py-2.5 text-sm font-medium"
            >
              Open Studio
              <ArrowRight className="ml-1.5 size-4" />
            </ShimmerButton>
          </Link>
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={
              <a href="https://github.com/akashp1712/vibeframes/tree/main/docs" />
            }
          >
            Read the Docs
          </Button>
        </div>
      </div>
    </section>
  );
}
