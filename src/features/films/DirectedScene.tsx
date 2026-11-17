import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEMES, type Film, type Scene } from "./schema";
import { TextReveal } from "./TextReveal";
import { MotionMark } from "./MotionMark";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const settle = (f: number, delay = 0) =>
  spring({
    frame: Math.max(0, f - delay),
    fps: 30,
    config: { damping: 22, stiffness: 150, mass: 1 },
  });

/** Source-bound shots. All movement is a pure function of frame, including camera and cuts. */
export function DirectedScene({ film, scene, index }: { film: Film; scene: Scene; index: number }) {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  const t = THEMES[film.style];
  const W = portrait ? 1080 : 1920,
    H = portrait ? 1920 : 1080;
  const scale = Math.min(width / W, height / H);
  const dark = ["statement", "trace", "endcard"].includes(scene.block);
  const bg = dark ? t.ink : t.bg,
    ink = dark ? t.bg : t.ink;
  const headline = index === 0 ? film.story.hooks[film.hook] : scene.headline;
  const enter = settle(f);
  const exit = scene.block === "endcard" ? 0 : ramp(f, scene.duration - 9, scene.duration - 1);
  const center = {
    position: "absolute" as const,
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    flexDirection: "column" as const,
  };
  const label = { fontSize: 20, letterSpacing: 3, textTransform: "uppercase" as const };
  const stepSpan = (scene.duration - 24) / film.trace.steps.length;
  const active = Math.min(
    film.trace.steps.length - 1,
    Math.max(0, Math.floor((f - 12) / stepSpan)),
  );
  const event = film.trace.steps[active];
  const local = f - 12 - active * stepSpan;
  const result =
    film.trace.steps.filter((s) => s.kind === "output").at(-1) || film.trace.steps.at(-1)!;
  const isTitle = scene.block === "statement" || scene.block === "endcard";
  return (
    <AbsoluteFill
      style={{ background: bg, overflow: "hidden", fontFamily: "VibeSans, sans-serif", color: ink }}
    >
      <div
        style={{
          position: "absolute",
          width: W,
          height: H,
          left: "50%",
          top: "50%",
          transform: `translate(-50%,-50%) scale(${scale})`,
        }}
      >
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${ink}08 1px,transparent 1px),linear-gradient(90deg,${ink}08 1px,transparent 1px)`,
            backgroundSize: "90px 90px",
            maskImage: "radial-gradient(ellipse at center,black,transparent 75%)",
          }}
        />
        <div style={{ position: "absolute", left: 65, top: 48, fontSize: 28, fontWeight: 650 }}>
          {film.brief.product}
          <span style={{ color: t.accent }}> /</span>
        </div>
        <div style={{ position: "absolute", right: 65, top: 57, ...label, opacity: 0.5 }}>
          FIELD NOTES — 0{index + 1}
        </div>
        <AbsoluteFill
          style={{
            transform: `translateY(${-exit * 90}px) scale(${1 + exit * 0.04})`,
            opacity: 1 - exit,
          }}
        >
          {isTitle && (
            <>
              <div
                style={{
                  position: "absolute",
                  width: portrait ? 850 : 1100,
                  height: portrait ? 850 : 1100,
                  left: W / 2 - (portrait ? 425 : 550),
                  top: H / 2 - (portrait ? 425 : 550),
                  border: `1px solid ${ink}20`,
                  borderRadius: "50%",
                  transform: `scale(${0.65 + enter * 0.35 + f * 0.0005})`,
                }}
              />
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: W / 2 - 65,
                    top: H / 2 - 65,
                    width: 130,
                    height: 130,
                    borderRadius: 30,
                    background: t.accent,
                    opacity: 0.13,
                    transform: `rotate(${i * 120 + f * 0.14}deg) translateX(${portrait ? 380 : 650}px) rotate(${35 + f * 0.25}deg)`,
                  }}
                />
              ))}
              <div
                style={{
                  ...center,
                  top: portrait ? 510 : 230,
                  padding: "0 100px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{ ...label, color: t.accent, marginBottom: 42, opacity: ramp(f, 3, 12) }}
                >
                  {scene.eyebrow}
                </div>
                <div
                  style={{
                    fontSize: portrait ? 118 : 156,
                    lineHeight: 0.98,
                    fontWeight: 620,
                    letterSpacing: -8,
                    maxWidth: 1550,
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: "0 .23em",
                  }}
                >
                  {scene.block === "endcard" ? (
                    <div style={{ position: "relative", width: W - 200, height: 200 }}>
                      <TextReveal
                        text={headline}
                        fontFamily="VibeSans"
                        fontSize={Math.min(
                          portrait ? 130 : 180,
                          ((W - 220) / Math.max(1, headline.length)) * 1.6,
                        )}
                        color={ink}
                        initialScale={1.8}
                      />
                    </div>
                  ) : (
                    headline.split(" ").map((word, i) => (
                      <span
                        key={i}
                        style={{ display: "inline-block", overflow: "hidden", paddingBottom: 18 }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            transform: `translateY(${(1 - settle(f, i * 2 + 5)) * 130}%) rotate(${(1 - settle(f, i * 2 + 5)) * 8}deg)`,
                          }}
                        >
                          {word}
                        </span>
                      </span>
                    ))
                  )}
                </div>
                <div
                  style={{
                    height: 5,
                    width: 180,
                    background: t.accent,
                    marginTop: 34,
                    transform: `scaleX(${settle(f, 18)})`,
                    transformOrigin: "left",
                  }}
                />
                <div
                  style={{
                    fontSize: 29,
                    lineHeight: 1.5,
                    maxWidth: 1000,
                    marginTop: 35,
                    opacity: ramp(f, 23, 36),
                    transform: `translateY(${(1 - settle(f, 23)) * 25}px)`,
                  }}
                >
                  {scene.body}
                </div>
                {scene.block === "endcard" && (
                  <div
                    style={{
                      marginTop: 55,
                      border: `1px solid ${ink}35`,
                      borderRadius: 60,
                      padding: "20px 35px",
                      fontSize: 24,
                      display: "flex",
                      gap: 35,
                      alignItems: "center",
                    }}
                  >
                    {film.brief.url || film.brief.product}
                    <MotionMark kind="arrow" />
                  </div>
                )}
              </div>
            </>
          )}
          {scene.block === "trace" && (
            <>
              <div style={{ position: "absolute", left: 85, top: portrait ? 200 : 155, right: 85 }}>
                <div style={{ ...label, color: t.accent }}>A SIGNAL BECOMES AN OUTCOME</div>
                <div style={{ fontSize: portrait ? 66 : 76, letterSpacing: -3, marginTop: 20 }}>
                  {film.brief.feature}
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: portrait ? 410 : 360,
                  height: 240,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 110,
                    left: 0,
                    width: W,
                    height: 2,
                    background: `${ink}20`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 109,
                    left: 0,
                    width: W * ramp(f, 10, scene.duration - 15),
                    height: 4,
                    background: t.accent,
                    boxShadow: `0 0 30px ${t.accent}`,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: W / 2 - 85,
                    display: "flex",
                    gap: 80,
                    transform: `translateX(${-interpolate(
                      f,
                      film.trace.steps.map((_, i) => 12 + i * stepSpan),
                      film.trace.steps.map((_, i) => i * 250),
                      clamp,
                    )}px)`,
                  }}
                >
                  {film.trace.steps.map((s, i) => (
                    <div key={s.id} style={{ width: 170, flexShrink: 0, textAlign: "center" }}>
                      <div
                        style={{
                          width: 100,
                          height: 100,
                          margin: "60px auto 25px",
                          display: "grid",
                          placeItems: "center",
                          borderRadius: s.kind === "approval" ? 25 : 50,
                          background: i === active ? t.accent : t.ink,
                          border: `2px solid ${i <= active ? t.accent : ink + "40"}`,
                          color: i === active ? t.ink : ink,
                          fontSize: 34,
                          transform: `scale(${i === active ? 1.15 : 0.8}) rotate(${s.kind === "approval" ? 45 : 0}deg)`,
                          boxShadow: i === active ? `0 0 65px ${t.accent}35` : "none",
                        }}
                      >
                        <span
                          style={{ transform: `rotate(${s.kind === "approval" ? -45 : 0}deg)` }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          opacity: i === active ? 1 : 0.4,
                          textTransform: "uppercase",
                          letterSpacing: 2,
                        }}
                      >
                        {s.kind}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: portrait ? 85 : 300,
                  right: portrait ? 85 : 300,
                  top: portrait ? 780 : 650,
                  opacity: ramp(local, 0, 4),
                  transform: `translateY(${(1 - settle(local)) * 24}px)`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    ...label,
                    color: t.accent,
                  }}
                >
                  <span>EVENT / {event.id}</span>
                  <span>{event.status}</span>
                </div>
                <div style={{ fontSize: portrait ? 68 : 58, letterSpacing: -2, marginTop: 20 }}>
                  {event.label}
                </div>
                <div style={{ fontSize: 27, lineHeight: 1.45, opacity: 0.65, marginTop: 16 }}>
                  {event.detail}
                </div>
                <div style={{ fontSize: 20, color: t.accent, marginTop: 24 }}>
                  {event.evidence || "No evidence reference supplied"}
                </div>
              </div>
            </>
          )}
          {scene.block === "evidence" && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: portrait ? 100 : 145,
                  top: portrait ? 230 : 260,
                  width: portrait ? 880 : 650,
                }}
              >
                <div style={{ ...label, opacity: 0.5 }}>THE PAPER TRAIL</div>
                <div
                  style={{
                    fontSize: portrait ? 105 : 110,
                    lineHeight: 1.03,
                    letterSpacing: -6,
                    marginTop: 30,
                  }}
                >
                  Outcome.
                  <br />
                  Evidence
                  <br />
                  <span style={{ fontStyle: "italic" }}>connected.</span>
                </div>
                <div style={{ fontSize: 25, opacity: 0.6, marginTop: 35, maxWidth: 600 }}>
                  Every outcome stays connected to its source event.
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: portrait ? 140 : 970,
                  top: portrait ? 900 : 200,
                  width: portrait ? 800 : 730,
                  perspective: 1200,
                }}
              >
                {[2, 1].map((i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      inset: 0,
                      height: 660,
                      border: `1px solid ${ink}20`,
                      background: t.panel,
                      borderRadius: 14,
                      transform: `translate(${i * 15}px,${i * 20}px) rotate(${i * 3}deg)`,
                    }}
                  />
                ))}
                <div
                  style={{
                    position: "relative",
                    padding: 55,
                    minHeight: 660,
                    background: t.panel,
                    border: `1px solid ${ink}15`,
                    borderRadius: 14,
                    boxShadow: "0 45px 80px #00000020",
                    transform: `translateY(${(1 - enter) * 300}px) rotateX(${(1 - enter) * 35}deg) rotate(${-3 + enter * 3}deg)`,
                  }}
                >
                  <div style={{ ...label, display: "flex", justifyContent: "space-between" }}>
                    <span>OUTCOME RECEIPT</span>
                    <span>0{film.trace.steps.length}</span>
                  </div>
                  <div style={{ borderTop: `2px dashed ${ink}25`, margin: "35px 0" }} />
                  <div style={{ fontSize: 54, lineHeight: 1.1, letterSpacing: -2 }}>
                    {film.trace.steps.some((s) => s.kind === "output")
                      ? result.label
                      : "No output event supplied"}
                  </div>
                  <div style={{ fontSize: 25, lineHeight: 1.5, opacity: 0.65, marginTop: 25 }}>
                    {result.detail}
                  </div>
                  <div
                    style={{
                      background: t.accent,
                      color: "#1c2420",
                      padding: 22,
                      fontSize: 23,
                      marginTop: 30,
                      overflowWrap: "anywhere",
                      clipPath: `inset(0 ${(1 - ramp(f, 22, 40)) * 100}% 0 0)`,
                    }}
                  >
                    {result.evidence || "No evidence reference supplied"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                      marginTop: 35,
                      opacity: ramp(f, 38, 43),
                      transform: `scale(${1 + (1 - settle(f, 38)) * 0.7})`,
                      transformOrigin: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        border: `2px solid ${ink}`,
                        borderRadius: 50,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {result.status === "success" ? <MotionMark kind="check" /> : "!"}
                    </div>
                    <span style={{ ...label }}>{result.status} · source reported</span>
                  </div>
                </div>
              </div>
            </>
          )}
          {scene.block === "comparison" && (
            <>
              <div style={{ ...center, top: portrait ? 230 : 170 }}>
                <div style={{ ...label, opacity: 0.5 }}>{scene.eyebrow}</div>
                <div
                  style={{
                    fontSize: portrait ? 80 : 85,
                    letterSpacing: -4,
                    marginTop: 25,
                    textAlign: "center",
                    maxWidth: W - 180,
                  }}
                >
                  {headline}
                </div>
              </div>
              {[film.brief.before, film.brief.after].map((text, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: portrait ? 90 : 160 + i * 820,
                    top: portrait ? 550 + i * 480 : 410,
                    width: portrait ? 900 : 780,
                    height: portrait ? 420 : 460,
                    padding: 55,
                    borderRadius: 20,
                    background: i ? t.ink : t.panel,
                    color: i ? t.bg : t.ink,
                    border: `1px solid ${t.ink}20`,
                    transform: `translateX(${(1 - settle(f, i ? 20 : 0)) * (i ? 300 : -300)}px) rotate(${(1 - settle(f, i ? 20 : 0)) * (i ? 6 : -6)}deg)`,
                    boxShadow: "0 25px 55px #00000012",
                  }}
                >
                  <div style={{ ...label, opacity: 0.5 }}>
                    {i ? "02 / WITH THE WORKFLOW" : "01 / BEFORE"}
                  </div>
                  <div style={{ fontSize: 66, lineHeight: 1.1, letterSpacing: -3, marginTop: 55 }}>
                    {text}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 45,
                      right: 45,
                      color: i ? t.accent : t.ink,
                      fontSize: 40,
                    }}
                  >
                    <MotionMark kind="arrow" />
                  </div>
                </div>
              ))}
            </>
          )}
          {scene.block === "stack" && (
            <>
              <div style={{ ...center, top: portrait ? 230 : 170 }}>
                <div style={{ ...label, opacity: 0.5 }}>{scene.eyebrow}</div>
                <div
                  style={{
                    fontSize: portrait ? 84 : 96,
                    letterSpacing: -5,
                    marginTop: 25,
                    textAlign: "center",
                    maxWidth: W - 150,
                  }}
                >
                  {headline}
                </div>
              </div>
              {["Source events", "Human review", "Shareable evidence"].map((text, i) => (
                <div
                  key={text}
                  style={{
                    position: "absolute",
                    left: portrait ? 110 : 260 + i * 460,
                    top: portrait ? 550 + i * 310 : 450 + i * 35,
                    width: portrait ? 860 : 480,
                    height: portrait ? 270 : 370,
                    padding: 45,
                    borderRadius: 22,
                    background: i === 1 ? t.ink : t.panel,
                    color: i === 1 ? t.bg : t.ink,
                    border: `1px solid ${t.ink}20`,
                    boxShadow: "0 25px 70px #00000015",
                    transform: `translateY(${(1 - settle(f, 6 + i * 7)) * 300}px) rotate(${(-5 + i * 5) * settle(f, 6 + i * 7)}deg)`,
                  }}
                >
                  <div style={{ fontSize: 22, opacity: 0.5 }}>0{i + 1} / HANDOFF</div>
                  <div
                    style={{
                      fontSize: portrait ? 55 : 49,
                      lineHeight: 1.1,
                      letterSpacing: -2,
                      marginTop: 55,
                    }}
                  >
                    {text}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 35,
                      right: 35,
                      fontSize: 32,
                      color: i === 1 ? t.accent : t.ink,
                    }}
                  >
                    <MotionMark kind={i === 1 ? "check" : "arrow"} />
                  </div>
                </div>
              ))}
            </>
          )}
        </AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 65,
            bottom: 40,
            fontSize: 15,
            letterSpacing: 2,
            opacity: 0.45,
          }}
        >
          {film.trace.isDemo
            ? "ILLUSTRATIVE SAMPLE · EDITORIAL TIMING"
            : "SOURCE-REPORTED EVENTS · EDITORIAL TIMING"}
        </div>
        <div style={{ position: "absolute", right: 65, bottom: 40, fontSize: 15, opacity: 0.45 }}>
          VIBEFRAMES / {String(index + 1).padStart(2, "0")}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            height: 5,
            width: W * ramp(f, 0, scene.duration),
            background: t.accent,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}
