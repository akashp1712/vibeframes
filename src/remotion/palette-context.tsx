import { createContext, useContext } from "react";
import { DEFAULT_PALETTE, type Palette } from "./palettes";

/**
 * Palette is provided at the composition root and read by blocks. This lets a
 * palette swap recolor everything without changing the composition JSON — so
 * the preview re-renders instantly, no agent call.
 */
const PaletteContext = createContext<Palette>(DEFAULT_PALETTE);

export const PaletteProvider = PaletteContext.Provider;
export const usePalette = () => useContext(PaletteContext);
