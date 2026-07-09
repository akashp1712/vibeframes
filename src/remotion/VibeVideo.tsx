import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Backdrop } from "./blocks/Backdrop";
import { ThroughLine } from "./blocks/ThroughLine";
import { KineticTitle } from "./blocks/KineticTitle";
import { BulletReveal } from "./blocks/BulletReveal";
import { StatReveal } from "./blocks/StatReveal";
import { LogoOutro } from "./blocks/LogoOutro";
import { BarChart } from "./blocks/BarChart";
import { CodeReveal } from "./blocks/CodeReveal";
import { FlowDiagram } from "./blocks/FlowDiagram";
import { SplitCompare } from "./blocks/SplitCompare";
import { BigQuote } from "./blocks/BigQuote";
import { DeviceMockup } from "./blocks/DeviceMockup";
import { AudioPulse } from "./blocks/AudioPulse";
import { TitleCard } from "./blocks/TitleCard";
import { Outro } from "./blocks/Outro";
import { PaletteProvider } from "./palette-context";
import { DEFAULT_PALETTE, type Palette } from "./palettes";
import type { Composition } from "@/harness/composition/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BLOCKS: Record<string, React.ComponentType<any>> = {
  KineticTitle,
  BulletReveal,
  StatReveal,
  LogoOutro,
  BarChart,
  CodeReveal,
  FlowDiagram,
  SplitCompare,
  BigQuote,
  DeviceMockup,
  AudioPulse,
  // legacy aliases
  TitleCard,
  Outro,
};

const TRANSITION_FRAMES = 18;

// Alternate the transition per gap so the film has rhythm, not one repeated
// effect. Deterministic (indexed) → reproducible renders.
function transitionFor(index: number) {
  if (index % 3 === 0) return fade();
  return slide({ direction: index % 2 === 0 ? "from-right" : "from-bottom" });
}

const timing = springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_FRAMES });

/**
 * A gentle, continuous "camera" — a slow zoom + drift on scene content so
 * nothing sits perfectly still. Ken-Burns-lite; alternates direction per scene.
 */
const CameraDrift: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => {
  const frame = useCurrentFrame();
  const dir = index % 2 === 0 ? 1 : -1;
  const scale = 1.02 + 0.03 * (0.5 + 0.5 * Math.sin(frame / 120));
  const x = Math.sin(frame / 140) * 10 * dir;
  const y = Math.cos(frame / 160) * 8 * dir;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale}) translate(${x}px, ${y}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

/**
 * The whole video as a pure function of the composition JSON. Scenes flow into
 * each other via TransitionSeries (no hard cuts), over an always-on Backdrop.
 * Powers both <Player> and renderMedia().
 */
export const VibeVideo: React.FC<{ composition: Composition; palette?: Palette }> = ({
  composition,
  palette = DEFAULT_PALETTE,
}) => {
  const clips = composition.clips.filter((c) => BLOCKS[c.block]);
  // Total runtime = last clip end + the transition overlaps we add below.
  const totalFrames = clips.reduce(
    (max, c) => Math.max(max, c.from + c.durationInFrames),
    0,
  );

  // Build a flat list of alternating Transition / Sequence children —
  // TransitionSeries reads its DIRECT children, so no wrapper fragments.
  const children: React.ReactNode[] = [];
  clips.forEach((clip, i) => {
    const Block = BLOCKS[clip.block];
    if (i > 0) {
      children.push(
        <TransitionSeries.Transition
          key={`t-${clip.id}`}
          presentation={transitionFor(i)}
          timing={timing}
        />,
      );
    }
    children.push(
      <TransitionSeries.Sequence
        key={clip.id}
        // extend slightly so the overlap doesn't eat scene content
        durationInFrames={clip.durationInFrames + (i > 0 ? TRANSITION_FRAMES : 0)}
      >
        {/* palette.accent flows in as the block's accent unless a clip overrides it */}
        <CameraDrift index={i}>
          <Block accent={palette.accent} {...clip.props} total={clip.durationInFrames} />
        </CameraDrift>
      </TransitionSeries.Sequence>,
    );
  });

  return (
    <PaletteProvider value={palette}>
      <AbsoluteFill style={{ background: palette.bg }}>
        <Backdrop hue={palette.hue} />
        <ThroughLine accent={palette.accent} durationInFrames={totalFrames} />
        <TransitionSeries>{children}</TransitionSeries>
      </AbsoluteFill>
    </PaletteProvider>
  );
};
