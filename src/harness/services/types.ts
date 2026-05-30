export interface ClipRegistryService {
  getBlockSchemas(): HyperFramesBlock[];
}

export interface HyperFramesBlock {
  id: string;
  name: string;
  description: string;
  template: string;
}

export interface HarnessServices {
  clipRegistry: ClipRegistryService;
}
