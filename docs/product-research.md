# VibeFrames: make automation understandable

Research and product decision, 17 November 2026. This is a positioning hypothesis, not evidence of product-market fit.

## The decision

Build workflow films for AI automation agencies presenting work to clients. The input is a small, reviewed set of execution events. The output is an editable, branded film showing the request, actions, human approval, and source-reported result. Start with client handoffs and delivery updates, where explaining invisible automation is recurring work.

A general prompt-to-motion product is easy to compare with a large and growing field. A better initial job is: “Help my client understand what the automation actually did, without giving them an observability dashboard or asking me to edit a screen recording.” This also gives our custom blocks a specific reason to exist.

## What the research changed

The original launch-video direction was too broad. Filmagic, Motionflare, Wevi, and tday all surfaced around AI motion/product videos. Developer education was not an empty niche either: TapVid explicitly markets API-documentation videos, and ngram has a developer-relations solution. Metrics-to-video also has direct entrants such as PictoGrammy and Ozor. These adjacent options narrowed the decision; none proves demand for the remaining hypothesis.

| Category | Primary source | What it establishes | Implication |
| --- | --- | --- | --- |
| Performance marketing | [Fastlane](https://usefastlane.ai/) | Positions around the advertising workflow, including brand/context, creative and launch/learning | Borrow the complete job-to-be-done approach, not its ads niche or unsupported performance claims |
| API documentation films | [TapVid](https://tapvid.ai/feature/api-documentation-video) | Explicitly offers this use case | Do not pitch API docs as an uncontested niche |
| Developer relations | [ngram](https://www.ngram.com/solutions/developer-relations) | Targets developer-facing content | Generic technical product videos are already served |
| Metric storytelling | [PictoGrammy](https://pictogrammy.com/) | Markets metrics transformed into cinematic video | Avoid another generic dashboard-to-video product |
| Recurring reports | [Ozor](https://ozor.ai/blog/automated-weekly-report-video) | Describes automated weekly video reports | Recurring reports alone are not differentiation |
| Client communication | [AgencyAnalytics](https://agencyanalytics.com/client-reporting-guide/client-reporting-best-practices) | Vendor guidance includes personal video explanations in reporting | Supports an adjacent communication habit; it does not measure willingness to pay for our product |
| Agent observability | [LangSmith trajectories](https://www.langchain.com/blog/langsmith-trajectories-tracing) | Makes agent trajectories more readable for inspection and feedback | Understandable traces are valuable, but we should not build another debugger |
| Agent replay | [agent-replay](https://github.com/shusingh/agent-replay) | Agent session replay/debugging adjacency | Replay is not a defensible claim by itself |
| Automatic demos | [demovie](https://github.com/enszrlu/demovie), [aidemo](https://github.com/tandryukha/aidemo), [AgentClip](https://agentclip.dev/) | Source-driven demo and agent-video tools exist | Position around agency/client comprehension and reusable delivery formats, not “first agent-to-video” |

Searches included the requested skills.sh, Google/web-indexed results and X-indexed discussions. X results were noisy and some were secondary mirrors. No specific “Opus 5.5” social clip was verified well enough to use as technical evidence. Vendor pages establish positioning, not independently measured quality, market size, or revenue.

## The specific wedge

Buyer: the owner or delivery lead of a small AI automation agency. User: the builder who has completed a workflow and needs to explain it. Viewer: the client stakeholder who does not read execution logs.

First repeatable scenario: an invoice-matching workflow that finds an order, compares items, requests a human decision, and records a result. The supplied sample is illustrative; it does not claim that a real invoice was processed or a payment was initiated.

The film is a communication artifact, not an audit certificate. It records what the supplied source says and makes the approval boundary visible. A client can pause the film, ask questions, and retain the editable source project.

## Custom-block strategy

1. **Action trail:** ordered events, explicit pending/error/success states, source references and source-reported timing. Editorial playback duration is separate from execution duration.
2. **Outcome receipt:** the last supplied output event and its reference. If there is no output event, say so. Never infer completion from a successful tool call.
3. **Human checkpoint:** currently expressed as an approval event within the action trail. A dedicated block with actor/decision metadata is a future extension, not a shipped integration.
4. **Supporting motion:** opening typography, product/screenshot stage, focused screenshot, before/after framing, feature rhythm, signature. These are author-controlled editorial context.

The renderer owns evidence-bearing fields; the model can shape surrounding copy but cannot rewrite the source events. The potential moat is a growing set of domain-specific, tested scene contracts, anonymized opt-in evaluation cases, agency brand systems and import adapters. A collection of React templates alone is not a moat. No private client runs should be collected by default.

## Pipeline guidance and implementation

Official [Remotion AI skills](https://www.remotion.dev/docs/ai/skills) and [skills.sh package](https://skills.sh/remotion-dev/skills) guide frame-driven animation and rendering. Official [Mastra skills](https://mastra.ai/blog/introducing-mastra-skills) and [structured output](https://mastra.ai/docs/agents/structured-output) guide the optional director. The installed skill bundle and lockfile are in the repository; the app does not execute instructions from imported workflow data.

The pipeline is bounded: normalize/import → remove common sensitive patterns → human review → deterministic composition or optional structured OpenAI direction → edit/review → Remotion preview → local MP4 export. Source schema versioning, strict bounds, fixed block identifiers and local rendering make this easier to test than generated executable React.

[Browser rendering](https://www.remotion.dev/docs/web-renderer/render-media-on-web) avoids shipping client screenshots to a render server. It requires compatible browser codecs and has a smaller rendering surface than Chromium. The project export and Remotion CLI provide a fallback. We do not promise universal browser support.

## Model selection

The current [OpenAI model catalog](https://developers.openai.com/api/docs/models) informed the configured choices: GPT-6.1 Sol for the bounded editorial task and GPT-6 Astra for an explicit quality pass. Models are environment-overridable. Neither is used to generate video pixels; Remotion provides deterministic typography and layout. Paying a video model to reproduce tool labels would add variability without helping this job.

No API key was present in the connected VibeFrames project or execution environment. Therefore no live account-backed quality, latency or cost results are claimed. The provider integration is implemented, but needs a real credential and accessible model IDs to complete that evaluation. UI names describe intended defaults, not confirmed account entitlements.

## Validation before expanding

Recruit 5–8 automation agencies and ask for one sanitized completed run each. Use a concierge pilot first; do not build integrations before seeing the actual export formats. Compare a workflow film against their current screen recording or text update with the same client. Ask the viewer to identify the trigger, key actions, human decision and outcome.

Record time from import to approved film, source corrections required, viewer comprehension, whether the agency reuses it in the next delivery, and whether they will pay for the second use. A useful initial success gate is several agencies paying and repeating within a month; that is a proposed decision rule, not a forecast. Test per-workspace pricing against per-delivery credits after observing usage. Avoid invented TAM, fake customer logos, unsupported ROI, or predetermined pricing.

Only then prioritize the dominant adapter (n8n, Make, Zapier, Mastra or LangSmith), reusable client brand kits, and batch delivery. Do not claim any of those adapters are included in this build: the shipped import is normalized JSON with a sample and paste/upload paths.
