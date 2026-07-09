/**
 * Curated palettes. A palette recolors the whole video — background, accent,
 * ink — WITHOUT touching the composition JSON, so changing it re-renders the
 * preview instantly (no agent call). Blocks read these via the `palette` prop
 * threaded through VibeVideo.
 */
export interface Palette {
  id: string;
  label: string;
  bg: string;
  accent: string;
  accentDeep: string;
  ink: string;
  inkSoft: string;
  /** hue for the Backdrop glows */
  hue: number;
}

export const PALETTES: Palette[] = [
  { id: "ember", label: "Ember", bg: "#070708", accent: "#e8894a", accentDeep: "#b5532b", ink: "#f5f1ea", inkSoft: "#a5a09a", hue: 24 },
  { id: "mint", label: "Mint", bg: "#06090a", accent: "#4fd1a5", accentDeep: "#2a8f6f", ink: "#eef5f2", inkSoft: "#9db0aa", hue: 160 },
  { id: "iris", label: "Iris", bg: "#08070d", accent: "#8b7cf6", accentDeep: "#5f4fd1", ink: "#f0eefa", inkSoft: "#a8a3c0", hue: 258 },
  { id: "azure", label: "Azure", bg: "#060a0f", accent: "#4a9ee8", accentDeep: "#2b6bb5", ink: "#eaf1f8", inkSoft: "#9aa9ba", hue: 210 },
  { id: "rose", label: "Rose", bg: "#0b0709", accent: "#e85a7a", accentDeep: "#b53257", ink: "#faeef1", inkSoft: "#c0a3ab", hue: 342 },
  { id: "paper", label: "Paper", bg: "#f4f1ea", accent: "#c2683a", accentDeep: "#9a4f2a", ink: "#1a1916", inkSoft: "#6a655d", hue: 24 },
];

export const DEFAULT_PALETTE = PALETTES[0];
