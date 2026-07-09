import { PALETTES, type Palette } from "@/remotion/palettes";

/**
 * Palette swatches in the topbar. Selecting one recolors the video instantly —
 * it only changes the `palette` prop the Player reads, so the preview
 * re-renders statically with no agent call.
 */
export function PalettePicker({
  value,
  onChange,
}: {
  value: Palette;
  onChange: (p: Palette) => void;
}) {
  return (
    <div className="studio-palette" role="group" aria-label="Color palette">
      {PALETTES.map((p) => (
        <button
          key={p.id}
          className="studio-swatch"
          data-active={p.id === value.id}
          title={p.label}
          aria-label={p.label}
          onClick={() => onChange(p)}
          style={{ background: p.accent }}
        />
      ))}
    </div>
  );
}
