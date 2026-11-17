import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { compareRuns } from "./delivery";
import { THEMES, type Film } from "./schema";
export function RunChanges({ film, duration }: { film: Film; duration: number }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  const square = height === width;
  const t = THEMES[film.style];
  const changes = film.previousTrace ? compareRuns(film.previousTrace, film.trace) : [];
  const active =
    changes[
      Math.min(changes.length - 1, Math.floor(frame / (duration / Math.max(1, changes.length))))
    ];
  const primary = active?.fields.find((field) => field !== "position") || "status";
  const value = (step: typeof active.before) =>
    !step
      ? "Not present"
      : primary === "durationMs"
        ? `${step.durationMs} ms`
        : primary in step
          ? String(step[primary as keyof typeof step]) || "Not supplied"
          : step.status;
  return (
    <AbsoluteFill
      style={{
        padding: portrait ? "260px 75px 150px" : square ? "150px 65px 90px" : "185px 100px 100px",
        justifyContent: "center",
        color: t.ink,
      }}
    >
      <div style={{ fontSize: 20, letterSpacing: 3, opacity: 0.6 }}>BETWEEN THE SUPPLIED RUNS</div>
      <div
        style={{
          fontSize: portrait ? 80 : square ? 62 : 88,
          letterSpacing: -3,
          lineHeight: 1.08,
          margin: "26px 0 48px",
        }}
      >
        {!film.previousTrace
          ? "Add a previous run."
          : !active
            ? "No event differences."
            : active.label}
      </div>
      {active ? (
        <>
          <div style={{ display: "flex", flexDirection: portrait ? "column" : "row", gap: 24 }}>
            {(
              [
                ["PREVIOUS", active.before],
                ["CURRENT", active.after],
              ] as const
            ).map(([label, step]) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  background: label === "CURRENT" ? t.accent : t.panel,
                  color: label === "CURRENT" ? "#1c2420" : t.ink,
                  borderRadius: 20,
                  padding: square ? 30 : 45,
                  minHeight: portrait ? 340 : 330,
                }}
              >
                <div style={{ fontSize: 18, letterSpacing: 2, opacity: 0.6 }}>
                  {label} / {primary === "durationMs" ? "DURATION" : primary.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: value(step).length > 60 ? (square ? 24 : 32) : square ? 38 : 52,
                    margin: "28px 0",
                    lineHeight: 1.2,
                    overflowWrap: "anywhere",
                  }}
                >
                  {value(step)}
                </div>
                {primary !== "detail" && (
                  <div style={{ fontSize: square ? 22 : 28, lineHeight: 1.4 }}>
                    {step?.detail || "No event with this ID in the supplied run."}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 20, lineHeight: 1.5, marginTop: 30 }}>
            {active.kind.toUpperCase()} / {active.id}
            {active.fields.length > 0 && ` · Fields: ${active.fields.join(", ")}`}
          </div>
          <div style={{ fontSize: 18, opacity: 0.6, marginTop: 16 }}>
            {changes.indexOf(active) + 1} of {changes.length} event differences · matched by event
            ID
          </div>
        </>
      ) : (
        <div style={{ fontSize: 30, lineHeight: 1.5, maxWidth: 1000 }}>
          {film.previousTrace
            ? "The recorded event fields and order match. This does not establish that the workflow or its environment is unchanged."
            : "Import a previous source in the studio to compare recorded events. No changes are inferred from the story."}
        </div>
      )}
      <div style={{ fontSize: 18, opacity: 0.55, marginTop: 40 }}>
        Observed differences, not a claim of improved performance.
      </div>
    </AbsoluteFill>
  );
}
