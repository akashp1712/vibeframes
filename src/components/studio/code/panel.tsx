import { Code2, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface CodePanelProps {
  html: string | null;
}

export function CodePanel({ html }: CodePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const lines = useMemo(() => (html ? formatHtml(html).split("\n") : []), [html]);

  const handleCopy = () => {
    if (!html) return;
    navigator.clipboard.writeText(html).catch(() => {
      // Clipboard write requires user gesture or Clipboard API permission.
      // Silently no-op if denied — the user will notice nothing happened.
    });
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "hidden shrink-0 flex-col overflow-hidden border-l border-border bg-background transition-all duration-200 lg:flex",
        isOpen ? "w-80 xl:w-96" : "w-10 cursor-pointer hover:bg-muted/30"
      )}
      onClick={!isOpen ? () => setIsOpen(true) : undefined}
    >
      {/* Collapsed State */}
      {!isOpen && (
        <div className="flex h-full flex-col items-center py-4">
        <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            className="flex items-center justify-center rounded-md p-1 hover:bg-muted text-muted-foreground transition-colors mb-4"
            aria-label="Expand code panel"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center justify-center flex-1">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground [writing-mode:vertical-rl] rotate-180">
              Composition HTML
            </span>
          </div>
        </div>
      )}

      {/* Expanded State */}
      {isOpen && (
        <>
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-card/40 px-4">
            <div className="flex items-center gap-2">
              <Code2 className="size-3.5 text-muted-foreground" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Composition HTML
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                disabled={!html}
                aria-label={isCopied ? "Copied" : "Copy HTML to clipboard"}
                className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                {isCopied ? (
                  <>
                    <Check className="size-3 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="flex items-center justify-center rounded-md p-1 hover:bg-muted text-muted-foreground transition-colors ml-1"
                aria-label="Collapse code panel"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
          {html ? (
            <ScrollArea className="min-h-0 flex-1">
              <div className="flex font-mono text-[11px] leading-[1.6]">
                {/* Line numbers gutter */}
                <div className="sticky left-0 select-none border-r border-border bg-card/40 px-2 py-3 text-right text-muted-foreground/50">
                  {lines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                {/* Code content */}
                <pre className="flex-1 overflow-x-auto px-3 py-3 text-foreground">
                  {lines.map((line, i) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: highlightHtmlLine(line) || "&nbsp;" }} />
                  ))}
                </pre>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-xs text-muted-foreground/60">HTML source will appear here.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Light-touch HTML pretty-printer for our serialized composition output.
 * Inserts newlines + 2-space indents at each tag boundary so the line numbers
 * gutter has something meaningful to count.
 */
function formatHtml(html: string): string {
  // Insert newline before each opening tag (except the first) and before closing tags.
  let out = html
    .replace(/></g, ">\n<")
    .trim();

  // Indent based on tag depth.
  const lines = out.split("\n");
  const indented: string[] = [];
  let depth = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("</")) depth = Math.max(0, depth - 1);
    indented.push("  ".repeat(depth) + line);
    // Track depth changes: an opening tag (not self-closing, not just closing) increases depth.
    if (line.startsWith("<") && !line.startsWith("</") && !line.endsWith("/>")) {
      // If the line also contains the matching close (e.g., <span>foo</span>), don't increase.
      const openMatch = line.match(/^<(\w+)/);
      const tagName = openMatch?.[1];
      if (tagName) {
        const closeRegex = new RegExp(`</${tagName}>`);
        if (!closeRegex.test(line)) depth += 1;
      }
    }
  }
  out = indented.join("\n");
  return out;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Token-color an HTML line for display. Returns an HTML string with span markup.
 * We work on the escaped representation so we can highlight the angle brackets
 * themselves with color.
 */
function highlightHtmlLine(line: string): string {
  if (!line) return "";
  const escaped = escapeHtml(line);
  // Highlight strings first (so attr values don't interfere with attr-name regex).
  let out = escaped.replace(/(=)(&quot;)([^&]*?)(&quot;)/g, (_, eq, q1, val, q2) => {
    return `${eq}<span class="text-emerald-600 dark:text-emerald-400">${q1}${val}${q2}</span>`;
  });
  // Attribute names: word followed by =
  out = out.replace(/(\s)([a-zA-Z-]+)(=)/g, (_, sp, name, eq) => {
    return `${sp}<span class="text-violet-600 dark:text-violet-400">${name}</span>${eq}`;
  });
  // Tag open/close (e.g. &lt;div, &lt;/div&gt;, &gt;)
  out = out.replace(
    /(&lt;\/?)([a-zA-Z][\w-]*)/g,
    (_, br, tag) =>
      `<span class="text-rose-600 dark:text-rose-400">${br}${tag}</span>`,
  );
  out = out.replace(/(&gt;)/g, `<span class="text-rose-600 dark:text-rose-400">$1</span>`);
  // Comments
  out = out.replace(/(&lt;!--.*?--&gt;)/g, `<span class="text-muted-foreground italic">$1</span>`);
  return out;
}
