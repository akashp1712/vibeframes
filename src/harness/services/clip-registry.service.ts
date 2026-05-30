import type { ClipRegistryService, HyperFramesBlock } from "./types";

const BLOCKS: HyperFramesBlock[] = [
  {
    id: "hero-title",
    name: "Hero Title",
    description: "A large, centered hero title with a gradient background",
    template: `<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800"><h1 class="text-6xl font-extrabold tracking-tight text-white shadow-sm">{{title}}</h1></div>`,
  },
  {
    id: "lower-third",
    name: "Lower Third",
    description: "A professional lower third banner for names and titles",
    template: `<div class="absolute bottom-10 left-10 flex flex-col justify-center rounded-xl bg-slate-900/80 p-6 backdrop-blur-md border border-slate-700"><h2 class="text-4xl font-bold text-white">{{name}}</h2><p class="text-2xl text-slate-300">{{role}}</p></div>`,
  },
  {
    id: "split-screen",
    name: "Split Screen text/image",
    description: "Split screen with text on the left and a placeholder image on the right",
    template: `<div class="flex h-full w-full bg-slate-950 text-white"><div class="flex flex-1 flex-col justify-center p-16"><h2 class="text-5xl font-bold mb-4">{{heading}}</h2><p class="text-2xl text-slate-400">{{subheading}}</p></div><div class="flex-1 bg-slate-800"></div></div>`,
  },
];

export function createClipRegistryService(): ClipRegistryService {
  return {
    getBlockSchemas: () => BLOCKS,
  };
}
