# LLD-02 — Composition Model

> **TL;DR** — The composition model defines how VibeFrames represents video internally. A `Composition` is a Zod-validated tree of `Track`s containing `Clip`s, each holding HyperFrames HTML. Pure mutation functions transform the tree, a serializer emits the final HTML document for `<hyperframes-player>`, and every operation is unit-tested. This mirrors the block-registry pattern used in mc-studio-services, adapted for video instead of email.

---

## 1. Design Inspiration: Block Registry Pattern

In mc-studio-services (email generation), the composition model follows a **registry → instance → expand → render** pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│  mc-studio-services (email)                                  │
│                                                              │
│  YAML Block Defs ──► BlockRegistry ──► BlockInstance         │
│       │                    │                │                │
│       │   blockSchemaToZod │   expandBlocks │                │
│       ▼                    ▼                ▼                │
│  PropDefinition      validate(props)   compiled HTML        │
│  (type, required,    safeParse()       (slot substitution,  │
│   default, enum)                        data-studio-id)     │
└─────────────────────────────────────────────────────────────┘
```

**VibeFrames adaptation:**

| mc-studio (email) | VibeFrames (video) | Key difference |
|----|----|----|
| `BlockTypeDefinition` | `ClipType` (future M10) | Video clip types instead of email blocks |
| `BlockInstance` | `Clip` | Clip holds HyperFrames HTML, not email HTML |
| `BlockSchema` (YAML) | `ClipSchema` (Zod) | Zod-first, not YAML-first (simpler for MVP) |
| `blockRegistry.validate()` | `ClipSchema.parse()` | Same Zod validation pattern |
| `expandBlocks()` → PostHTML | `serialize()` → string concat | No AST walking needed — HyperFrames is flat HTML |
| `BlockInstance.slots` | `Clip.html` | Video clips don't have named slots |
| `BlockInstance.tier` | N/A (all typed for MVP) | No freeform/composed distinction yet |

---

## 2. Core Types (Current)

All types live in `harness/types.ts` and are Zod schemas with inferred TypeScript types:

```
┌──────────────────────────────────────────────────────────────┐
│                     HarnessState                              │
│  ┌────────────┬──────────┬─────────────┬──────┬───────┐      │
│  │ projectId  │  mode    │  status     │ plan │ error │      │
│  │  string    │ plan|    │ empty|      │ str? │ str?  │      │
│  │            │ vibe     │ planning|   │      │       │      │
│  │            │          │ composing|  │      │       │      │
│  │            │          │ previewing| │      │       │      │
│  │            │          │ exporting|  │      │       │      │
│  │            │          │ done        │      │       │      │
│  └────────────┴──────────┴─────────────┴──────┴───────┘      │
│                                                              │
│  composition: Composition | null                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                   Composition                         │    │
│  │  ┌─────┬───────┬───────┬────────┬─────┬──────────┐   │    │
│  │  │ id  │ title │ width │ height │ fps │  tracks  │   │    │
│  │  │ str │  str  │ 1920  │  1080  │  30 │ Track[]  │   │    │
│  │  └─────┴───────┴───────┴────────┴─────┴────┬─────┘   │    │
│  │                                             │         │    │
│  │  ┌──────────────────────────────────────────┘         │    │
│  │  │                                                    │    │
│  │  ▼                                                    │    │
│  │  ┌───────────────────────────┐                        │    │
│  │  │         Track             │  × N                   │    │
│  │  │  ┌─────┬───────┬───────┐  │                        │    │
│  │  │  │ id  │ label │ clips │  │                        │    │
│  │  │  │ str │  str  │ Clip[]│  │                        │    │
│  │  │  └─────┴───────┴───┬───┘  │                        │    │
│  │  │                    │      │                        │    │
│  │  │  ┌─────────────────┘      │                        │    │
│  │  │  │                        │                        │    │
│  │  │  ▼                        │                        │    │
│  │  │  ┌──────────────────────┐ │                        │    │
│  │  │  │       Clip           │ │  × M                   │    │
│  │  │  │  ┌────┬────────┬──┐  │ │                        │    │
│  │  │  │  │ id │trackId │  │  │ │                        │    │
│  │  │  │  ├────┼────────┤  │  │ │                        │    │
│  │  │  │  │startMs│durMs│  │  │ │                        │    │
│  │  │  │  ├────┴────────┤  │  │ │                        │    │
│  │  │  │  │    html     │  │  │ │  ◁ HyperFrames HTML    │    │
│  │  │  │  └─────────────┘  │  │ │                        │    │
│  │  │  └──────────────────────┘ │                        │    │
│  │  └───────────────────────────┘                        │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Zod Schemas

```ts
// harness/types.ts — current implementation
export const ClipSchema = z.object({
  id: z.string(),
  trackId: z.string(),
  startMs: z.number(),
  durationMs: z.number(),
  html: z.string(),        // HyperFrames HTML for this clip
});

export const TrackSchema = z.object({
  id: z.string(),
  label: z.string(),
  clips: z.array(ClipSchema),
});

export const CompositionSchema = z.object({
  id: z.string(),
  title: z.string(),
  width: z.number().default(1920),
  height: z.number().default(1080),
  fps: z.number().default(30),
  tracks: z.array(TrackSchema),
});
```

---

## 3. Mutation Functions (M9 Implementation)

Pure functions that transform a `Composition` immutably. Each returns a new `Composition` or throws on validation failure.

```
┌──────────────────────────────────────────────────────────┐
│                  MUTATION PIPELINE                         │
│                                                          │
│   Agent Tool Call                                         │
│        │                                                 │
│        ▼                                                 │
│   ┌──────────────┐    Zod validates    ┌──────────────┐  │
│   │  Tool Params │ ──────────────────► │  Mutation Fn │  │
│   │  (from LLM)  │    params           │  (pure)      │  │
│   └──────────────┘                     └──────┬───────┘  │
│                                               │          │
│                                    new Composition       │
│                                               │          │
│                                               ▼          │
│                                        ┌──────────────┐  │
│                                        │  serialize() │  │
│                                        │  → HTML      │  │
│                                        └──────┬───────┘  │
│                                               │          │
│                                               ▼          │
│                                        ┌──────────────┐  │
│                                        │ <hyperframes │  │
│                                        │  -player>    │  │
│                                        └──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Planned functions (`harness/mutations.ts`)

```ts
// All functions are PURE — no side effects, no state mutation.
// They take a Composition and return a new Composition.

/** Add a clip to a track. Creates the track if it doesn't exist. */
function addClip(
  composition: Composition,
  params: { trackId: string; trackLabel?: string; startMs: number; durationMs: number; html: string }
): Composition;

/** Update a clip's HTML, timing, or both. */
function updateClip(
  composition: Composition,
  params: { clipId: string; html?: string; startMs?: number; durationMs?: number }
): Composition;

/** Remove a clip by ID. Removes the track if it becomes empty. */
function removeClip(
  composition: Composition,
  params: { clipId: string }
): Composition;

/** Add a new empty track. */
function addTrack(
  composition: Composition,
  params: { label: string }
): Composition;

/** Remove a track and all its clips. */
function removeTrack(
  composition: Composition,
  params: { trackId: string }
): Composition;

/** Reorder clips within a track (drag-and-drop support). */
function reorderClips(
  composition: Composition,
  params: { trackId: string; clipIds: string[] }
): Composition;
```

### ID generation

Clip and track IDs follow the pattern `clip-<nanoid(8)>` / `track-<nanoid(8)>`. The mutation functions generate IDs when creating new entities, but callers can also supply IDs for deterministic testing.

---

## 4. Serialization: Composition → HyperFrames HTML

The `serialize()` function converts the in-memory composition tree into a complete HTML document that `<hyperframes-player>` can render.

```
┌───────────────────────────────────────────────────────────────┐
│  Composition (JSON)                                           │
│  {                                                            │
│    id: "comp-1",                                              │
│    title: "My Video",                                         │
│    width: 1920, height: 1080, fps: 30,                        │
│    tracks: [                                                  │
│      { id: "t-1", label: "Main",                              │
│        clips: [                                               │
│          { id: "c-1", trackId: "t-1",                         │
│            startMs: 0, durationMs: 3000,                      │
│            html: '<h1 style="...">Welcome</h1>' }             │
│        ]                                                      │
│      },                                                       │
│      { id: "t-2", label: "Audio",                             │
│        clips: [                                               │
│          { id: "c-2", trackId: "t-2",                         │
│            startMs: 0, durationMs: 5000,                      │
│            html: '<audio src="bg.mp3" />' }                   │
│        ]                                                      │
│      }                                                        │
│    ]                                                          │
│  }                                                            │
└──────────────────────────────┬────────────────────────────────┘
                               │
                         serialize()
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│  HyperFrames HTML                                             │
│                                                               │
│  <div id="root"                                               │
│       data-composition-id="comp-1"                            │
│       data-width="1920"                                       │
│       data-height="1080">                                     │
│                                                               │
│    <h1 id="c-1" class="clip"                                  │
│        data-start="0" data-duration="3"                       │
│        data-track-index="0"                                   │
│        style="...">Welcome</h1>                               │
│                                                               │
│    <audio id="c-2" class="clip"                               │
│           data-start="0" data-duration="5"                    │
│           data-track-index="1"                                │
│           src="bg.mp3" />                                     │
│                                                               │
│  </div>                                                       │
└───────────────────────────────────────────────────────────────┘
```

### Serialization rules

1. **Root element** — `<div>` with `data-composition-id`, `data-width`, `data-height`
2. **Each clip** — wrapped with `id`, `class="clip"`, `data-start` (seconds), `data-duration` (seconds), `data-track-index`
3. **Track index** — derived from the track's position in the `tracks` array (0-indexed)
4. **Time conversion** — `startMs / 1000` → seconds for HyperFrames `data-start`
5. **Clip HTML injection** — the clip's `html` field is parsed, the root element receives the data attributes, and the content is preserved
6. **No nesting** — MVP compositions are flat (no nested `data-composition-src`); nesting comes in M10+

### Planned function signature

```ts
/** Serialize a Composition to HyperFrames HTML. */
function serialize(composition: Composition): string;

/** Parse HyperFrames HTML back to a Composition (for import/edit). */
function deserialize(html: string): Composition;  // M10+
```

---

## 5. Clip Type Registry (M10a — Future)

Inspired by mc-studio-services' `BlockRegistry`, M10a introduces a `ClipTypeRegistry` that catalogs HyperFrames clip types with Zod schemas:

```
┌───────────────────────────────────────────────────────────────┐
│                   CLIP TYPE REGISTRY (M10a)                    │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │  title-card     │  │  text-overlay    │  │  image-clip  │  │
│  │                 │  │                 │  │              │  │
│  │  schema:        │  │  schema:        │  │  schema:     │  │
│  │   text: string  │  │   text: string  │  │   src: url   │  │
│  │   font: enum    │  │   position: enum│  │   fit: enum  │  │
│  │   animation:    │  │   animation:    │  │   duration:  │  │
│  │    enum         │  │    enum         │  │    number    │  │
│  │                 │  │                 │  │              │  │
│  │  template:      │  │  template:      │  │  template:   │  │
│  │   HyperFrames   │  │   HyperFrames   │  │   <img ...>  │  │
│  │   HTML w/ GSAP  │  │   HTML          │  │              │  │
│  └─────────────────┘  └─────────────────┘  └──────────────┘  │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │  video-clip     │  │  audio-track    │                     │
│  │                 │  │                 │                     │
│  │  schema:        │  │  schema:        │                     │
│  │   src: url      │  │   src: url      │                     │
│  │   trim: range   │  │   volume: 0-1   │                     │
│  │   volume: 0-1   │  │   fadeIn: ms    │                     │
│  │                 │  │   fadeOut: ms   │                     │
│  │  template:      │  │                 │                     │
│  │   <video ...>   │  │  template:      │                     │
│  │                 │  │   <audio ...>   │                     │
│  └─────────────────┘  └─────────────────┘                     │
└───────────────────────────────────────────────────────────────┘
```

This is **not implemented yet** — MVP clips are freeform HTML strings. The registry will:
1. Define clip types with Zod schemas (like mc-studio's `PropDefinition`)
2. Validate clip parameters before mutation
3. Generate template HTML from structured props
4. Enable the agent to discover available clip types via tool descriptions

---

## 6. Testing Strategy

### Current tests (M8)

| Test file | What it validates |
|-----------|-------------------|
| `types.test.ts` | Schema parsing, defaults, rejection of invalid values |
| `config.test.ts` | Config constants, mode definitions |
| `tools.test.ts` | Tool parameter validation (safeParse) |

### M9 tests (mutations + serialization)

```ts
// Example: addClip mutation test
describe("addClip", () => {
  it("adds a clip to an existing track", () => {
    const comp = createEmptyComposition();
    const result = addClip(comp, {
      trackId: "track-1",
      startMs: 0,
      durationMs: 3000,
      html: '<h1 style="color:white">Hello</h1>',
    });
    expect(result.tracks[0].clips).toHaveLength(1);
    expect(result.tracks[0].clips[0].html).toContain("Hello");
  });

  it("creates a new track if trackId doesn't exist", () => { ... });
  it("rejects overlapping clips on the same track", () => { ... });
  it("validates clip duration is positive", () => { ... });
});

// Example: serialize test
describe("serialize", () => {
  it("produces valid HyperFrames HTML with data attributes", () => {
    const comp = createTestComposition();
    const html = serialize(comp);
    expect(html).toContain('data-composition-id="comp-1"');
    expect(html).toContain('data-width="1920"');
    expect(html).toContain('data-start="0"');
    expect(html).toContain('data-duration="3"');
    expect(html).toContain('data-track-index="0"');
  });

  it("converts milliseconds to seconds", () => { ... });
  it("preserves clip HTML content", () => { ... });
});
```

---

## 7. Data Flow: End-to-End (M9 Target)

```
┌──────────┐                                                      
│   User   │  "Add a title card that says Welcome"                 
└────┬─────┘                                                      
     │  useChat()                                                  
     ▼                                                             
┌──────────┐   SSE    ┌────────────┐  streamText  ┌──────────┐    
│  Studio  │ ───────► │  /api/chat │ ───────────► │  OpenAI  │    
│  UI      │ ◄─────── │  (route)   │ ◄─────────── │  o4-mini │    
└──────────┘          └─────┬──────┘              └──────────┘    
                            │                                     
                    tool_call: addClip                             
                    { trackId: "main",                             
                      startMs: 0,                                  
                      durationMs: 3000,                            
                      html: "<h1>Welcome</h1>" }                   
                            │                                     
                            ▼                                     
                   ┌─────────────────┐                            
                   │  addClip()      │  pure mutation              
                   │  → new Comp     │                            
                   └────────┬────────┘                            
                            │                                     
                            ▼                                     
                   ┌─────────────────┐                            
                   │  serialize()    │  Composition → HTML         
                   │  → HyperFrames  │                            
                   └────────┬────────┘                            
                            │                                     
                            ▼                                     
                   ┌─────────────────┐                            
                   │  <hyperframes   │  Browser preview            
                   │   -player>      │                            
                   └─────────────────┘                            
```

---

## 8. Open Questions (Resolve in M9/M10)

| # | Question | Options | Decision |
|---|----------|---------|----------|
| 1 | Clip overlap detection | Reject at mutation time vs. warn at serialize | TBD |
| 2 | ID generation | nanoid vs. uuid vs. `clip-${counter}` | Leaning nanoid |
| 3 | Track auto-creation | Create track if missing vs. require explicit `addTrack` | Leaning auto-create |
| 4 | HTML injection strategy | String concat vs. DOM parsing | String concat for MVP |
| 5 | Nested compositions | Inline vs. `data-composition-src` | Deferred to M10 |
| 6 | Clip type registry format | Zod-first (code) vs. YAML-first (like mc-studio) | Zod-first for MVP |

---

*Last updated: M8 scaffold completion.*
