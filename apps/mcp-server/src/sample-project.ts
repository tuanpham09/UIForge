import { codeMappingSet, componentRegistry } from "@uiforge/component-registry";
import { defaultTokenSet } from "@uiforge/design-tokens";
import type { UIDocument, UINode } from "@uiforge/ui-schema";
import {
  dashboardFixture,
  loginFixture,
  mobileListFixture,
} from "@uiforge/ui-schema/fixtures";
import type {
  Flow,
  ProjectProvider,
  ProjectSnapshot,
  UserJourney,
} from "./types";

const mergeDocuments = (...documents: UIDocument[]): UIDocument => {
  const [first, ...rest] = documents;
  if (!first) throw new Error("At least one document is required");

  return {
    ...first,
    id: "sample-project",
    metadata: {
      name: "UIForge MCP Sample Project",
      description:
        "Deterministic semantic projection used by MCP contract tests.",
      productIntentRef: "fixture.dashboard",
      designStrategyRef: "uiforge.design-strategy/v1",
    },
    revision: {
      ...first.revision,
      revision: 7,
      updatedAt: "2026-10-01T08:00:00.000Z",
      source: "import",
    },
    screens: [first, ...rest].flatMap((document) => document.screens),
    nodes: Object.assign({}, ...documents.map((document) => document.nodes)),
    assets: Object.assign({}, ...documents.map((document) => document.assets)),
  };
};

const document = mergeDocuments(
  dashboardFixture,
  loginFixture,
  mobileListFixture,
);

const flows: Flow[] = [
  {
    id: "flow.authenticated-details",
    name: "Open details",
    startingPoint: { screenId: "screen.dashboard" },
    transitions: [
      {
        id: "transition.dashboard.open-details",
        source: { screenId: "screen.dashboard", nodeId: "dashboard.cta" },
        trigger: "click",
        action: "navigate",
        destination: { screenId: "screen.mobile-list" },
      },
    ],
  },
  {
    id: "flow.sign-in",
    name: "Sign in",
    startingPoint: { screenId: "screen.login" },
    transitions: [
      {
        id: "transition.login.submit",
        source: { screenId: "screen.login", nodeId: "login.submit" },
        trigger: "submit",
        action: "authenticate",
        destination: { screenId: "screen.dashboard" },
      },
    ],
  },
];

const journeys: UserJourney[] = [
  {
    id: "journey.sign-in-and-open-details",
    name: "Sign in and open details",
    flowIds: ["flow.sign-in", "flow.authenticated-details"],
    screenIds: ["screen.login", "screen.dashboard", "screen.mobile-list"],
  },
];

const snapshot: ProjectSnapshot = {
  projectId: "sample-project",
  document,
  tokens: defaultTokenSet,
  registry: componentRegistry,
  flows,
  journeys,
  revision: 7,
  updatedAt: "2026-10-01T08:00:00.000Z",
  codeSpec: {
    version: "uiforge.code-spec/v1",
    status: "not-implemented",
    reason:
      "Code specification is owned by #13; MCP exposes a stable read seam without inventing implementation requirements.",
  },
};

export const sampleProjectProvider: ProjectProvider = {
  getProject(projectId) {
    return projectId === snapshot.projectId ? snapshot : null;
  },
};

export const sampleProject = snapshot;

export const codeMappings = codeMappingSet;

export function getLayoutTree(
  document: UIDocument,
  screenId: string,
): UINode | null {
  const screen = document.screens.find((item) => item.id === screenId);
  if (!screen) return null;

  const visit = (nodeId: string): UINode | null => {
    const node = document.nodes[nodeId];
    if (!node) return null;
    return {
      ...node,
      childrenIds: node.childrenIds
        .map((childId) => visit(childId)?.id)
        .filter((childId): childId is string => Boolean(childId)),
    };
  };

  return visit(screen.rootNodeId);
}
