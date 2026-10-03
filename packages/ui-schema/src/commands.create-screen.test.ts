import { describe, expect, it } from "vitest";
import { applyCommand } from "./commands";
import type { UIDocument } from "./types";

const emptyDocument = (): UIDocument => ({
  schemaVersion: "uiforge.schema/v1",
  id: "document.test",
  metadata: { name: "Test project", designStage: "wireframe" },
  revision: {
    revision: 1,
    createdAt: "2026-10-03T00:00:00.000Z",
    updatedAt: "2026-10-03T00:00:00.000Z",
    source: "manual",
  },
  screens: [
    {
      id: "screen.home",
      name: "Home",
      rootNodeId: "node.home.root",
      nodeIds: ["node.home.root"],
    },
  ],
  nodes: {
    "node.home.root": {
      id: "node.home.root",
      screenId: "screen.home",
      parentId: null,
      childrenIds: [],
      type: "screen-root",
      layout: { mode: "stack", direction: "column" },
    },
  },
  assets: {},
});

describe("CreateScreen command", () => {
  it("creates a new screen and semantic root", () => {
    const next = applyCommand(emptyDocument(), {
      type: "CreateScreen",
      commandId: "test.create-screen",
      screen: {
        id: "screen.details",
        name: "Details",
        route: "/details",
        rootNodeId: "node.details.root",
        nodeIds: ["node.details.root"],
      },
      rootNode: {
        id: "node.details.root",
        screenId: "screen.details",
        parentId: null,
        childrenIds: [],
        type: "screen-root",
        layout: { mode: "stack", direction: "column" },
      },
    });

    expect(next.screens.map((screen) => screen.id)).toEqual([
      "screen.home",
      "screen.details",
    ]);
    expect(next.nodes["node.details.root"]?.type).toBe("screen-root");
    expect(next.revision.revision).toBe(2);
  });

  it("rejects a root that does not match screen metadata", () => {
    expect(() =>
      applyCommand(emptyDocument(), {
        type: "CreateScreen",
        commandId: "test.create-screen.invalid",
        screen: {
          id: "screen.details",
          name: "Details",
          rootNodeId: "node.details.root",
          nodeIds: ["node.details.root"],
        },
        rootNode: {
          id: "node.other.root",
          screenId: "screen.details",
          parentId: null,
          childrenIds: [],
          type: "screen-root",
          layout: { mode: "stack", direction: "column" },
        },
      }),
    ).toThrow("screen root does not match screen metadata");
  });
});
