/**
 * Canonical brand colors for well-known brands.
 *
 * When the LLM emits malformed hex (e.g. "#5E6AD2}}") in the brief but
 * does set a recognizable brand.name, we fall back to the canonical
 * value here. Same set the brief skill mentions in its inference
 * cheat-sheet — keeping them in sync is a manual chore for now; flag
 * for a future "brand-pack" loader (DESIGN.md import).
 *
 * Lookup is case-insensitive, trims whitespace, and matches against
 * the brand name verbatim. No fuzzy matching — if the name doesn't
 * match exactly, return undefined and the translator falls back to
 * its tasteful gradient.
 */
export interface CanonicalBrand {
  name: string;
  primaryColor: string;
  accentColor?: string;
}

const KNOWN: CanonicalBrand[] = [
  { name: "Linear", primaryColor: "#5E6AD2" },
  { name: "Stripe", primaryColor: "#635BFF" },
  { name: "Vercel", primaryColor: "#000000" },
  { name: "Anthropic", primaryColor: "#D97757" },
  { name: "OpenAI", primaryColor: "#10A37F" },
  { name: "Notion", primaryColor: "#000000" },
  { name: "Figma", primaryColor: "#F24E1E", accentColor: "#A259FF" },
  { name: "GitHub", primaryColor: "#24292E" },
  { name: "Slack", primaryColor: "#4A154B" },
  { name: "Discord", primaryColor: "#5865F2" },
  { name: "Spotify", primaryColor: "#1DB954" },
  { name: "Apple", primaryColor: "#000000" },
  { name: "Tesla", primaryColor: "#CC0000" },
  { name: "Airbnb", primaryColor: "#FF5A5F" },
  { name: "Uber", primaryColor: "#000000" },
  { name: "Shopify", primaryColor: "#96BF48" },
  { name: "Cloudflare", primaryColor: "#F38020" },
  { name: "MongoDB", primaryColor: "#13AA52" },
  { name: "Supabase", primaryColor: "#3ECF8E" },
  { name: "Replit", primaryColor: "#F26207" },
  { name: "Mastra", primaryColor: "#7C3AED" },
];

const BY_NAME = new Map(KNOWN.map((b) => [b.name.toLowerCase(), b]));

export function lookupBrand(name: string | undefined | null): CanonicalBrand | undefined {
  if (!name) return undefined;
  return BY_NAME.get(name.trim().toLowerCase());
}

/**
 * Default fallback palette. Used when the brief has no brand.name OR
 * the name isn't in the registry AND no explicit hex was set.
 */
export const DEFAULT_BRAND: CanonicalBrand = {
  name: "VibeFrames",
  primaryColor: "#7C3AED", // violet — neutral, contrasts on both light and dark
  accentColor: "#F59E0B", // amber accent
};
