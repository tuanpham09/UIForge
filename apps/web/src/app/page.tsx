import EditorCanvas from "./editor-canvas";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-4 text-white">
      <div className="mx-auto max-w-[1800px]">
        <EditorCanvas />
      </div>
    </main>
  );
}
