import Link from "next/link";
import { Film, ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Film className="size-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">
            VibeFrames
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" nativeButton={false} render={<a href="https://github.com/akashp1712/vibeframes" target="_blank" rel="noopener noreferrer" />}>
            <Github data-icon="inline-start" />
            <span className="hidden sm:inline">GitHub</span>
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/studio" />}>
            Open Studio
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </header>
  );
}
