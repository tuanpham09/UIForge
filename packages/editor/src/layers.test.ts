import type { UIDocument, UINode } from "@uiforge/ui-schema";
import { describe, expect, it } from "vitest";
import { buildLayerTree, filterLayers, flattenLayers } from "./layers";

function node(
  id: string,
  screenId: string,
  parentId: string | null,
  childrenIds: string[] = [],
  extra: Partial<UINode> = {},
): UINode {
  return {
    id,
    screenId,
    parentId,
    childrenIds,
    type: "section",
    layout: { mode: "stack", direction: "column" },
    ...extra,
  };
}

function fixture(): UIDocument {
  return {
    schemaVersion: "uiforge.schema/v1",
    id: "doc.layers",
    metadata: { name: "Layers fixture" },
    revision: {
      revision: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      source: "manual",
    },
    screens: [
      {
        id: "screen.home",
        name: "Home",
        rootNodeId: "root.home",
        nodeIds: ["root.home", "header", "title", "cta"],
      },
      {
        id: "screen.settings",
        name: "Settings",
        rootNodeId: "root.settings",
        nodeIds: ["root.settings", "settings-title"],
      },
    ],
    frames: [
      {
        id: "frame.home",
        screenId: "screen.home",
        presetId: "iphone-16",
        name: "Home · iPhone 16",
        x: 80,
        y: 80,
        width: 390,
        height: 844,
        orientation: "portrait",
        presetVersion: "uiforge.frame/v1",
      },
      {
        id: "frame.settings",
        screenId: "screen.settings",
        presetId: "iphone-16",
        name: "Settings · iPhone 16",
        x: 520,
        y: 80,
        width: 390,
        height: 844,
        orientation: "portrait",
        presetVersion: "uiforge.frame/v1",
      },
    ],
    nodes: {
      "root.home": node(
        "root.home",
        "screen.home",
        null,
        ["header", "title", "cta"],
        {
          type: "screen-root",
        },
      ),
      header: node("header", "screen.home", "root.home", ["title"], {
        frameId: "frame.home",
        content: { label: "Header" },
      }),
      title: node("title", "screen.home", "header", [], {
        frameId: "frame.home",
        type: "text",
        content: { text: "Welcome" },
      }),
      cta: node("cta", "screen.home", "root.home", [], {
        frameId: "frame.home",
        type: "button",
        content: { label: "Get started" },
      }),
      "root.settings": node(
        "root.settings",
        "screen.settings",
        null,
        ["settings-title"],
        {
          type: "screen-root",
        },
      ),
      "settings-title": node(
        "settings-title",
        "screen.settings",
        "root.settings",
        [],
        {
          frameId: "frame.settings",
          type: "text",
          content: { text: "Settings" },
        },
      ),
    },
    assets: {},
  };
}

describe("semantic layers", () => {
  it("builds Screen → Frame → nested Nodes from the canonical schema", () => {
    const layers = buildLayerTree(fixture());

    expect(layers.map((layer) => layer.name)).toEqual(["Home", "Settings"]);
    expect(layers[0]?.children.map((layer) => layer.name)).toEqual([
      "Home · iPhone 16",
      "Get started",
      "Header",
    ]);

    const frame = layers[0]?.children[0];
    expect(frame?.kind).toBe("frame");
    expect(frame?.children[0]?.name).toBe("Header");
    expect(frame?.children[0]?.children[0]?.name).toBe("Welcome");
    expect(frame?.children[0]?.children[0]?.parentId).toBe("header");
  });

  it("does not leak nodes from another screen into a frame", () => {
    const document = fixture();
    document.nodes.cta!.frameId = "frame.settings";
    expect(() => buildLayerTree(document)).not.toThrow();

    const homeFrame = buildLayerTree(document)[0]?.children[0];
    expect(homeFrame?.children.map((layer) => layer.nodeId)).toEqual([
      "header",
    ]);
  });

  it("preserves ancestor context when filtering", () => {
    const filtered = filterLayers(buildLayerTree(fixture()), "welcome");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("Home");
    expect(filtered[0]?.children[0]?.name).toBe("Home · iPhone 16");
    expect(filtered[0]?.children[0]?.children[0]?.name).toBe("Header");
    expect(filtered[0]?.children[0]?.children[0]?.children[0]?.name).toBe(
      "Welcome",
    );
  });

  it("flattens the tree in visual layer order", () => {
    expect(
      flattenLayers(buildLayerTree(fixture())).map((layer) => layer.name),
    ).toEqual([
      "Home",
      "Home · iPhone 16",
      "Header",
      "Welcome",
      "Get started",
      "Settings",
      "Settings · iPhone 16",
      "Settings",
    ]);
  });
});
