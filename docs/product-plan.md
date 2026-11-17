# Product plan: client handoff and change-update films

Decision: 17 November 2026. Target automation agencies handing a completed or changed workflow to a nontechnical client. The product turns reviewed execution events into a short film and a reproducible delivery record. It does not certify that an automation is correct.

## Evidence and limits

The initial research is in product-research.md. This second pass tested the premise against direct alternatives and practitioner objections:

- [Practitioner discussion](https://www.reddit.com/r/n8n/comments/1rtw6gu/how_do_you_document_your_n8n_workflows_for_clients/) describes the burden of Loom, screenshares and stale documentation. Some respondents find short videos useful; others say clients want results rather than node logic. This is anecdotal and may include promotion, not representative demand data. Design implication: show meaningful actions/outcomes; do not animate a giant workflow graph.
- [Pixtex](https://pixtex.dev/guides/document-n8n-workflows-for-clients) already promotes regenerable workflow handover diagrams and documentation. Source-driven handoff alone is not unique. Our proposed differentiation is an editable motion explanation of a specific run and its changes, with source bindings.
- [Ozor](https://www.ozor.ai/blog/automated-client-reporting-videos) already promotes automated recurring client-report videos. Monthly reporting is not an empty category. Avoid generic metrics narration as the initial wedge.
- [n8n's official lifecycle guidance](https://github.com/n8n-io/skills/blob/main/skills/n8n-workflow-lifecycle-official/SKILL.md) treats operational handoff as distinct from publishing: triggers, outputs, invocation and failure handling need explanation. A film supplements this handoff; it does not replace operational documentation.
- [n8n's System AI case study](https://n8n.io/case-studies/system-ai/) describes an agency delivering client automations with output references and logging. This establishes a relevant workflow pattern, not a customer endorsement of VibeFrames.
- [Fastlane](https://usefastlane.ai/) targets the full advertising job. The lesson is to own a narrow recurring job, not to copy advertising creative formats.

X-indexed searches did not yield sufficiently reliable direct evidence to substantiate the proposed demand. No market-size or revenue estimate is inferred from social engagement.

## Buyer and first job

Buyer: founder/delivery lead at a small automation agency. Creator: the builder handing over a reviewed run. Viewer: the client operator or owner.

First job: “Show my client what this automation did, what required a person, what was produced, and what changed since the previous reviewed run.” Start with handoff and change acceptance, not generic ads, coding-agent replay or observability.

The invoice example is illustrative. No financial execution, customer ROI or independently verified result is implied.

## Moat thesis

| Layer                  | What ships now                                                        | What could compound                                               | Evidence required                                        |
| ---------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| Source contracts       | Typed action, outcome and run-change blocks; failures remain failures | A library of tested domain/event semantics and render fixtures    | Fewer factual corrections on real agency sources         |
| Reproducibility        | Downloadable source/film fingerprints and scene bindings              | Versioned approvals, change history and regeneration              | Agencies actually return to update existing deliveries   |
| Customer configuration | Editable project, themes and local draft                              | Client brand kits, mapping rules and reusable handoff conventions | Repeat use across multiple clients                       |
| Quality learning       | Explicit checks and pilot scorecard                                   | Opt-in anonymized failure cases and comprehension evaluations     | Permissioned dataset growth improves measured quality    |
| Distribution           | No claimed channel advantage                                          | Adapter templates and agency partnerships                         | Repeat acquisition through a channel at sustainable cost |

Custom React blocks are initially an implementation advantage, not a durable moat. Models, animation and prompts can be copied. The harder asset would be accumulated domain correctness, reusable customer mappings and proven delivery workflows. There is no network effect at this stage. Private client data is not automatically training data. Projects stay portable; switching costs should come from saved work, not lock-in.

## Build sequence and acceptance gates

1. **Reliable single-run studio.** Source import/review, deterministic composition, editable copy, action/outcome blocks, aspect ratios, local draft and portable project. Gate: render actual videos with text visible; preserve pending/error/missing output; no model code execution. This foundation is implemented.
2. **Change-aware delivery.** Optional previous source, a deterministic run-change block keyed by stable event IDs, and a delivery manifest containing SHA-256 fingerprints and scene bindings. Gate: additions/removals/field changes/order changes are explicit, unchanged runs stay unchanged, no unsupported improvement claim, review required before manifest export. This is the next implementation in this change.
3. **Paid concierge pilot.** Recruit 5–8 agencies externally after user authorization to contact them. Compare their current Loom/text handoff with the film using the same information. Ask clients to identify trigger, outcome, human boundary and change. Record authoring time, corrections, comprehension, repeat use and actual payment. No outreach has been sent.
4. **Only then integrate.** Build the adapter represented most often in pilot sources. Add authenticated workspaces, client kits, approval history, durable quotas and background rendering when repeat usage justifies them. n8n/Make/Zapier integrations are not shipped claims.

## Commercial experiment and stop rules

Offer a paid delivery pilot with human onboarding; choose the price from discovery and delivery effort, not a fabricated market benchmark. Compare a workspace subscription with per-delivery credits once usage is observed.

Proposed continuation gate: at least three pilot agencies pay for a second delivery within a month, with materially less authoring effort and no factual regressions versus their current process. These are experimental thresholds, not forecasts. If clients prefer a concise diagram/text pack or agencies do not repeat, narrow to that artifact or stop the video-first bet. Do not compensate for weak demand by adding more models.

## OpenAI evaluation

Use the balanced model for bounded editorial copy and the higher-capability option for an explicit quality pass. Compare against the deterministic baseline on the same sanitized runs: factual error count, omitted failure/approval boundaries, editing time, latency and actual account cost. A model wins only if it improves the reviewed result enough to justify its cost. No key is configured in this project, so live results remain unmeasured. The pipeline must remain useful without model calls.
