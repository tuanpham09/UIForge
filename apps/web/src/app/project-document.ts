import {
  createFrameFromPreset,
  type UIDocument,
  type ScreenId,
} from "@uiforge/ui-schema";

export type ProjectPlatform = "web" | "mobile" | "both";

const now = () => new Date().toISOString();

export function createProjectDocument(input: {
  id: string;
  name: string;
  description: string;
  platform: ProjectPlatform;
}): UIDocument {
  const screenId = `screen.${input.id}.home` as ScreenId;
  const rootId = `node.${input.id}.home.root`;
  const createdAt = now();
  const document: UIDocument = {
    schemaVersion: "uiforge.schema/v1",
    id: `document.${input.id}`,
    metadata: {
      name: input.name,
      description: input.description,
      productIntentRef: input.id,
      designStage: "wireframe",
    },
    revision: {
      revision: 1,
      createdAt,
      updatedAt: createdAt,
      source: "manual",
    },
    screens: [
      {
        id: screenId,
        name: "Home",
        route: "/",
        rootNodeId: rootId,
        nodeIds: [rootId],
      },
    ],
    frames: [
      createFrameFromPreset(
        `frame.${input.id}.home`,
        screenId,
        input.platform === "web" ? "desktop-1440" : "iphone-16",
        80,
        80,
      ),
    ],
    nodes: {
      [rootId]: {
        id: rootId,
        screenId,
        parentId: null,
        childrenIds: [],
        type: "screen-root",
        layout: {
          mode: "stack",
          direction: "column",
          gap: { token: "space.4" },
        },
        content: { label: "Home" },
      },
    },
    assets: {},
  };

  if (input.platform === "both") {
    document.frames?.push(
      createFrameFromPreset(
        `frame.${input.id}.home.mobile`,
        screenId,
        "iphone-16",
        560,
        80,
      ),
    );
  }

  return document;
}

const documentKey = (projectId: string) => `uiforge.project.document.v1.${projectId}`;

export function readProjectDocument(projectId: string): UIDocument | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(documentKey(projectId));
    if (!value) return null;
    return JSON.parse(value) as UIDocument;
  } catch {
    return null;
  }
}

export function writeProjectDocument(projectId: string, document: UIDocument): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(documentKey(projectId), JSON.stringify(document));
}
