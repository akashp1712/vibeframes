import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BLOCKS, THEMES, timeline, type Film, type Scene } from "./schema";

import { ActionTrail, OutcomeReceipt } from "./TraceBlocks";

type Theme = (typeof THEMES)[keyof typeof THEMES];
const ease = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
function enter(frame: number, delay = 0) { return spring({ frame: Math.max(0, frame - delay), fps: 30, config: { damping: 23, stiffness: 110, mass: 0.9 } }); }

/** This demo is intentionally labelled. User screenshots replace it, never AI-fabricated UI. */
export function ProductSurface({ film, theme, imageIndex = 0 }: { film: Film; theme: Theme; imageIndex?: number }) {
  const src = film.images[imageIndex] || film.images[0];
  return <div style={{ background: theme.panel, color: theme.ink, width: "100%", height: "100%", borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 70px #00000018", border: `2px solid ${theme.ink}15` }}>
    <div style={{ height: 48, borderBottom: `1px solid ${theme.ink}15`, display: "flex", alignItems: "center", padding: "0 22px", gap: 9 }}>
      {[0, 1, 2].map(n => <div key={n} style={{ width: 9, height: 9, borderRadius: 9, background: theme.muted, opacity: .3 }} />)}
      <span style={{ fontSize: 14, marginLeft: 15, opacity: .6 }}>{film.brief.url || film.brief.product}</span>
      {!src && <span style={{ marginLeft: "auto", fontSize: 12, opacity: .55 }}>DEMO WORKSPACE</span>}
    </div>
    {src ? <Img src={src} style={{ width: "100%", height: "calc(100% - 48px)", objectFit: "contain" }} /> : <div style={{ display: "flex", height: "calc(100% - 48px)" }}>
      <div style={{ width: "21%", borderRight: `1px solid ${theme.ink}12`, padding: 26, fontSize: 18 }}><b>{film.brief.product}</b><div style={{ marginTop: 44, opacity: .5 }}>Workspace</div>{["Overview", "My projects", "This week"].map((s, i) => <div key={s} style={{ marginTop: 24, padding: "10px 8px", background: i === 2 ? theme.accent : "transparent", color: i === 2 ? "#1c2420" : theme.ink, borderRadius: 8 }}>{s}</div>)}</div>
      <div style={{ flex: 1, padding: 40 }}><div style={{ fontSize: 14, opacity: .5, marginBottom: 12 }}>YOUR WORK, IN FOCUS</div><div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1 }}>A little more clarity.</div>
        <div style={{ display: "flex", gap: 14, marginTop: 32 }}>{["To do", "In progress", "Complete"].map((title, col) => <div key={title} style={{ flex: 1, borderRadius: 10, background: `${theme.ink}06`, padding: 14 }}><div style={{ fontSize: 16, marginBottom: 20 }}>{title} <span style={{ opacity: .3 }}>0{col + 2}</span></div>{[0, 1].map(row => <div key={row} style={{ background: theme.panel, borderRadius: 8, padding: 16, marginBottom: 12, border: `1px solid ${theme.ink}12` }}><div style={{ width: 48, height: 7, background: col === 1 ? theme.accent : `${theme.muted}40`, borderRadius: 5, marginBottom: 20 }} /><div style={{ fontSize: 16, lineHeight: 1.4 }}>{["Make room for the work", "Bring the team together", "Ready for what’s next"][col]}</div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, fontSize: 12, opacity: .5 }}><span>Today</span><span>↗</span></div></div>)}</div>)}</div>
      </div>
    </div>}
  </div>;
}

function WordTitle({ text, frame, size, color }: { text: string; frame: number; size: number; color: string }) {
  return <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 .24em", color, fontSize: size, fontWeight: 500, lineHeight: 1.02, letterSpacing: "-.065em", maxWidth: "94%" }}>{text.split(" ").map((word, i) => <div key={i} style={{ overflow: "hidden", paddingBottom: ".1em" }}><div style={{ transform: `translateY(${(1 - enter(frame, i * 3)) * 110}%)` }}>{word}</div></div>)}</div>;
}

function SceneView({ film, scene, index }: { film: Film; scene: Scene; index: number }) {
  const frame = useCurrentFrame(); const { width, height } = useVideoConfig();
  const t = THEMES[film.style]; const portrait = height > width; const square = height === width;
  const unit = Math.min(width / 1920, height / 1080);
  const titleSize = portrait ? 104 : square ? 84 : 116;
  const inProgress = enter(frame); const leave = interpolate(frame, [scene.duration - 9, scene.duration - 1], [1, 0], ease);
  const dark = scene.block === "statement" || scene.block === "endcard";
  const bg = dark ? t.ink : t.bg; const ink = dark ? t.bg : t.ink;
  const headline = index === 0 ? film.story.hooks[film.hook] : scene.headline;
  const inset = portrait ? 70 : 80 * unit;
  const title = <div style={{ fontSize: portrait ? 82 : square ? 66 : 78, lineHeight: 1.06, letterSpacing: "-.055em", fontWeight: 500, maxWidth: portrait ? 880 : 1300, margin: "0 auto" }}>{headline}</div>;
  const eyebrow = <div style={{ fontSize: portrait ? 24 : 21, letterSpacing: ".13em", textTransform: "uppercase", marginBottom: 27, opacity: .65 }}>{scene.eyebrow}</div>;
  return <AbsoluteFill style={{ background: bg, color: ink, fontFamily: "Arial, Helvetica, sans-serif", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: inset, left: inset, fontSize: 26, fontWeight: 600, letterSpacing: -1 }}>{film.brief.product}<span style={{ color: t.accent, marginLeft: 5 }}>◒</span></div>
    <div style={{ position: "absolute", top: inset + 6, right: inset, fontSize: 15, letterSpacing: 3, opacity: .45 }}>WORKFLOW FILM / 0{index + 1}</div>
    <AbsoluteFill style={{ opacity: leave }}>
      {scene.block === "trace" && <ActionTrail film={film} duration={scene.duration} />}
      {scene.block === "evidence" && <OutcomeReceipt film={film} />}
      {scene.block === "statement" && <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: inset, textAlign: "center" }}>
        <div style={{ width: 84, height: 84, border: `1px solid ${t.bg}40`, borderRadius: "50%", marginBottom: 56, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${interpolate(frame, [0, 75], [-35, 30])}deg)`, color: t.accent, fontSize: 46 }}>✳</div>
        {eyebrow}<WordTitle text={headline} frame={frame - 4} size={titleSize} color={ink} />
        <div style={{ fontSize: 26, opacity: interpolate(frame, [25, 40], [0, .65], ease), marginTop: 40 }}>{scene.body}</div>
        <div style={{ width: 85, height: 5, background: t.accent, marginTop: 60, transform: `scaleX(${inProgress})` }} />
      </AbsoluteFill>}
      {(scene.block === "product" || scene.block === "spotlight") && <AbsoluteFill style={{ paddingTop: portrait ? 300 : 175, alignItems: "center", textAlign: "center" }}>
        <div style={{ padding: "0 65px", opacity: inProgress, transform: `translateY(${(1 - inProgress) * 32}px)` }}>{eyebrow}{title}</div>
        <div style={{ width: portrait ? 1280 : square ? 950 : 1370, height: portrait ? 820 : square ? 540 : 700, marginTop: portrait ? 110 : 55, transform: `translateY(${(1 - inProgress) * 100}px) scale(${scene.block === "spotlight" ? interpolate(frame, [0, scene.duration], [1.02, 1.16]) : .94 + inProgress * .06})`, transformOrigin: "50% 50%" }}><ProductSurface film={film} theme={t} imageIndex={scene.block === "spotlight" ? 1 : 0} /></div>
        {scene.block === "spotlight" && <div style={{ position: "absolute", bottom: portrait ? 300 : 90, right: portrait ? 90 : 150, maxWidth: portrait ? 800 : 560, padding: "25px 34px", borderRadius: 14, background: t.accent, color: "#1c2420", fontSize: 28, textAlign: "left", lineHeight: 1.4, boxShadow: "0 16px 40px #00000020", opacity: enter(frame, 24), transform: `translateY(${(1 - enter(frame, 24)) * 35}px)` }}>{scene.body || film.brief.after}</div>}
      </AbsoluteFill>}
      {scene.block === "comparison" && <AbsoluteFill style={{ justifyContent: "center", padding: inset, textAlign: "center" }}>{eyebrow}{title}<div style={{ display: "flex", flexDirection: portrait ? "column" : "row", gap: 28, marginTop: 70 }}>
        {[film.brief.before, film.brief.after].map((text, i) => <div key={i} style={{ flex: 1, minHeight: portrait ? 340 : 330, padding: 50, borderRadius: 20, background: i === 1 ? t.accent : t.panel, color: i === 1 ? "#1c2420" : t.ink, textAlign: "left", opacity: enter(frame, i * 12), transform: `translateY(${(1 - enter(frame, i * 12)) * 50}px)` }}><div style={{ fontSize: 19, letterSpacing: 3, opacity: .5, marginBottom: 40 }}>{i === 0 ? "BEFORE" : `WITH ${film.brief.product.toUpperCase()}`}</div><div style={{ fontSize: portrait ? 56 : square ? 40 : 58, letterSpacing: -2, lineHeight: 1.15 }}>{text}</div><div style={{ marginTop: 38, fontSize: 36 }}>{i === 0 ? "↗" : "✓"}</div></div>)}
      </div></AbsoluteFill>}
      {scene.block === "stack" && <AbsoluteFill style={{ padding: inset, justifyContent: "center", textAlign: "center" }}>{eyebrow}<div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>{[film.brief.feature, film.brief.after, film.brief.cta].map((text, i) => <div key={i} style={{ width: portrait ? "100%" : "85%", padding: portrait ? "55px 35px" : "35px 45px", display: "flex", alignItems: "center", gap: 35, borderRadius: 14, background: i === 1 ? t.accent : t.panel, color: i === 1 ? "#1c2420" : t.ink, transform: `translateX(${(1 - enter(frame, i * 9)) * (i % 2 ? -150 : 150)}px)`, opacity: enter(frame, i * 9), textAlign: "left" }}><span style={{ fontSize: 20, opacity: .4 }}>0{i + 1}</span><span style={{ fontSize: portrait ? 48 : square ? 40 : 62, letterSpacing: -2 }}>{text}</span></div>)}</div></AbsoluteFill>}
      {scene.block === "endcard" && <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: inset }}>
        <div style={{ width: 110, height: 110, borderRadius: 30, color: t.ink, background: t.accent, fontSize: 65, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 48, transform: `rotate(${(1 - inProgress) * -35}deg) scale(${.85 + inProgress * .15})` }}>↗</div>
        {eyebrow}<WordTitle text={headline} frame={frame} size={portrait ? 120 : 150} color={ink} /><div style={{ fontSize: 34, marginTop: 40, opacity: enter(frame, 15) }}>{scene.body} <span style={{ color: t.accent }}>↗</span></div><div style={{ marginTop: 55, fontSize: 22, opacity: .5 }}>{film.brief.url}</div>
      </AbsoluteFill>}
    </AbsoluteFill>
    <div style={{ position: "absolute", bottom: inset / 2 + 18, left: inset, fontSize: 15, letterSpacing: 2, opacity: .55 }}>{film.trace.isDemo ? "ILLUSTRATIVE SAMPLE" : "SOURCE-REPORTED · REVIEWED BY AUTHOR"}</div>
    <div style={{ position: "absolute", bottom: inset / 2, left: inset, right: inset, display: "flex", gap: 9 }}>{film.story.scenes.map((s, i) => <div key={s.id} style={{ height: 3, flex: 1, background: `${ink}20` }}><div style={{ height: "100%", width: `${i < index ? 100 : i > index ? 0 : frame / scene.duration * 100}%`, background: dark ? t.accent : t.ink }} /></div>)}</div>
  </AbsoluteFill>;
}

export function FeatureFilm({ film }: { film: Film }) {
  return <AbsoluteFill>{timeline(film.story).map((scene, index) => <Sequence key={`${scene.id}-${index}`} from={scene.from} durationInFrames={scene.duration} name={BLOCKS[scene.block].name}><SceneView film={film} scene={scene} index={index} /></Sequence>)}</AbsoluteFill>;
}
