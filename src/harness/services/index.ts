import { createClipRegistryService } from "./clip-registry.service";
import { createTransitionRegistryService } from "./transition-registry.service";
import type { HarnessServices } from "./types";

export function createHarnessServices(): HarnessServices {
  return {
    clipRegistry: createClipRegistryService(),
    transitionRegistry: createTransitionRegistryService(),
  };
}

export type { HarnessServices };
