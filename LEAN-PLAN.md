# VibeFrames — Lean Reboot Plan

> Goal: strip the repo to a **super-lean but structured** base — keep the Next.js
> app, the Mastra **Harness** (AgentController-family) + **SSE** event pipeline, and
> the home page. Cut everything coupled to HyperFrames and the 4-phase pipeline.
> Add **Remotion** as the render engine. Start with **one simple, structured skill.**
>
> Approach: strip IN PLACE (keep git history). Original is safe on GitHub.

---

## The north-star loop (v1)

```
  prompt  →  /api/chat (SSE)  →  Harness + ONE agent  →  ONE structured tool
         →  emits composition JSON  →  Remotion <Player> preview  →  export mp4
```

No brief→storyboard→compose→validate. No HyperFrames. No subagents. One agent,
one structured tool, JSON out, Remotion renders it.

---

## KEEP (the good base)

**Next.js + infra**
- `src/app/layout.tsx`, `globals.css`, `next.config.ts`, `tsconfig.json`, `package.json` (trimmed), tailwind/postcss config
- `src/app/api/chat/route.ts` — the SSE route (excellent; keep nearly as-is)
- `src/protocol/sse-writer.ts` — SSE stream helper
- `.gitignore`, `components.json`

**The Harness core (the AgentController + memory wiring)**
- `src/harness/index.ts` — singleton factory (simplify: drop HyperFrames re-exports)
- `src/harness/storage.ts`, `config.ts`
- `src/harness/director/agent.ts` — the agent (keep; retarget tools + prompt)
- `src/harness/director/prompt.ts` — simplify to the lean loop
- `src/harness/react/use-harness-chat.ts` — the SSE client hook (keep)

**Home page (you like it)**
- `src/app/page.tsx`
- `src/components/landing/hero.tsx`, `how-it-works.tsx`, `engineering-behind-it.tsx`
- the `ui/` primitives the landing page actually imports

**A few shadcn primitives**
- `button`, `textarea`, `card`, `scroll-area` (whatever the new studio + home use)

---

## ADD (the new lean parts)

**Remotion** (port from `../vibeframes-v2/app`)
- `src/remotion/` — `Root.tsx`, `Video.tsx` (JSON-driven), `blocks/` (TitleCard,
  BulletReveal, Outro to start), `anim.ts`
- `@remotion/player` in the studio for live preview
- `@remotion/bundler` + `@remotion/renderer` for `/api/render` (export mp4)

**New composition schema (Remotion-shaped, replaces HyperFrames tree)**
- `src/harness/composition/schema.ts` — Zod: `{ fps, width, height, clips: [{id, block, from, durationInFrames, props}] }`
- `src/harness/composition/mutations.ts` — pure `addClip` (keep the good pattern, retarget shape)
- `src/harness/composition/store.ts` — keep (disk-backed state)

**ONE structured skill + tool**
- `src/harness/director/skills/compose.md` — one skill: "turn the request into clips"
- `src/harness/tools/add-clip.ts` — ONE structured tool the agent calls to append a
  clip (Zod in/out: block enum + props). The agent builds the composition by
  calling it N times. This is the whole agent surface for v1.

**New lean studio UI (replaces the 3-panel IDE)**
- `src/app/studio/[projectId]/page.tsx` + `studio-client.tsx` — ONE screen:
  ```
  ┌──────────────────────────────────────────┐
  │  VibeFrames                      [export]  │
  ├──────────────────────────────────────────┤
  │        ┌────────────────────────┐          │
  │        │   <Player> preview      │         │
  │        └────────────────────────┘          │
  │   ┌──────────────────────────────────┐    │
  │   │ describe your video…        [→]   │    │
  │   └──────────────────────────────────┘    │
  └──────────────────────────────────────────┘
  ```

---

## DELETE (cruft + HyperFrames coupling)

**HyperFrames + 4-phase pipeline**
- `src/harness/composition/translator.ts` (463 lines — the rabbit hole)
- `src/harness/composition/serialize.ts` (jsonTree → HyperFrames HTML)
- `src/harness/composition/validation-rules.ts`
- `src/harness/services/clip-registry.service.ts` + `services/` (block catalog)
- `src/harness/tools/compose-tools.ts`, `storyboard-tools.ts`, `list-blocks`, etc.
  (keep only the one new add-clip tool)
- `src/harness/tools-internal/`
- `src/harness/brand-registry.ts`
- brief/storyboard/validate skills in `director/skills/`
- the shot-type / camera-move / rhythm / arc machinery in `state.ts` (radically simplify)

**Old studio UI (the part that "sucks")**
- `src/components/studio/preview/panel.tsx` (HyperFrames iframe), `timeline-strip.tsx`
- `src/components/studio/code/panel.tsx`
- `src/components/studio/chat/*` (rebuild minimal), `shell/*`
- `src/harness/react/use-composition.ts` (HyperFrames-derived)

**Docs + ballast**
- `docs/` (120 md — ADRs, LLDs, journals), `coverage/`, `experiments/`
- 29 mp3s in `public/` (unless the home page uses any — verify first)
- `Akash-ai-engineer-resume.pdf`
- fumadocs deps, all `__tests__` / `__e2e__` (re-add tests later, lean)
- `AGENTS.md`, `DESIGN.md`, `DEVELOPMENT.md` (keep README, rewrite later)

**package.json deps to drop:** fumadocs-*, react-markdown, remark-gfm (if chat
drops markdown), the HyperFrames-specific bits. **Add:** remotion, @remotion/player,
@remotion/bundler, @remotion/renderer.

---

## Build order (verifiable slices)

1. **Delete pass** — remove the DELETE list. App won't build yet; that's expected.
2. **Simplify state + harness** — new composition schema; strip `state.ts` to lean;
   fix `harness/index.ts` re-exports. *(Verify: `pnpm typecheck` passes on harness.)*
3. **Port Remotion** — copy `src/remotion/` from vibeframes-v2. *(Verify: a render
   script produces an mp4 from sample JSON.)*
4. **One structured tool** — `add-clip` + one `compose.md` skill; retarget the agent.
   *(Verify: a prompt produces composition JSON via SSE.)*
5. **New studio UI** — single screen: prompt + `<Player>` + export. *(Verify: prompt
   → live preview updates.)*
6. **Export route** — `/api/render` runs Remotion SSR. *(Verify: full loop → mp4.)*

Home page stays untouched throughout.

---

## Firewall note

Standard rule still applies: this is public/personal work, but keep any Mastra usage
grounded in public docs, and never pull in proprietary patterns from other work.
