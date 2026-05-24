# ADR-002 — LLM provider and reasoning strategy

**Status**: Accepted  
**Date**: 2025-05-24  
**Deciders**: Project author  

## Context

VibeFrames needs a model that can (1) reason about composition intent, (2) call tools reliably with structured input/output, and (3) stream responses token-by-token. The two-mode architecture (M4) requires different reasoning intensities: fast/cheap for plan mode, thorough for vibe mode.

## Options considered

1. **OpenAI `o4-mini`** — reasoning model with explicit `reasoningEffort` control, strong tool calling
2. **OpenAI `gpt-5.1`** — highest quality, but 5–10x cost per turn
3. **Anthropic Claude Sonnet 4** — strong reasoning, but AI SDK tool-calling integration less mature for structured multi-tool loops
4. **Google Gemini 2.5 Pro** — competitive, but less battle-tested for agentic tool loops
5. **Multi-provider fallback** — primary + fallback provider (e.g., OpenAI → Anthropic)

## Decision

**OpenAI `o4-mini`** as the default model for both modes, with `reasoningEffort` as the differentiator. Environment-variable swap to `gpt-5.1` available.

```
Plan mode:  o4-mini, reasoningEffort: 'low',    reasoningSummary: 'auto'
Vibe mode:  o4-mini, reasoningEffort: 'medium', reasoningSummary: 'auto'
Override:   VIBEFRAMES_MODEL=gpt-5.1 (env var)
```

## Rationale

- `o4-mini` with `reasoningEffort` control gives us two "virtual models" from one: fast/cheap (plan) and thorough (vibe)
- Mastra's AI SDK integration with `@ai-sdk/openai` is the most mature path for tool calling, structured output, and streaming
- `reasoningSummary: 'auto'` feeds the `agent.thinking` SSE event — users see reasoning without parsing raw chain-of-thought
- Cost: `o4-mini` is ~$1.10/1M input, $4.40/1M output — a typical 5-tool turn costs ~$0.01–0.03
- Tool-calling reliability: OpenAI's function calling is the most tested path in the AI SDK ecosystem

## Tradeoffs

- **Model lock-in** — AI SDK's provider abstraction means swapping to `@ai-sdk/anthropic` or `@ai-sdk/google` is a one-line change. The risk is low.
- **`reasoningEffort: 'low'` quality** — may produce shallow plans for complex requests. We'll monitor and consider `medium` for plan mode if needed.
- **No multi-provider fallback** — single-provider for MVP. If OpenAI goes down, so do we. Multi-provider is a post-launch concern.
- **`gpt-5.1` cost** — useful for demos or high-stakes sessions, but too expensive for default use.

## Consequences

- All Mastra agents use `openai('o4-mini', { reasoningEffort, reasoningSummary })` via `@ai-sdk/openai`
- Model selection is environment-driven: `VIBEFRAMES_MODEL` overrides the default
- Reasoning summaries stream to the client as `agent.thinking` events (ADR-001)
- Token usage tracked per-thread in thread metadata (§3.7 of M3 doc)
