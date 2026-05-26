# UI System — Exploration

> **TL;DR** — This is an exploration, not a spec. We're surveying design directions, component libraries, font pairings, and layout patterns for VibeFrames. Nothing is locked in — decisions get validated when we scaffold in M8 and see what actually works. The goal: arrive at M8 with a clear shortlist, not a finalized system.

---

## 0. What this doc is (and isn't)

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  THIS DOC                          NOT THIS DOC                     │
  │  ════════                          ════════════                     │
  │                                                                     │
  │  ✓ Explore directions              ✗ Lock in a design system       │
  │  ✓ Survey component libraries      ✗ Final component API           │
  │  ✓ Sketch rough wireframes         ✗ Pixel-perfect mockups         │
  │  ✓ List font/palette candidates    ✗ Definitive brand guide        │
  │  ✓ Identify open questions         ✗ Pretend we know the answers   │
  │  ✓ ADR-004 as PROPOSED             ✗ ADR-004 as ACCEPTED           │
  │                                                                     │
  │  Decisions get confirmed in M8 when we can see them in a browser.  │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Design direction — the vibe

VibeFrames is a creative tool (video composition) powered by AI. The UI should feel:

- **Light and editorial** — more Notion/Linear than VS Code/Figma dark mode
- **Calm, not flashy** — the video preview is the hero, not the chrome
- **Approachable** — a creator who's never used a timeline editor should feel at home
- **Trust-building** — AI actions are visible, not hidden; reasoning is shown, not obscured

```
  DESIGN DNA — what we're drawing from
  ═════════════════════════════════════

  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │     LINEAR        │  │     NOTION        │  │    VERCEL         │
  │                   │  │                   │  │                   │
  │  clean, fast,     │  │  editorial,       │  │  minimal,         │
  │  keyboard-first,  │  │  content-forward, │  │  developer-trust, │
  │  subtle motion    │  │  warm off-white   │  │  monochrome +     │
  │                   │  │  backgrounds      │  │  one accent       │
  └──────────────────┘  └──────────────────┘  └──────────────────┘
           │                     │                      │
           └─────────────────────┼──────────────────────┘
                                 │
                                 ▼
                    ┌──────────────────────┐
                    │    VIBEFRAMES        │
                    │                      │
                    │  light + editorial   │
                    │  + soft color to     │
                    │  distinguish from    │
                    │  dev tools           │
                    │                      │
                    │  creator-friendly    │
                    │  not dev-only        │
                    └──────────────────────┘
```

### Anti-patterns to avoid

- **Dashboard overload** — too many panels, metrics, buttons competing
- **Dark-mode-only** — alienates non-developer creators
- **Invisible AI** — hiding what the agent is doing erodes trust
- **Over-animation** — distracting from the content being created

---

## 2. Palette exploration

Three candidate directions. All light-first.

### Candidate A: Warm Neutrals + Indigo Accent

```
  ┌────────────────────────────────────────────────────────────┐
  │  WARM NEUTRALS + INDIGO                                    │
  │                                                            │
  │  Background     ██████  #FAFAF8  (warm off-white)          │
  │  Surface        ██████  #FFFFFF  (card white)              │
  │  Border         ██████  #E8E5E0  (warm gray)               │
  │  Text primary   ██████  #1A1A1A  (near-black)              │
  │  Text secondary ██████  #6B6B6B  (muted gray)              │
  │  Accent         ██████  #4F46E5  (muted indigo)            │
  │  Accent hover   ██████  #4338CA  (deeper indigo)           │
  │  Success        ██████  #10B981  (emerald)                 │
  │  Warning        ██████  #F59E0B  (amber)                   │
  │  Error          ██████  #EF4444  (red)                     │
  │                                                            │
  │  Vibe: Linear meets Notion. Professional, calm.            │
  └────────────────────────────────────────────────────────────┘
```

### Candidate B: Soft Pastels (rotating accents)

```
  ┌────────────────────────────────────────────────────────────┐
  │  SOFT PASTELS + ROTATING ACCENTS                           │
  │                                                            │
  │  Background     ██████  #FAFAF8  (warm off-white)          │
  │  Surface        ██████  #FFFFFF  (card white)              │
  │  Text primary   ██████  #1C1917  (stone-900)               │
  │                                                            │
  │  Accent cycle (one per project or per section):            │
  │    Mint         ██████  #A7F3D0                             │
  │    Blush        ██████  #FECDD3                             │
  │    Lavender     ██████  #DDD6FE                             │
  │    Butter       ██████  #FEF08A                             │
  │    Sky          ██████  #BAE6FD                             │
  │                                                            │
  │  Vibe: Playful, creative, distinctive. Might be too much. │
  └────────────────────────────────────────────────────────────┘
```

### Candidate C: Monochrome + Single Accent

```
  ┌────────────────────────────────────────────────────────────┐
  │  MONOCHROME + BLUE                                         │
  │                                                            │
  │  Background     ██████  #FFFFFF  (pure white)              │
  │  Surface        ██████  #F9FAFB  (gray-50)                │
  │  Border         ██████  #E5E7EB  (gray-200)               │
  │  Text primary   ██████  #111827  (gray-900)               │
  │  Text secondary ██████  #6B7280  (gray-500)               │
  │  Accent         ██████  #2563EB  (blue-600)               │
  │                                                            │
  │  Vibe: Vercel. Clean, developer-trusted. Maybe too cold   │
  │  for a creative tool.                                      │
  └────────────────────────────────────────────────────────────┘
```

**Current lean**: Candidate A (warm neutrals + indigo). Professional enough to share, warm enough for creators. Pastels (B) as optional per-project personalization later.

---

## 3. Typography candidates

| Pairing | Body | Headings | Vibe |
|---|---|---|---|
| **A** | Inter | Instrument Serif | Editorial, premium — Notion-like |
| **B** | Inter | Inter (weight contrast) | Clean, uniform — Linear-like |
| **C** | Geist Sans | Geist Mono (code) | Developer-forward — Vercel-like |
| **D** | Plus Jakarta Sans | Plus Jakarta Sans | Friendly, rounded — approachable |

```
  TYPOGRAPHY PAIRING A (current lean)
  ════════════════════════════════════

  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  Instrument Serif — 32px                                   │
  │  Create your video                                         │
  │                                                            │
  │  Inter — 16px/24px                                         │
  │  VibeFrames helps you compose videos through               │
  │  conversation. Describe what you want, and the AI          │
  │  agent builds it — clip by clip, track by track.           │
  │                                                            │
  │  Inter 500 — 14px                                          │
  │  BUTTON TEXT  ·  Tab labels  ·  Navigation                 │
  │                                                            │
  │  Geist Mono — 13px (code/technical only)                   │
  │  composition.clips[0].duration = "3s"                      │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

**Open question**: Does Instrument Serif feel right for a tool UI, or is it better reserved for marketing/landing pages only? We'll know when we see it in context.

---

## 4. Component library survey

### The landscape

```
  COMPONENT SOURCES — what's available
  ═════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │  FOUNDATION (required — the base layer)                             │
  │  ────────────────────────────────────                               │
  │                                                                     │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
  │  │  shadcn/ui   │  │  Tailwind v4  │  │  Lucide      │              │
  │  │              │  │              │  │              │              │
  │  │  Button,     │  │  utility     │  │  icons       │              │
  │  │  Dialog,     │  │  classes,    │  │  (600+)      │              │
  │  │  Input,      │  │  responsive, │  │              │              │
  │  │  Tabs,       │  │  theming     │  │  consistent, │              │
  │  │  Select,     │  │              │  │  tree-       │              │
  │  │  Sheet,      │  │  CSS-first,  │  │  shakable    │              │
  │  │  Tooltip,    │  │  no runtime  │  │              │              │
  │  │  etc.        │  │              │  │              │              │
  │  │              │  │              │  │              │              │
  │  │  copy-paste  │  │              │  │              │              │
  │  │  model —     │  │              │  │              │              │
  │  │  you own it  │  │              │  │              │              │
  │  └──────────────┘  └──────────────┘  └──────────────┘              │
  │                                                                     │
  │                                                                     │
  │  DOMAIN: CHAT (the agent conversation panel)                        │
  │  ───────────────────────────────────────────                        │
  │                                                                     │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  OPTION 1: Kibo UI                                           │   │
  │  │  ─────────────────                                           │   │
  │  │  Purpose-built chat components:                              │   │
  │  │  Message, Reasoning, ToolCall, Suggestion, ChatInput         │   │
  │  │                                                              │   │
  │  │  ✓ Handles streaming text natively                           │   │
  │  │  ✓ Reasoning collapsible built-in                            │   │
  │  │  ✓ Tool-call cards with status states                        │   │
  │  │  ✗ Newer library — less battle-tested                        │   │
  │  │  ✗ May need customization to match our theme                 │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                     │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  OPTION 2: Custom chat components (shadcn primitives)        │   │
  │  │  ─────────────────────────────────────────────               │   │
  │  │  Build chat UI from shadcn Card, ScrollArea, etc.            │   │
  │  │                                                              │   │
  │  │  ✓ Full control                                              │   │
  │  │  ✓ No extra dependency                                       │   │
  │  │  ✗ Significant build effort for streaming, reasoning, tools  │   │
  │  │  ✗ We'd be reinventing what Kibo already solves              │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                     │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  OPTION 3: AI SDK's useChat + custom rendering               │   │
  │  │  ──────────────────────────────────────────                  │   │
  │  │  Use `useChat` hook from `ai/react` for state management,   │   │
  │  │  custom components for rendering.                            │   │
  │  │                                                              │   │
  │  │  ✓ Tight integration with AI SDK                             │   │
  │  │  ✓ Handles message state, loading, streaming                 │   │
  │  │  ✗ Still need to build the visual components                 │   │
  │  │  ? May conflict with Harness's own event stream              │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                     │
  │  Current lean: Kibo UI for chat, investigate useChat compat.       │
  │                                                                     │
  │                                                                     │
  │  DOMAIN: TIMELINE (video track editor)                              │
  │  ────────────────────────────────────                               │
  │                                                                     │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  OPTION 1: @xzdarcy/react-timeline-editor                    │   │
  │  │  ─────────────────────────────────────                       │   │
  │  │  ✓ Ready-made timeline with tracks, clips, drag/resize      │   │
  │  │  ✓ React-native, TypeScript                                  │   │
  │  │  ✗ 300 GitHub stars — small community                        │   │
  │  │  ✗ May not match our visual style                            │   │
  │  │  ✗ Unclear maintenance status                                │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                     │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  OPTION 2: Custom timeline (dnd-kit + custom rendering)      │   │
  │  │  ───────────────────────────────────────────────             │   │
  │  │  ✓ Full control over visuals and behavior                    │   │
  │  │  ✓ dnd-kit is well-maintained                                │   │
  │  │  ✗ Significant build effort (2–3 sessions)                   │   │
  │  │  ✗ Timeline editors are notoriously tricky                   │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                     │
  │  Decision deferred to ADR-005 (M10c) — need to spike both.        │
  │                                                                     │
  │                                                                     │
  │  ACCENT (sparingly — landing page and hero moments)                 │
  │  ─────────────────────────────────────────────────                  │
  │                                                                     │
  │  ┌──────────────┐  ┌──────────────┐                                │
  │  │  MagicUI      │  │  Aceternity  │                                │
  │  │              │  │              │                                │
  │  │  Animated    │  │  Spotlight   │                                │
  │  │  Gradient    │  │  (hero)      │                                │
  │  │  Text,       │  │              │                                │
  │  │  Marquee     │  │  Keep to 1-2 │                                │
  │  │              │  │  uses max    │                                │
  │  │  tasteful    │  │              │                                │
  │  │  micro-      │  │  too much =  │                                │
  │  │  animations  │  │  gimmicky    │                                │
  │  └──────────────┘  └──────────────┘                                │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Layout — the editor surface

The main editor is a **4-pane layout** with a chat drawer. Here's the rough sketch:

```
  EDITOR LAYOUT (landscape, desktop-only)
  ════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  ┌─ topbar ───────────────────────────────────────────────────────────┐ │
  │  │  🎬 VibeFrames    Project Name ▾    [⚡ Plan] [🎨 Vibe]    👤     │ │
  │  └────────────────────────────────────────────────────────────────────┘ │
  │                                                                         │
  │  ┌──────────┐  ┌────────────────────────────────┐  ┌────────────────┐  │
  │  │          │  │                                │  │                │  │
  │  │  ASSET   │  │        VIDEO PREVIEW           │  │  PROPERTIES   │  │
  │  │  LIBRARY │  │                                │  │  PANEL        │  │
  │  │          │  │   ┌────────────────────────┐   │  │               │  │
  │  │  search  │  │   │                        │   │  │  clip: title  │  │
  │  │  ───────│  │   │   <hyperframes-player>  │   │  │  ──────────  │  │
  │  │  📹 vid │  │   │                        │   │  │  text: ...   │  │
  │  │  🖼 img │  │   │                        │   │  │  font: ...   │  │
  │  │  🎵 aud │  │   │                        │   │  │  start: 0s   │  │
  │  │  📝 txt │  │   └────────────────────────┘   │  │  duration: 3s│  │
  │  │          │  │                                │  │  track: 0    │  │
  │  │  drag    │  │   ▶ 00:00 ━━━━━━━━━━━━ 00:30  │  │               │  │
  │  │  to add  │  │                                │  │  [Delete]     │  │
  │  │          │  │                                │  │               │  │
  │  └──────────┘  └────────────────────────────────┘  └────────────────┘  │
  │                                                                         │
  │  ┌─ timeline ─────────────────────────────────────────────────────────┐ │
  │  │                                                                     │ │
  │  │  Track 0  │▓▓▓ Title ▓▓▓│        │▓▓▓▓ Outro ▓▓▓▓│              │ │
  │  │  Track 1  │▓▓▓▓▓▓▓▓▓ Background Video ▓▓▓▓▓▓▓▓▓▓│              │ │
  │  │  Track 2  │    │▓▓ Caption ▓▓│                                    │ │
  │  │  Audio    │▓▓▓▓▓▓▓▓▓▓ Background Music ▓▓▓▓▓▓▓▓▓▓▓▓│           │ │
  │  │                                                                     │ │
  │  │  0s       5s       10s       15s       20s       25s       30s    │ │
  │  └─────────────────────────────────────────────────────────────────────┘ │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  CHAT DRAWER (slides in from right, overlays or pushes content)
  ┌────────────────┐
  │  💬 Chat       │
  │  ─────────────│
  │                │
  │  🤖 Agent is   │
  │  thinking...   │
  │  ┌──────────┐ │
  │  │ Reasoning│ │
  │  │ (expand) │ │
  │  └──────────┘ │
  │                │
  │  I'll add a   │
  │  title clip   │
  │  at the start │
  │                │
  │  🔧 add-clip  │
  │  ┌──────────┐ │
  │  │ ✓ done   │ │
  │  │ clip: t1 │ │
  │  └──────────┘ │
  │                │
  │  ┌──────────┐ │
  │  │ Type...  │ │
  │  └──────────┘ │
  └────────────────┘
```

### Layout open questions

- **Chat as drawer vs. panel** — drawer saves horizontal space, panel keeps chat always visible. Try both in M8.
- **Resizable panes** — which library? `react-resizable-panels` is the leading option.
- **Mobile** — desktop-only product. Mobile gets a block page ("Open on desktop for the full editor").
- **Empty states** — what does the editor look like with no composition yet? Important for first-run experience.

---

## 6. Landing page sketch

```
  LANDING PAGE (scrollable, single page)
  ═══════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────┐
  │                                                                     │
  │                        🎬 VibeFrames                                │
  │                                                                     │
  │            Compose videos through conversation.                     │
  │        Describe what you want. The AI builds it.                    │
  │                                                                     │
  │              [ Get Started ]    [ View Demo ]                       │
  │                                                                     │
  │  ┌─────────────────────────────────────────────────────────────┐   │
  │  │                                                             │   │
  │  │              (hero video / animated preview)                │   │
  │  │                                                             │   │
  │  └─────────────────────────────────────────────────────────────┘   │
  │                                                                     │
  ├─────────────────────────────────────────────────────────────────────┤
  │                                                                     │
  │  HOW IT WORKS                                                       │
  │                                                                     │
  │  ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
  │  │  1. Chat  │───▶│ 2. Build │───▶│ 3. Watch │                      │
  │  │          │    │          │    │          │                      │
  │  │ Describe │    │ AI adds  │    │ Preview  │                      │
  │  │ your     │    │ clips,   │    │ in real  │                      │
  │  │ video    │    │ tracks,  │    │ time     │                      │
  │  │          │    │ effects  │    │          │                      │
  │  └──────────┘    └──────────┘    └──────────┘                      │
  │                                                                     │
  ├─────────────────────────────────────────────────────────────────────┤
  │                                                                     │
  │  FEATURES                                                           │
  │                                                                     │
  │  ✦ AI-powered composition    ✦ Real-time preview                   │
  │  ✦ Plan before building      ✦ HTML-native (HyperFrames)          │
  │  ✦ Multi-track timeline      ✦ Built on Mastra Harness            │
  │                                                                     │
  ├─────────────────────────────────────────────────────────────────────┤
  │                                                                     │
  │  BUILT WITH                                                         │
  │                                                                     │
  │  Next.js · Mastra · HyperFrames · OpenAI · shadcn/ui              │
  │                                                                     │
  │  (marquee of logos — MagicUI Marquee component)                    │
  │                                                                     │
  ├─────────────────────────────────────────────────────────────────────┤
  │                                                                     │
  │  OPEN SOURCE — docs-first, learning-by-building                    │
  │                                                                     │
  │  [ GitHub ]    [ Read the Docs ]                                    │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Project list sketch

```
  PROJECT LIST (/projects)
  ════════════════════════

  ┌─────────────────────────────────────────────────────────────────────┐
  │  ┌─ topbar ───────────────────────────────────────────────────────┐ │
  │  │  🎬 VibeFrames    Projects                              👤     │ │
  │  └────────────────────────────────────────────────────────────────┘ │
  │                                                                     │
  │  [ + New Project ]                                                  │
  │                                                                     │
  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
  │  │  ┌────────────┐  │  │  ┌────────────┐  │  │  ┌────────────┐  │  │
  │  │  │ thumbnail  │  │  │  │ thumbnail  │  │  │  │            │  │  │
  │  │  │            │  │  │  │            │  │  │  │   empty    │  │  │
  │  │  └────────────┘  │  │  └────────────┘  │  │  │   state    │  │  │
  │  │  Product Demo    │  │  Tutorial Intro  │  │  │            │  │  │
  │  │  30s · 4 clips   │  │  15s · 2 clips   │  │  └────────────┘  │  │
  │  │  Updated 2h ago  │  │  Updated 1d ago  │  │  My First Video  │  │
  │  └──────────────────┘  └──────────────────┘  │  0s · 0 clips    │  │
  │                                                └──────────────────┘  │
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Chat panel — event-to-component mapping

Each Harness SSE event maps to a visual component in the chat panel:

```
  SSE EVENT → CHAT COMPONENT
  ═══════════════════════════

  ┌────────────────────────┐     ┌──────────────────────────────────┐
  │  run.start             │────▶│  (loading indicator appears)     │
  └────────────────────────┘     └──────────────────────────────────┘

  ┌────────────────────────┐     ┌──────────────────────────────────┐
  │  agent.thinking        │────▶│  <Reasoning>                     │
  │  { summary }           │     │    collapsible reasoning block   │
  │                        │     │    "Planning to add a title..."  │
  └────────────────────────┘     └──────────────────────────────────┘

  ┌────────────────────────┐     ┌──────────────────────────────────┐
  │  agent.responding      │────▶│  <Message role="assistant">      │
  │  { delta }             │     │    streaming text, token by      │
  │                        │     │    token, markdown rendered       │
  └────────────────────────┘     └──────────────────────────────────┘

  ┌────────────────────────┐     ┌──────────────────────────────────┐
  │  tool.calling          │────▶│  <ToolCall status="calling">     │
  │  { name, input }       │     │    🔧 add-clip                  │
  │                        │     │    { type: "text-overlay", ... } │
  └────────────────────────┘     └──────────────────────────────────┘

  ┌────────────────────────┐     ┌──────────────────────────────────┐
  │  tool.result           │────▶│  <ToolCall status="done">        │
  │  { name, output }      │     │    ✓ add-clip → clip-id: c1     │
  └────────────────────────┘     └──────────────────────────────────┘

  ┌────────────────────────┐     ┌──────────────────────────────────┐
  │  plan.proposed         │────▶│  <PlanCard>                      │
  │  { steps[] }           │     │    numbered step list            │
  │                        │     │    [Approve] [Edit] [Reject]     │
  └────────────────────────┘     └──────────────────────────────────┘

  ┌────────────────────────┐     ┌──────────────────────────────────┐
  │  composition.delta     │────▶│  <DeltaIndicator>                │
  │  { patch }             │     │    "Composition updated"         │
  │                        │     │    (flash in timeline)           │
  └────────────────────────┘     └──────────────────────────────────┘

  ┌────────────────────────┐     ┌──────────────────────────────────┐
  │  run.complete          │────▶│  (loading indicator removed)     │
  │  run.error             │     │  or: <ErrorBanner> with retry    │
  └────────────────────────┘     └──────────────────────────────────┘
```

---

## 9. Motion and interaction guidelines (tentative)

| Pattern | Duration | Easing | When |
|---|---|---|---|
| Panel resize | 200ms | ease-out | Resizing panes |
| Chat message appear | 150ms | ease-out | New message animates in |
| Reasoning expand/collapse | 200ms | ease-in-out | Toggle reasoning block |
| Tool-call status change | 150ms | ease-out | calling → done transition |
| Composition delta flash | 300ms | ease-out | Timeline highlight on update |
| Page transition | 250ms | ease-out | Navigate between pages |
| Hover states | 100ms | ease-out | Button, link hovers |

**Principle**: Motion should feel **responsive, not decorative**. If removing an animation makes the UX worse, keep it. If it's just eye candy, skip it.

---

## 10. Open questions (to resolve in M8)

| # | Question | How we'll answer it |
|---|---|---|
| 1 | Kibo UI vs custom chat components? | Try Kibo in M8, evaluate customizability |
| 2 | Does Instrument Serif work in a tool UI? | See it in the browser with real content |
| 3 | Chat drawer or persistent panel? | Build both, A/B in M8/M9 |
| 4 | Timeline library decision | Spike in M10c → ADR-005 |
| 5 | Palette A vs B vs C? | Apply A first, reconsider if it feels off |
| 6 | Dark mode? | Not for MVP. Light-only. Revisit post-launch. |
| 7 | `useChat` hook compat with Harness SSE? | Test in M9 — may need custom event parser |
| 8 | Resizable panels library? | `react-resizable-panels` is the default pick |
| 9 | How does the plan card interact with mode switching? | Design in M9 when the Harness loop works |
| 10 | Empty states — what does "no project" look like? | Wireframe in M8, iterate |

---

## 11. Inspiration references

Collect screenshots and links in `assets/inspiration/` during M8. Key references to study:

- **Linear** — issue detail, project board, clean sidebar
- **Notion** — page layout, warm palette, editorial feel
- **Vercel Dashboard** — deployment cards, monochrome confidence
- **Cursor** — chat panel inside an editor, reasoning blocks
- **CapCut** — timeline UI for a consumer video editor (not pro-tool complex)
- **Descript** — transcript-driven video editing, approachable for non-editors
- **v0.dev** — AI-generated UI, plan→build flow, chat-to-code

---

## 12. ADR-004 — UI component stack (PROPOSED)

**Status**: Proposed (to be confirmed in M8)  
**Date**: 2025-05-25  

**Proposed stack**:
- **Foundation**: shadcn/ui + Tailwind CSS v4 + Lucide icons
- **Chat**: Kibo UI (or custom if Kibo doesn't fit)
- **Timeline**: TBD — spike in M10c (ADR-005)
- **Accents**: MagicUI + Aceternity (1–2 uses max)
- **Layout**: `react-resizable-panels` for pane management

**Why this is still proposed**: We haven't built anything yet. Component libraries look great in docs but may fight your theme, conflict with each other, or not handle edge cases. M8 is where we find out.

---

## 13. What's next

- **M8** — Scaffold + HelloWorld: install the stack, see it in the browser, confirm or revise every choice in this doc
- ADR-004 status changes from **Proposed** → **Accepted** (or revised) after M8
- ADR-005 (timeline lib) created during M10c spike
