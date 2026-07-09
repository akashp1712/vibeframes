import { Geist, Geist_Mono } from "next/font/google";
import "../../../components/studio/studio.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

/**
 * Studio shares the marketing site's warm, light editorial identity —
 * same Geist type, same cream/stone/amber palette — scoped under
 * `studio-root` so the console layout can own its own structure.
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${sans.variable} ${mono.variable} studio-root`}>{children}</div>;
}
