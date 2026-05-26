## Plan Continuation (v6 -> execution-ready)

This continues `plan.md` (in this same folder) with execution mechanics so modules can be run consistently.

---

## 11. Execution protocol (how we run each module)

For every module from M0 onward, follow the same loop:

1. **Plan lock**
   - Confirm module goal + out-of-scope for that session.
   - Confirm exact doc/code artifacts to ship in that module.
2. **Build**
   - Ship the smallest vertical slice that demonstrates the module goal.
   - Prefer one coherent commit per logical unit.
3. **Verify**
   - Run only the checks relevant to the touched surface (docs lint, typecheck, unit tests, smoke flow).
   - Capture expected/actual behavior in the journal.
4. **Document**
   - Update module docs/LLDs/ADRs immediately (same session, not later).
5. **Journal**
   - Write one session note with wins, friction, and next-session entry point.
6. **Decide next**
   - Proceed only if module exit criteria are met; otherwise add a carry-over mini-task list.

This keeps docs and implementation continuously in sync.

---

## 12. Definition of done by phase

### Docs-first phase (M0-M7)
- Every module doc exists and is internally consistent with earlier decisions.
- New architectural decisions are written as ADRs (not hidden in chat).
- `docs/README.md` status table is updated after each session.
- Journal entry exists for every session.

### Build-core phase (M8-M10)
- A demoable behavior exists for the module (not just scaffolding).
- Unit/integration checks for changed logic pass locally.
- LLDs for new subsystems are created/updated in the same module.
- Known gaps are explicitly parked under out-of-scope or follow-up list.

### Production phase (M11-M13)
- Auth/storage/deploy changes have a reproducible smoke script.
- Environment requirements and operational caveats are documented.
- Final docs (`README`, deployment notes, lessons learned) reflect reality.

---

## 13. Session checklist template (copy each session)

Use this template in `docs/journal/session-XX.md`:

```md
# Session XX - <module>

## Goal for this session
- 

## Planned scope
- In:
- Out:

## What changed
- Docs:
- Code:
- Decisions:

## Verification
- Commands run:
- Result:
- Manual smoke:

## Risks / open questions
- 

## Next session start point
- First action:
- Expected output:
```

---

## 14. M10 decomposition (detailed execution order)

M10 is the longest module, so run it as a strict sequence:

1. **M10a Block registry first**
   - Freeze canonical block schemas before deeper UI/tool work.
   - Output: typed block contracts + basic validation coverage.
2. **M10b Editor shell next**
   - Land 4-pane layout with stubbed data; no deep logic yet.
   - Output: stable layout primitives and resizing behavior.
3. **M10c Timeline decision then implementation**
   - Time-box spike, record ADR-005, then implement only the winner.
   - Output: one committed timeline direction, no dual-path drift.
4. **M10d Properties panel**
   - Drive from schema to avoid hard-coded per-block forms.
   - Output: one generic renderer + block-specific controls.
5. **M10e Asset library**
   - Add ingest and drag-to-timeline with local URLs first.
   - Output: usable local-asset workflow with clear upgrade path.
6. **M10f Full tool catalog**
   - Add read tools before mutation tools; validation last.
   - Output: complete chat-tool surface tied to composition state.
7. **M10g Skills authoring**
   - Codify operational patterns so future prompts stay consistent.
   - Output: `hyperframes`, `composition`, `captions` skill docs + LLD-07.
8. **M10h Chat polish**
   - Move from utility UI to Kibo components once behavior is stable.
   - Output: production-like chat UX without reworking core logic.

Rule: do not advance if previous sub-module demo is broken.

---

## 15. Immediate next action menu

Choose one command phrase and I will execute it directly:

- **"approved, start M0"** -> execute M0 deliverables from section 9.
- **"start M1 docs"** -> skip execution and draft only `01-hyperframes-exploration.md`.
- **"prepare M8 scaffold plan"** -> produce a dedicated, task-level M8 checklist before coding.
- **"open M10 detailed plan"** -> generate a separate deep plan file for M10a-M10h with acceptance criteria per sub-module.
