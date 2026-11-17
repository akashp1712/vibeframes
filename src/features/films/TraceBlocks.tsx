import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEMES, type Film } from "./schema";

export function ActionTrail({ film, duration }: { film: Film; duration: number }) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  const square = height === width;
  const t = THEMES[film.style];
  const steps = film.trace.steps;
  const active = Math.min(steps.length - 1, Math.floor(frame / (duration / steps.length)));
  const step = steps[active];
  return (
    <AbsoluteFill
      style={{
        padding: portrait ? "280px 75px 180px" : square ? "145px 65px 100px" : "175px 100px 90px",
        color: t.ink,
      }}
    >
      <div style={{ fontSize: 20, letterSpacing: 3, opacity: 0.55, marginBottom: 22 }}>
        THE RUN, MADE VISIBLE
      </div>
      <div
        style={{
          fontSize: portrait ? 76 : square ? 58 : 80,
          fontWeight: 500,
          letterSpacing: -4,
          lineHeight: 1.05,
          maxWidth: 1300,
        }}
      >
        {film.brief.feature}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: portrait ? "column" : "row",
          gap: square ? 24 : 50,
          marginTop: portrait ? 65 : square ? 35 : 65,
          flex: 1,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            width: portrait ? "100%" : "46%",
            display: "flex",
            flexDirection: "column",
            gap: steps.length > 6 ? 6 : 12,
          }}
        >
          {steps.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: square ? 10 : 20,
                padding: square || steps.length > 6 ? "12px 14px" : "18px 22px",
                borderRadius: 12,
                background: i === active ? t.accent : t.panel,
                color: i === active ? "#1c2420" : t.ink,
                opacity: i > active ? 0.4 : 1,
              }}
            >
              <div style={{ width: 32, fontSize: 19, opacity: 0.55 }}>
                {i < active
                  ? s.status === "error"
                    ? "!"
                    : s.status === "pending"
                      ? "..."
                      : "OK"
                  : `0${i + 1}`}
              </div>
              <div style={{ fontSize: portrait ? 30 : square ? 23 : 28 }}>{s.label}</div>
              <span style={{ marginLeft: "auto", fontSize: square ? 12 : 15, opacity: 0.5 }}>
                {s.kind}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            flex: 1,
            background: t.ink,
            color: t.bg,
            borderRadius: 20,
            padding: portrait ? 45 : square ? 28 : 55,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 17,
              letterSpacing: 2,
              opacity: 0.55,
            }}
          >
            <span>EVENT / {step.id}</span>
            <span>{step.status.toUpperCase()}</span>
          </div>
          <div
            style={{
              fontSize: portrait ? 55 : square ? 40 : 58,
              lineHeight: 1.1,
              letterSpacing: -2,
              marginTop: 42,
              marginBottom: 28,
            }}
          >
            {step.label}
          </div>
          <div
            style={{ fontSize: portrait ? 30 : square ? 23 : 27, lineHeight: 1.5, opacity: 0.7 }}
          >
            {step.detail}
          </div>
          <div
            style={{
              marginTop: 40,
              borderTop: `1px solid ${t.bg}30`,
              paddingTop: 25,
              color: t.accent,
              fontSize: square ? 16 : 20,
              overflowWrap: "anywhere",
              fontFamily: "VibeSans, sans-serif",
            }}
          >
            {step.evidence || "No evidence reference supplied"}
          </div>
          <div style={{ fontSize: 15, marginTop: 20, opacity: 0.5 }}>
            {step.durationMs.toLocaleString("en-US")} ms · source-reported duration
          </div>
        </div>
      </div>
      <div style={{ marginTop: 22, fontSize: 17, opacity: 0.5 }}>
        {film.trace.isDemo
          ? "ILLUSTRATIVE RUN · SAMPLE DATA"
          : "SOURCE-REPORTED EVENTS · EDITORIAL TIMING"}
      </div>
    </AbsoluteFill>
  );
}
export function OutcomeReceipt({ film }: { film: Film }) {
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();
  const portrait = height > width;
  const square = height === width;
  const t = THEMES[film.style];
  const outputs = film.trace.steps.filter((s) => s.kind === "output");
  const result = outputs.at(-1) || film.trace.steps.at(-1)!;
  const hasOutput = outputs.length > 0;
  const p = spring({ fps: 30, frame, config: { damping: 24 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 80 }}>
      <div
        style={{
          width: Math.min(width - 160, portrait ? 850 : 1200),
          background: t.panel,
          borderRadius: 24,
          padding: portrait ? 65 : 70,
          color: t.ink,
          transform: `translateY(${(1 - p) * 70}px)`,
          opacity: p,
          boxShadow: "0 30px 70px #00000012",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 20,
            letterSpacing: 2,
          }}
        >
          <span>OUTCOME RECEIPT</span>
          <span style={{ opacity: 0.45 }}>0{film.trace.steps.length}</span>
        </div>
        <div style={{ height: 1, background: `${t.ink}20`, margin: "35px 0" }} />
        <div
          style={{
            fontSize: portrait ? 72 : square ? 64 : 88,
            lineHeight: 1.06,
            letterSpacing: -4,
          }}
        >
          {hasOutput ? result.label : "No output event supplied"}
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.5, opacity: 0.7, marginTop: 30 }}>
          {result.detail}
        </div>
        <div
          style={{
            background: t.accent,
            color: "#1c2420",
            padding: "20px 26px",
            borderRadius: 10,
            fontFamily: "VibeSans, sans-serif",
            fontSize: 23,
            marginTop: 35,
            opacity: interpolate(frame, [18, 30], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {result.evidence || "No evidence reference supplied"}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 18,
            marginTop: 30,
            opacity: 0.55,
          }}
        >
          <span>Source reports: {result.status}</span>
          <span>{film.trace.isDemo ? "Illustrative sample" : "Not independently verified"}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
