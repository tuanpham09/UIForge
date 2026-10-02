import type {
  DocumentId,
  NodeId,
  ScreenId,
  UIDocument,
  UINode,
} from "../types";

const documentId = (value: string) => value as DocumentId;
const screenId = (value: string) => value as ScreenId;
const nodeId = (value: string) => value as NodeId;

const base = (name: string): UIDocument => ({
  schemaVersion: "uiforge.schema/v1",
  id: documentId(`fixture-${name}`),
  metadata: { name: `UIForge ${name} fixture`, designStage: "wireframe" },
  revision: {
    revision: 1,
    createdAt: "2026-09-30T00:00:00.000Z",
    updatedAt: "2026-09-30T00:00:00.000Z",
    source: "import",
  },
  screens: [],
  nodes: {},
  assets: {},
});

const node = (
  id: string,
  screen: string,
  parentId: string | null,
  type: UINode["type"],
  childrenIds: string[] = [],
): UINode => ({
  id: nodeId(id),
  screenId: screenId(screen),
  parentId: parentId === null ? null : nodeId(parentId),
  childrenIds: childrenIds.map(nodeId),
  type,
  layout: {
    mode:
      type === "screen-root" || type === "section" || type === "list"
        ? "stack"
        : "flex",
    direction: "column",
    gap: { token: "space.4" as never },
  },
});

function finish(
  document: UIDocument,
  screen: string,
  name: string,
  root: UINode,
  children: UINode[],
): UIDocument {
  document.screens.push({
    id: screenId(screen),
    name,
    rootNodeId: root.id,
    nodeIds: [root.id, ...children.map((child) => child.id)],
  });
  document.nodes[root.id] = root;
  for (const child of children) {
    document.nodes[child.id] = child;
  }
  return document;
}

export const dashboardFixture = (() => {
  const d = base("dashboard");
  d.frames = [
    {
      id: "frame.dashboard.iphone13",
      screenId: "screen.dashboard" as ScreenId,
      presetId: "iphone-13",
      name: "iPhone 13 / 13 Pro",
      x: 80,
      y: 80,
      width: 390,
      height: 844,
      orientation: "portrait",
      presetVersion: "uiforge.frame-presets/v1",
    },
  ];
  const root: UINode = {
    ...node("screen.dashboard.root", "screen.dashboard", null, "screen-root", [
      "dashboard.summary",
      "dashboard.cta",
    ]),
    responsive: [
      {
        breakpoint: "mobile",
        layout: { padding: { block: { token: "space.4" } } },
      },
      {
        breakpoint: "tablet",
        layout: { padding: { block: { token: "space.6" } } },
      },
      {
        breakpoint: "desktop",
        layout: { padding: { block: { token: "space.8" } } },
      },
      {
        breakpoint: "wide",
        layout: { padding: { block: { token: "space.8" } } },
      },
    ],
  };
  const summary: UINode = {
    ...node("dashboard.summary", "screen.dashboard", root.id, "section"),
    content: { label: "Overview" },
  };
  const cta: UINode = {
    ...node("dashboard.cta", "screen.dashboard", root.id, "button"),
    content: { label: "Open details" },
    component: { registryId: "button", variant: "primary" },
    accessibility: { accessibleName: "Open details" },
    interaction: {
      interactive: true,
      trigger: "click",
      action: "navigate",
      targetScreenId: screenId("screen.mobile-list"),
    },
  };
  return finish(d, "screen.dashboard", "Dashboard", root, [summary, cta]);
})();

export const loginFixture = (() => {
  const d = base("login");
  const root: UINode = {
    ...node("screen.login.root", "screen.login", null, "screen-root", [
      "login.email",
      "login.submit",
    ]),
    responsive: [
      {
        breakpoint: "mobile",
        layout: { padding: { block: { token: "space.4" } } },
      },
      {
        breakpoint: "tablet",
        layout: { padding: { block: { token: "space.6" } } },
      },
      {
        breakpoint: "desktop",
        layout: { padding: { block: { token: "space.8" } } },
      },
      {
        breakpoint: "wide",
        layout: { padding: { block: { token: "space.8" } } },
      },
    ],
  };
  const email: UINode = {
    ...node("login.email", "screen.login", root.id, "input"),
    content: { label: "Email", placeholder: "you@example.com" },
    accessibility: { accessibleName: "Email" },
    interaction: { interactive: true, trigger: "input" },
  };
  const submit: UINode = {
    ...node("login.submit", "screen.login", root.id, "button"),
    content: { label: "Sign in" },
    component: { registryId: "button", variant: "primary" },
    accessibility: { accessibleName: "Sign in" },
    interaction: {
      interactive: true,
      trigger: "submit",
      action: "authenticate",
      targetScreenId: screenId("screen.dashboard"),
    },
  };
  return finish(d, "screen.login", "Login", root, [email, submit]);
})();

export const mobileListFixture = (() => {
  const d = base("mobile-list");
  const root = node(
    "screen.mobile-list.root",
    "screen.mobile-list",
    null,
    "screen-root",
    ["mobile-list.items"],
  );
  const list: UINode = {
    ...node("mobile-list.items", "screen.mobile-list", root.id, "list", [
      "mobile-list.item",
    ]),
    responsive: [
      { breakpoint: "mobile", layout: { direction: "column" } },
      { breakpoint: "tablet", layout: { direction: "row" } },
      { breakpoint: "desktop", layout: { direction: "row" } },
      { breakpoint: "wide", layout: { direction: "row" } },
    ],
  };
  const item: UINode = {
    ...node("mobile-list.item", "screen.mobile-list", list.id, "list-item"),
    content: { label: "Example item" },
  };
  const result = finish(d, "screen.mobile-list", "Mobile List", root, [
    list,
    item,
  ]);
  const screen = result.screens[0];
  if (!screen) {
    throw new Error("mobile-list fixture screen was not created");
  }
  screen.viewport = { maxWidth: 767 };
  return result;
})();

/**
 * Integrated editor fixture used by the workspace/Present flow.
 * It keeps multiple screens and frames in one canonical UI Schema document so
 * the prototype runner can resolve real semantic navigation targets.
 */
export const workspaceFixture = (() => {
  const document = structuredClone(dashboardFixture);
  const mobile = structuredClone(mobileListFixture);

  document.id = documentId("fixture-workspace");
  document.metadata = {
    ...document.metadata,
    name: "UIForge Workspace fixture",
    description:
      "Multi-screen workspace fixture for editor and prototype flows.",
  };

  for (const screen of mobile.screens) {
    document.screens.push(screen);
  }
  Object.assign(document.nodes, mobile.nodes);
  Object.assign(document.assets, mobile.assets);
  document.frames = [
    ...(document.frames ?? []),
    {
      id: "frame.mobile-list.iphone13",
      screenId: screenId("screen.mobile-list"),
      presetId: "iphone-13",
      name: "iPhone 13 / 13 Pro",
      x: 520,
      y: 80,
      width: 390,
      height: 844,
      orientation: "portrait",
      presetVersion: "uiforge.frame-presets/v1",
    },
  ];

  return document;
})();
