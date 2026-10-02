import type { ViewportPreset } from "@uiforge/renderer";
import EditorCanvas from "./editor-canvas";
import RendererPreview from "./renderer-preview";

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

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-4 text-white">
      <div className="mx-auto max-w-[1600px]">
        <section>
          <EditorCanvas />
        </section>

        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            Deterministic renderer preview
          </h2>
          <RendererPreview initialPreset={initialPreset} />
        </section>
      </div>
    </main>
  );
}
