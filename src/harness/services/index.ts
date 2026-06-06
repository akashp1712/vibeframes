import { createClipRegistryService } from "./clip-registry.service";
import type { HarnessServices } from "./types";

export function createHarnessServices(): HarnessServices {
  return {
    clipRegistry: createClipRegistryService(),
  };
}

export type { HarnessServices };
