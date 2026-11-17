// Adapted from shadcn-labs/snapcn TextReveal. MIT © 2026 Sri Nath.
// See snapcn.LICENSE. Theme adapter removed; measurements wait for the bundled font.
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  cancelRender,
  Easing,
  getRemotionEnvironment,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFilmFont } from "./font";
export interface TextRevealProps {
  /** The sentence to assemble. Its first word leads the reveal. */
  text?: string;
  /** Final font size in px (the size the line settles at). */
  fontSize?: number;
  /** Overrides the design system's `foreground`. */
  color?: string;
  fontWeight?: number | string;
  /** Design-system token overrides. */

  mode?: "light" | "dark";
  /**
   * The face this scene paints its words in — a label from `fonts.ts`
   * ("Inter", "Space Grotesk", "Instrument Serif") or a CSS family you have
   * loaded yourself. Unset, the scene keeps the face it was designed around.
   *
   * Overrides `theme.fontFamily`, which is how a brand kit re-skins a whole
   * timeline from one value.
   */
  fontFamily?: string;
  /** How much larger the lead word starts (2 = twice the final size). */
  initialScale?: number;
  /** Frames the lead word fades in over at the very start. */
  introDuration?: number;
  /**
   * Frames the lead word spends big and centred, drifting toward the viewer,
   * before it falls back.
   */
  holdDuration?: number;
  /** How far toward the viewer the lead word drifts during the hold (1.06 = 6% larger). */
  pushScale?: number;
  /** Frames the lead word takes to fall back from its peak to its final size. */
  recedeDuration?: number;
  /**
   * Frames the line takes to slide left into its resting place. Starts with the
   * recede but runs well past it, so the line barely moves while the lead word
   * is still falling back and only travels once it has landed.
   */
  assembleDuration?: number;
  /** Frames after the recede begins before the second word pushes in. */
  wordDelay?: number;
  /** Frames between each trailing word pushing in. */
  wordStagger?: number;
  /** Frames a trailing word takes to push into its slot. */
  wordDuration?: number;
  /** How far right of its slot a trailing word starts, in em. */
  wordPush?: number;
  /**
   * Frames a trailing word fades in over. Deliberately tiny — the word should
   * read as _pushed_ into place, not faded in. Raise it for a softer arrival.
   */
  wordFade?: number;
  /** Resting letter-spacing (CSS value, em recommended). */
  letterSpacing?: string;
  speed?: number;
  className?: string;
}

/**
 * The lead word's drift toward the viewer: decelerating, so it hangs at the
 * peak for a beat before it falls back.
 */
const PUSH_EASE = Easing.bezier(0.25, 1, 0.5, 1);

/**
 * Shared curve for the recede and the slide-left. Heavily eased in — barely 10%
 * travelled at a third of the way through — so a long `assembleDuration` keeps
 * the line practically still while the lead word falls back, then carries it
 * left and decelerates to a dead stop. No bounce.
 */
const ZOOM_EASE = Easing.bezier(0.5, 0, 0.05, 1);

/** A trailing word's push into its slot: quick off the mark, long soft landing. */
const WORD_EASE = Easing.bezier(0.22, 0.8, 0.36, 1);

/**
 * Cinematic "zoom-out from the lead word" reveal, in four beats:
 *
 * 1. The lead word fades in large and centred — close to the viewer.
 * 2. It drifts a little _closer_ still, hanging at the peak.
 * 3. It falls back to its final size, roughly in place.
 * 4. Only once it has landed does the line travel left, while the trailing words
 *    push in one by one from the right and settle.
 *
 * Beats 3 and 4 start on the same frame but run on very different clocks: the
 * recede is short, the slide is long and heavily eased in, which is what makes
 * the word read as going _back_ first and moving left second rather than doing
 * both at once. The trailing words stay invisible until `wordDelay` frames into
 * the recede — so none of them show up mid-flight while the lead word is still
 * travelling — then cut in a push-distance right of their slot and slide home.
 *
 * Only `scale`, `translate` and `opacity` animate — nothing reflows — so it
 * stays GPU-cheap with a constant baseline and no layout shift.
 */
export function TextReveal({
  text = "Meet Acme Billing",
  fontSize = 72,
  color,
  fontWeight = 600,
  fontFamily,
  initialScale = 2.3,
  introDuration = 6,
  holdDuration = 12,
  pushScale = 1.06,
  recedeDuration = 14,
  assembleDuration = 30,
  wordDelay = 7,
  wordStagger = 4,
  wordDuration = 14,
  wordPush = 0.5,
  wordFade = 2,
  letterSpacing = "-0.03em",
  speed = 1,
  className,
}: TextRevealProps) {
  const frame = useCurrentFrame() * speed;
  const { width } = useVideoConfig();
  const face = fontFamily ?? "VibeSans";
  const fill = color ?? "#ffffff";

  // The lead word is centred in the frame while big, then lands at its natural
  // spot in the line. That needs the line's rendered width and where the lead
  // word's centre sits inside it — both constant across frames, so measure once
  // and hold the render until they're known.
  const lineRef = useRef<HTMLSpanElement>(null);
  const leadRef = useRef<HTMLSpanElement>(null);
  const [handle] = useState(() => delayRender("text-reveal: measure line"));
  const baselineRef = useRef<HTMLSpanElement>(null);
  const [metrics, setMetrics] = useState<{
    lineWidth: number;
    leadRatio: number;
    /** Distance from the top of the line box down to the text baseline. */
    baseline: number;
  } | null>(null);

  // Measure the natural line geometry. offsetWidth / offsetLeft are layout px,
  // unaffected by the animated transform or the Player's display scaling, so they
  // give the unscaled line width and the lead word's centre directly.
  useEffect(() => {
    let live = true;
    loadFilmFont()
      .then(() => {
        if (!live) return;
        const line = lineRef.current;
        const lead = leadRef.current;
        if (!line || !lead) {
          continueRender(handle);
          return;
        }
        const lineWidth = line.offsetWidth;
        const leadCenter = lead.offsetLeft + lead.offsetWidth / 2;
        // An empty, zero-sized inline-block sits with its bottom edge on the text
        // baseline, so its offsetTop *is* the baseline — read from the font's real
        // metrics rather than guessed from a line-height ratio.
        const baseline = baselineRef.current?.offsetTop ?? line.offsetHeight * 0.8;
        setMetrics({ lineWidth, leadRatio: leadCenter / lineWidth, baseline });
      })
      .catch(cancelRender);
    return () => {
      live = false;
    };
  }, [handle, text, fontSize, fontFamily]);

  // Release the render only after the measurement has re-rendered, so the very
  // first captured frame already carries the correct geometry (no blank frame).
  useEffect(() => {
    if (metrics) continueRender(handle);
  }, [metrics, handle]);

  const words = text.split(" ").filter(Boolean);

  /**
   * Two things make a browser's scaled text look stuck and shaky, and both are
   * the type being quantised rather than the animation being wrong.
   *
   * **The stick.** The glyph rasteriser snaps each glyph's origin to the pixel
   * grid — quarter-pixel precision horizontally, and none at all vertically. So a
   * scale that moves the baseline makes the type climb the grid in whole-pixel
   * steps: during the slow ends of an eased curve the baseline drifts a fraction
   * of a pixel per frame, which rounds to nothing for several frames and then to a
   * whole pixel at once. Pivoting the scale *on the baseline* means the baseline's
   * device Y never changes, so there is nothing to snap.
   *
   * **The shake.** Hinting distorts each glyph's outline so its stems land on
   * whole pixels. As the size slides, every stem re-snaps to a different grid and
   * the letterforms visibly change shape frame to frame — they boil.
   * `text-rendering: geometricPrecision` turns hinting off and renders the outline
   * as it actually is.
   *
   * Measured on the sibling component: vertical judder 0.296px → 0.005px, and the
   * shape invariant steadied from 3.41% drift to 0.22%.
   */

  const ready = metrics !== null;
  const leadRatio = metrics?.leadRatio ?? 0.14;
  const lineWidth = metrics?.lineWidth ?? width * 0.5;
  // Distance from the top of the line box down to the text baseline — the one
  // point the scale must not move.
  const baseline = metrics?.baseline ?? fontSize * 0.88;

  // The lead word falls back and the line starts sliding on the same frame.
  const zoomStart = holdDuration;
  // How far the line has to travel to carry the lead word's centre from the
  // frame centre to its natural spot in the sentence.
  const slideDistance = lineWidth * (0.5 - leadRatio);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <span
        ref={lineRef}
        className={className}
        style={{
          position: "relative",
          display: "inline-block",
          fontSize,
          fontWeight,
          color: fill,
          letterSpacing,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          fontFamily: face,
          // Pivot on the lead word's centre horizontally — so the line scales out
          // from that word and it stays planted — and on the baseline vertically,
          // which is the point that must not move. See above.
          transformOrigin: `${leadRatio * 100}% ${baseline}px`,
          // Drift toward the viewer, then the fall back. The two curves never
          // overlap — the first clamps at the peak once the recede starts, the
          // second is 0 until then — so they sum into one continuous scale
          // running initialScale → peak → 1.
          scale:
            interpolate(frame, [0, holdDuration], [initialScale, initialScale * pushScale], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: PUSH_EASE,
            }) +
            interpolate(
              frame,
              [zoomStart, zoomStart + recedeDuration],
              [0, 1 - initialScale * pushScale],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: ZOOM_EASE,
              },
            ),
          // The slide left: same start frame as the recede, but it runs about
          // twice as long on a heavily eased-in curve, so the line holds its
          // ground while the lead word falls back and only travels once it has
          // landed.
          translate: `${interpolate(
            frame,
            [zoomStart, zoomStart + assembleDuration],
            [slideDistance, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ZOOM_EASE,
            },
          )}px`,
          opacity: ready ? 1 : 0,
          // Hinting off: renders each outline as it actually is, so the
          // letterforms stop re-snapping to the pixel grid as the size slides.
          // Also forces sub-pixel glyph positioning, which Blink otherwise only
          // enables above a device scale factor of 1 — and a render is exactly 1.
          textRendering: "geometricPrecision",
          // Rendering and live playback want opposite things here, so give each
          // what it needs.
          //
          // A render has no time budget: the browser re-shapes and re-rasterises
          // every glyph at every new size, which is why the type stays genuinely
          // crisp, and the two fixes above are what make that smooth. Compositing
          // it would only replace real type with a rescaled texture — and worse,
          // a render is spread across parallel browser tabs, each of which
          // inherits a stale raster from whatever scale it drew last, so the same
          // frame comes out differently depending on which tab drew it.
          //
          // The Player is the opposite: one continuous tab, and roughly eight
          // milliseconds a frame on a 120Hz screen. Re-shaping a line of type at
          // a brand-new size every frame is the most expensive way to draw text,
          // and a frame that misses the budget is simply shown for the wrong
          // length of time — stutter that no amount of CSS can fix. So for live
          // playback, hand the scale to the compositor: measured on a single
          // continuous tab it is smooth (0.016px of judder) with no loss of
          // sharpness at all.
          ...(getRemotionEnvironment().isRendering ? null : { willChange: "transform" as const }),
        }}
      >
        {words.map((word, i) => {
          const isLead = i === 0;
          // Each trailing word sits out most of the recede, then pushes in from
          // the right into its slot. The lead word is the anchor: it never
          // pushes, and it is the only word visible until `wordDelay`.
          const pushStart = zoomStart + wordDelay + (i - 1) * wordStagger;
          const opacity = isLead
            ? interpolate(frame, [0, introDuration], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : interpolate(frame, [pushStart, pushStart + wordFade], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: words are positional and never reorder
              key={i}
              ref={isLead ? leadRef : undefined}
              style={{
                display: "inline-block",
                opacity,
                translate: isLead
                  ? undefined
                  : `${interpolate(
                      frame,
                      [pushStart, pushStart + wordDuration],
                      [wordPush * fontSize, 0],
                      {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: WORD_EASE,
                      },
                    )}px`,
              }}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </span>
          );
        })}
        {/* Baseline ruler. An empty, zero-sized inline-block aligns its bottom
            edge to the text baseline, so `offsetTop` reads the baseline straight
            off the font's real metrics. Zero-sized, so it changes no layout. */}
        <span ref={baselineRef} style={{ display: "inline-block", width: 0, height: 0 }} />
      </span>
    </AbsoluteFill>
  );
}
