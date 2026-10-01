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
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium text-cyan-300">
          UIForge · P1 Visual Core
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Canonical UI Schema → Editor + Preview
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          The renderer consumes UI Schema and design tokens directly. tldraw
          remains an editor projection and never becomes the persistence model.
        </p>
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">
            Deterministic web preview
          </h2>
          <RendererPreview initialPreset={initialPreset} />
        </section>
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Editor projection</h2>
          <EditorCanvas />
        </section>
      </div>
    </main>
  );
}
