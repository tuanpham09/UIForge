// biome-ignore-all format: compact project persistence model
"use client";

export type ProjectStage = "intent" | "wireframe" | "visual" | "prototype";

export type UIForgeProject = {
  id: string;
  name: string;
  description: string;
  features: string;
  platform: "web" | "mobile" | "both";
  stage: ProjectStage;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "uiforge.projects.v1";

export const readProjects = (): UIForgeProject[] => {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeProjects = (projects: UIForgeProject[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

export const createProject = (
  input: Pick<UIForgeProject, "name" | "description" | "features" | "platform">,
): UIForgeProject => {
  const now = new Date().toISOString();
  const project: UIForgeProject = {
    ...input,
    id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    stage: "intent",
    createdAt: now,
    updatedAt: now,
  };
  writeProjects([project, ...readProjects()]);
  return project;
};

export const getProject = (id: string) => readProjects().find((project) => project.id === id) ?? null;

export const deleteProject = (id: string) => writeProjects(readProjects().filter((project) => project.id !== id));

export const stageLabel = (stage: ProjectStage) =>
  ({ intent: "Product intent", wireframe: "Wireframe", visual: "Visual design", prototype: "Prototype" })[stage];
