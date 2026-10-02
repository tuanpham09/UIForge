import { dashboardFixture } from "@uiforge/ui-schema";
import { describe, expect, it } from "vitest";
import { buildLayerTree, filterLayers, flattenLayers } from "../layers";

describe("semantic layer tree", () => {
  it("builds layers from the canonical screen/node hierarchy", () => {
    const tree = buildLayerTree(structuredClone(dashboardFixture));
    expect(tree.length).toBeGreaterThan(0);
    expect(tree[0]?.kind).toBe("screen");
    expect(flattenLayers(tree).some((layer) => layer.kind === "node")).toBe(
      true,
    );
  });

  it("filters large trees while retaining matching ancestors", () => {
    const tree = buildLayerTree(structuredClone(dashboardFixture));
    const nodes = flattenLayers(tree);
    const target = nodes.find(
      (layer) => layer.kind === "node" && layer.name.trim(),
    );
    expect(target).toBeDefined();
    const filtered = filterLayers(tree, target?.name ?? "");
    expect(
      flattenLayers(filtered).some((layer) => layer.id === target?.id),
    ).toBe(true);
  });

  it("returns the original hierarchy for an empty query", () => {
    const tree = buildLayerTree(structuredClone(dashboardFixture));
    expect(filterLayers(tree, "")).toEqual(tree);
  });
});
