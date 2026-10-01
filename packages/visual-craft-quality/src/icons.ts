// biome-ignore-all format: visual craft contract is maintained as semantic reference data
// biome-ignore-all assist/source/organizeImports: semantic package exports are intentionally grouped
import type { IconDefinition, IconRegistry } from "./types";

export const defaultIconRegistry: IconRegistry = {
  version: "uiforge.icons/v1",
  defaultProvider: "lucide",
  icons: {
    search: { id:"search", provider:"lucide", format:"svg", family:"outline", weight:"regular", sizes:[12,16,20,24], assetRef:"lucide:search" },
    plus: { id:"plus", provider:"lucide", format:"svg", family:"outline", weight:"regular", sizes:[16,20,24], assetRef:"lucide:plus" },
    settings: { id:"settings", provider:"lucide", format:"svg", family:"outline", weight:"regular", sizes:[16,20,24], assetRef:"lucide:settings" },
    arrowRight: { id:"arrowRight", provider:"lucide", format:"svg", family:"outline", weight:"regular", sizes:[16,20,24], assetRef:"lucide:arrow-right" },
    menu: { id:"menu", provider:"lucide", format:"svg", family:"outline", weight:"regular", sizes:[20,24], assetRef:"lucide:menu" }
  }
};

export function resolveIcon(registry: IconRegistry, id: string): IconDefinition | undefined {
  return registry.icons[id];
}
