import type { AgentStatus } from "@/harness/react/use-harness-chat";

const LABEL: Record<AgentStatus, string> = {
  idle: "ready",
  thinking: "planning scenes",
  "calling-tool": "building clips",
  streaming: "wrapping up",
  done: "ready",
  error: "error",
};

export function Topbar({
  status,
  canExport,
  exporting,
  onExport,
}: {
  status: AgentStatus;
  canExport: boolean;
  exporting: boolean;
  onExport: () => void;
}) {
  const live = status === "thinking" || status === "calling-tool" || status === "streaming";
  return (
    <header className="studio-topbar">
      <div className="studio-wordmark">
        <span className="studio-dot" />
        VibeFrames
      </div>
      <div className="studio-meta">
        <span className="studio-status-chip" data-live={live}>
          <span className="studio-pulse" />
          {LABEL[status]}
        </span>
        {canExport && (
          <button className="studio-export" onClick={onExport} disabled={exporting}>
            {exporting ? "Rendering…" : "Export mp4 ↓"}
          </button>
        )}
      </div>
    </header>
  );
}
