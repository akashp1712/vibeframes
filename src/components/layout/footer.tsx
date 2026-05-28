const links = [
  { label: "Mastra", href: "https://mastra.ai" },
  { label: "HyperFrames", href: "https://www.hyperframes.dev" },
  { label: "GitHub", href: "https://github.com/akashp1712/vibeframes" },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs text-muted-foreground">
        <span>VibeFrames — MIT License</span>
        <div className="flex gap-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
