// biome-ignore-all format: compact project workspace surface
"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import type { UIDocument } from "@uiforge/ui-schema";
import EditorCanvas from "../../editor-canvas";
import {
  createProjectDocument,
  readProjectDocument,
  writeProjectDocument,
} from "../../project-document";
import { getProject, updateProject, type UIForgeProject } from "../../project-store";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [project, setProject] = useState<UIForgeProject | null>(null);
  const [document, setDocument] = useState<UIDocument | null>(null);
  const [bootstrapOpen, setBootstrapOpen] = useState(true);

  useEffect(() => {
    const nextProject = getProject(id);
    setProject(nextProject);
    if (nextProject) {
      setDocument(
        readProjectDocument(id) ??
          createProjectDocument({
            id: nextProject.id,
            name: nextProject.name,
            description: nextProject.description,
            platform: nextProject.platform,
          }),
      );
    }
  }, [id]);

  if (!project || !document) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-sm font-medium">
            {project === null ? "Project not found" : "Loading project…"}
          </p>
          {project === null ? (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-3 text-xs text-cyan-300"
            >
              Back to projects
            </button>
          ) : null}
        </div>
      </main>
    );
  }

  const handleDocumentChange = useCallback((next: UIDocument) => {
    setDocument(next);
    writeProjectDocument(project.id, next);
    const stage = next.metadata.designStage === "visual" ? "visual" : "wireframe";
    updateProject(project.id, { stage });
  }, [project.id]);

  return (
    <main className="relative min-h-screen bg-slate-950">
      <EditorCanvas
        initialDocument={document}
        onDocumentChange={handleDocumentChange}
        autoOpenAgentChat={!bootstrapOpen}
        projectIntent={{
          name: project.name,
          description: project.description,
          features: project.features,
          platform: project.platform,
        }}
      />

      {bootstrapOpen ? (
        <div
          className="fixed inset-0 z-[1150] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Start project with AI"
          data-testid="project-bootstrap"
        >
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-400">
                  Project intent
                </p>
                <h1 className="mt-1 text-xl font-semibold">{project.name}</h1>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">
                  {project.description}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close project bootstrap"
                onClick={() => setBootstrapOpen(false)}
                className="rounded px-2 py-1 text-slate-500 hover:bg-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                Starting state
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                This project starts from a real empty semantic document. Nothing
                below is a demo screen. The Design Agent will inspect your
                product intent, create the product flow, and propose the first
                wireframe.
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ["01", "Understand intent", "Read the product brief and requirements."],
                ["02", "Map the flow", "Create screens, entry points and navigation."],
                ["03", "Draw wireframe", "Build structural UI nodes for review."],
              ].map(([number, title, text]) => (
                <div
                  key={number}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                >
                  <span className="text-[10px] text-cyan-400">{number}</span>
                  <h2 className="mt-2 text-xs font-semibold">{title}</h2>
                  <p className="mt-2 text-[10px] leading-5 text-slate-500">
                    {text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Core requirements
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                {project.features ||
                  "No extra requirements supplied. The agent will infer a first pass from the product description."}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                ← Projects
              </button>
              <button
                type="button"
                data-testid="start-agent-workspace"
                onClick={() => setBootstrapOpen(false)}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950"
              >
                Enter workspace →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
