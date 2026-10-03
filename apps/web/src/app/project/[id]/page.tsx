"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditorCanvas from "../../editor-canvas";
import { getProject, type UIForgeProject } from "../../project-store";

export default function ProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<UIForgeProject | null>(null);
  const [bootstrapOpen, setBootstrapOpen] = useState(true);

  useEffect(() => setProject(getProject(params.id)), [params.id]);

  if (!project) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-sm font-medium">Project not found</p>
          <button type="button" onClick={() => router.push("/")} className="mt-3 text-xs text-cyan-300">Back to projects</button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-slate-950">
      <EditorCanvas />
      {bootstrapOpen ? (
        <div className="fixed inset-0 z-[1150] flex items-center justify-center bg-black/65 p-4" role="dialog" aria-modal="true" aria-label="Start project with AI" data-testid="project-bootstrap">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-400">Project intent</p>
                <h1 className="mt-1 text-xl font-semibold">{project.name}</h1>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">{project.description}</p>
              </div>
              <button type="button" aria-label="Close project bootstrap" onClick={() => setBootstrapOpen(false)} className="rounded px-2 py-1 text-slate-500 hover:bg-slate-900">✕</button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                ["01", "Understand intent", "Agent reads the product brief and turns it into structured requirements."],
                ["02", "Map the flow", "Agent identifies screens, entry points, actions and navigation."],
                ["03", "Draw wireframe", "Agent proposes the first semantic wireframe for your review."],
              ].map(([number, title, text]) => (
                <div key={number} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <span className="text-[10px] text-cyan-400">{number}</span>
                  <h2 className="mt-2 text-xs font-semibold">{title}</h2>
                  <p className="mt-2 text-[10px] leading-5 text-slate-500">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Core features</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{project.features || "No extra requirements supplied. The agent can infer a first pass from the product description."}</p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
              <button type="button" onClick={() => router.push("/")} className="text-xs text-slate-500 hover:text-slate-300">← Projects</button>
              <button type="button" data-testid="start-agent-workspace" onClick={() => setBootstrapOpen(false)} className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950">
                Enter workspace →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
