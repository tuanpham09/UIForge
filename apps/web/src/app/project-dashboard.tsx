// biome-ignore-all format: dense dashboard product surface
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  createProject,
  deleteProject,
  readProjects,
  stageLabel,
  type UIForgeProject,
} from "./project-store";

type CreateDraft = {
  name: string;
  description: string;
  features: string;
  platform: UIForgeProject["platform"];
};

const emptyDraft: CreateDraft = { name: "", description: "", features: "", platform: "web" };

export default function ProjectDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<UIForgeProject[]>([]);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<CreateDraft>(emptyDraft);

  useEffect(() => setProjects(readProjects()), []);

  const filtered = useMemo(
    () =>
      projects.filter((project) =>
        `${project.name} ${project.description} ${project.features}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [projects, query],
  );

  const submit = () => {
    if (!draft.name.trim() || !draft.description.trim()) return;
    const project = createProject({
      name: draft.name.trim(),
      description: draft.description.trim(),
      features: draft.features.trim(),
      platform: draft.platform,
    });
    setProjects(readProjects());
    setDraft(emptyDraft);
    setCreateOpen(false);
    router.push(`/project/${project.id}`);
  };

  return (
    <main className="min-h-screen bg-[#0b0d10] text-white" data-testid="project-dashboard">
      <header className="border-b border-slate-800/80 bg-[#0d1014]">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
          <div>
            <p className="text-sm font-semibold tracking-tight">UIForge</p>
            <p className="text-[10px] text-slate-500">AI product design workspace</p>
          </div>
          <button type="button" data-testid="create-project" onClick={() => setCreateOpen(true)} className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300">
            + New project
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-6 pb-16 pt-12">
        <div className="max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-400">Projects</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">What are you building?</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Start with the product idea. UIForge will carry that intent into agent planning, user flows, wireframes, and then visual UI design.
          </p>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <input aria-label="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects…" className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-500" />
          <span className="text-[10px] text-slate-600">{filtered.length} project{filtered.length === 1 ? "" : "s"}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-8 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-cyan-300">✦</div>
            <h2 className="mt-4 text-sm font-semibold">No projects yet</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">Describe your product in plain language. You do not need to know the screens or layout yet — the agents will structure that next.</p>
            <button type="button" onClick={() => setCreateOpen(true)} className="mt-5 rounded-lg border border-cyan-500/40 px-4 py-2 text-xs text-cyan-300 hover:bg-cyan-500/10">Create your first project</button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <article key={project.id} className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 hover:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => router.push(`/project/${project.id}`)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">{project.name}</p>
                    <p className="mt-1 line-clamp-3 text-[11px] leading-5 text-slate-500">{project.description}</p>
                  </button>
                  <button type="button" aria-label={`Delete ${project.name}`} onClick={() => { deleteProject(project.id); setProjects(readProjects()); }} className="rounded px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-800 hover:text-red-300">•••</button>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-3">
                  <span className="rounded-full border border-slate-700 px-2 py-1 text-[9px] text-slate-400">{stageLabel(project.stage)}</span>
                  <span className="text-[9px] text-slate-600">{new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {createOpen ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Create project" data-testid="create-project-modal">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-cyan-400">New project</p>
                <h2 className="mt-1 text-lg font-semibold">Describe what you want to build</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Think like a product brief, not a UI specification.</p>
              </div>
              <button type="button" aria-label="Close create project" onClick={() => setCreateOpen(false)} className="rounded px-2 py-1 text-slate-500 hover:bg-slate-900">✕</button>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="text-[10px] text-slate-500">
                Project name
                <input data-testid="project-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Cò Coffee Operations" className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-500" />
              </label>
              <label className="text-[10px] text-slate-500">
                What are you building?
                <textarea data-testid="project-description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Build an app for… Who uses it? What problem does it solve? What should users be able to accomplish?" className="mt-1 min-h-28 w-full resize-y rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-xs leading-5 text-white outline-none focus:border-cyan-500" />
              </label>
              <label className="text-[10px] text-slate-500">
                Core features / requirements
                <textarea data-testid="project-features" value={draft.features} onChange={(event) => setDraft({ ...draft, features: event.target.value })} placeholder="For example: inventory, daily sales, cost calculation, reports, roles…" className="mt-1 min-h-24 w-full resize-y rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-xs leading-5 text-white outline-none focus:border-cyan-500" />
              </label>
              <div>
                <p className="text-[10px] text-slate-500">Target platform</p>
                <div className="mt-2 flex gap-2">
                  {(["web", "mobile", "both"] as const).map((platform) => (
                    <button key={platform} type="button" onClick={() => setDraft({ ...draft, platform })} className={`rounded-lg border px-3 py-2 text-[10px] capitalize ${draft.platform === platform ? "border-cyan-500 bg-cyan-500/10 text-cyan-300" : "border-slate-800 text-slate-500"}`}>
                      {platform === "both" ? "Web + Mobile" : platform}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
              <p className="text-[9px] text-slate-600">Next: AI agents structure the product flow and initial wireframe.</p>
              <button type="button" data-testid="create-project-submit" disabled={!draft.name.trim() || !draft.description.trim()} onClick={submit} className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-40">Create & continue →</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
