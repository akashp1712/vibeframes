/**
 * Human-friendly labels for tool calls.
 *
 * Two variants per tool:
 *   verb     — present continuous, used in the ephemeral status line ("Adding clip…")
 *   noun     — past-tense / noun phrase, used in the persistent activity timeline ("Added clip")
 *
 * Falls back to a reasonable Title Case of the kebab id if unknown.
 */

interface ToolLabel {
  verb: string;
  noun: string;
}

const LABELS: Record<string, ToolLabel> = {
  "add-clip": { verb: "Adding clip", noun: "Added clip" },
  "update-clip": { verb: "Editing clip", noun: "Updated clip" },
  "remove-clip": { verb: "Removing clip", noun: "Removed clip" },
  "get-composition": { verb: "Reading scene", noun: "Read scene" },
  "get-block-schemas": { verb: "Browsing blocks", noun: "Browsed blocks" },
  skill: { verb: "Loading skill", noun: "Loaded skill" },
};

function titleCase(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function toolVerb(toolName: string): string {
  return LABELS[toolName]?.verb ?? titleCase(toolName);
}

export function toolNoun(toolName: string): string {
  return LABELS[toolName]?.noun ?? titleCase(toolName);
}
