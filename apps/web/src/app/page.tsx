import type { ViewportPreset } from "@uiforge/renderer";
import StudioWorkspace from "./studio-workspace";

const viewportPresets = new Set<ViewportPreset>([
  "wide",
  "desktop",
  "tablet",
  "mobile",
]);

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ viewport?: string }>;
}) {
  const params = await searchParams;
  const requested = params.viewport;
  const initialPreset = viewportPresets.has(requested as ViewportPreset)
    ? (requested as ViewportPreset)
    : "wide";

  return <StudioWorkspace initialPreset={initialPreset} />;
}
