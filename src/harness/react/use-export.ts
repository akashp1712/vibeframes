import { useState, useCallback } from "react";

/** Kick off a server-side Remotion render and hand back the mp4 url. */
export function useExport(projectId: string) {
  const [exporting, setExporting] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const run = useCallback(
    async (paletteId?: string) => {
      if (exporting) return;
      setExporting(true);
      setUrl(null);
      try {
        const res = await fetch("/api/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, paletteId }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Render failed");
        const { url } = await res.json();
        setUrl(url);
        return url as string;
      } finally {
        setExporting(false);
      }
    },
    [projectId, exporting],
  );

  return { run, exporting, url };
}
