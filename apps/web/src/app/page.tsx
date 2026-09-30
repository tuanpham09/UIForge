import EditorCanvas from "./editor-canvas";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium text-cyan-300">UIForge · P1 Editor</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Canonical UI Schema → tldraw
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          tldraw is a projection only. Stable UIForge node IDs stay in shape
          metadata; canonical persistence remains the UI Schema.
        </p>
        <EditorCanvas />
      </div>
    </main>
  );
}
