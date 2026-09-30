import type { UIDocument } from "../types.js";

const ref = (value: string) => value as UIDocument["id"];

const base = (name: string): UIDocument => ({
  schemaVersion: "uiforge.schema/v1",
  id: ref(`fixture-${name}`),
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
  screenId: string,
  parentId: string | null,
  type: "screen-root" | "section" | "text" | "button" | "input" | "list" | "list-item",
  childrenIds: string[] = [],
): UIDocument["nodes"][UIDocument["id"]] => ({
  id: id as UIDocument["id"],
  screenId: screenId as UIDocument["id"],
  parentId: parentId as UIDocument["id"] | null,
  childrenIds: childrenIds as UIDocument["id"][],
  type,
  layout: { mode: type === "screen-root" || type === "section" || type === "list" ? "stack" : "flex", direction: "column", gap: { token: "space.4" as never } },
});

function finish(document: UIDocument, screenId: string, name: string, root: ReturnType<typeof node>, children: ReturnType<typeof node>[]): UIDocument {
  document.screens.push({
    id: screenId as UIDocument["id"],
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
  const summary = { ...node("dashboard.summary", "screen.dashboard", root.id as string, "section", []), content: { label: "Overview" } };
  const cta = { ...node("dashboard.cta", "screen.dashboard", root.id as string, "button", []), content: { label: "Open details" }, component: { registryId: "button", variant: "primary" }, accessibility: { accessibleName: "Open details" }, interaction: { interactive: true, trigger: "click", action: "navigate", targetScreenId: "screen.mobile-list" as never } };
  return finish(d, "screen.dashboard", "Dashboard", root, [summary, cta]);
})();

export const loginFixture = (() => {
  const d = base("login");
  const root = node("screen.login.root", "screen.login", null, "screen-root", ["login.email", "login.submit"]);
  const email = { ...node("login.email", "screen.login", root.id as string, "input"), content: { label: "Email", placeholder: "you@example.com" }, accessibility: { accessibleName: "Email" }, interaction: { interactive: true, trigger: "input" } };
  const submit = { ...node("login.submit", "screen.login", root.id as string, "button"), content: { label: "Sign in" }, component: { registryId: "button", variant: "primary" }, accessibility: { accessibleName: "Sign in" }, interaction: { interactive: true, trigger: "submit", action: "authenticate", targetScreenId: "screen.dashboard" as never } };
  return finish(d, "screen.login", "Login", root, [email, submit]);
})();

export const mobileListFixture = (() => {
  const d = base("mobile-list");
  const root = node("screen.mobile-list.root", "screen.mobile-list", null, "screen-root", ["mobile-list.items"]);
  const list = node("mobile-list.items", "screen.mobile-list", root.id as string, "list", ["mobile-list.item"]);
  const item = { ...node("mobile-list.item", "screen.mobile-list", list.id as string, "list-item"), content: { label: "Example item" } };
  return finish(d, "screen.mobile-list", "Mobile List", root, [list, item]);
})();
