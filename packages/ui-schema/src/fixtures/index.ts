import type { UIDocument, UINode, DocumentId, ScreenId, NodeId } from "../types.js";

const documentId = (value: string) => value as DocumentId;
const screenId = (value: string) => value as ScreenId;
const nodeId = (value: string) => value as NodeId;

const base = (name: string): UIDocument => ({
  schemaVersion: "uiforge.schema/v1",
  id: documentId(`fixture-${name}`),
  metadata: { name: `UIForge ${name} fixture` },
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
    mode: type === "screen-root" || type === "section" || type === "list" ? "stack" : "flex",
    direction: "column",
    gap: { token: "space.4" as never },
  },
});

function finish(document: UIDocument, screen: string, name: string, root: UINode, children: UINode[]): UIDocument {
  document.screens.push({
    id: screenId(screen),
    name,
    rootNodeId: root.id,
    nodeIds: [root.id, ...children.map((child) => child.id)],
  });
  document.nodes[root.id] = root;
  for (const child of children) document.nodes[child.id] = child;
  return document;
}

export const dashboardFixture = (() => {
  const d = base("dashboard");
  const root = node("screen.dashboard.root", "screen.dashboard", null, "screen-root", ["dashboard.summary", "dashboard.cta"]);
  const summary = { ...node("dashboard.summary", "screen.dashboard", root.id, "section"), content: { label: "Overview" } };
  const cta = {
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
  const root = node("screen.login.root", "screen.login", null, "screen-root", ["login.email", "login.submit"]);
  const email = {
    ...node("login.email", "screen.login", root.id, "input"),
    content: { label: "Email", placeholder: "you@example.com" },
    accessibility: { accessibleName: "Email" },
    interaction: { interactive: true, trigger: "input" },
  };
  const submit = {
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
  const root = node("screen.mobile-list.root", "screen.mobile-list", null, "screen-root", ["mobile-list.items"]);
  const list = node("mobile-list.items", "screen.mobile-list", root.id, "list", ["mobile-list.item"]);
  const item = { ...node("mobile-list.item", "screen.mobile-list", list.id, "list-item"), content: { label: "Example item" } };
  const result = finish(d, "screen.mobile-list", "Mobile List", root, [list, item]);
  result.screens[0].viewport = { maxWidth: 767 };
  return result;
})();
