import { describe, expect, it } from "vitest";
import {
  commonTokenSlots,
  findResponsiveRule,
  inspectFrame,
  inspectNode,
} from "./inspector-model";
import { dashboardFixture } from "@uiforge/ui-schema";

describe("semantic inspector model", () => {
  it("reports valid frame diagnostics", () => {
    const frame = dashboardFixture.frames?.[0];
    expect(frame).toBeDefined();
    expect(inspectFrame(frame!)).toEqual([
      { severity: "ok", code: "OK", message: "No issues" },
    ]);
  });

  it("rejects invalid dimensions and unknown tokens", () => {
    const source = dashboardFixture.nodes["dashboard.cta"];
    expect(source).toBeDefined();
    const node = structuredClone(source!);
    node.editor = { ...node.editor, width: 0 };
    node.style = { tokens: { fill: "color.does-not-exist" } };
    const diagnostics = inspectNode(node);
    expect(diagnostics.some((item) => item.code === "INVALID_WIDTH")).toBe(true);
    expect(diagnostics.some((item) => item.code === "UNKNOWN_TOKEN")).toBe(true);
  });

  it("detects duplicate responsive breakpoints", () => {
    const source = dashboardFixture.nodes["dashboard.cta"];
    expect(source).toBeDefined();
    const node = structuredClone(source!);
    node.responsive = [
      { breakpoint: "md", minWidth: 768 },
      { breakpoint: "md", minWidth: 900 },
    ];
    expect(inspectNode(node).some((item) => item.code === "DUPLICATE_BREAKPOINT")).toBe(true);
    expect(findResponsiveRule(node, "md")?.minWidth).toBe(768);
  });

  it("finds token slots common to multiple nodes", () => {
    const nodes = Object.values(dashboardFixture.nodes).filter((node) => node.type !== "screen-root").slice(0, 2);
    nodes[0].style = { tokens: { fill: "color.surface", radius: "radius.md" } };
    nodes[1].style = { tokens: { fill: "color.surface", shadow: "shadow.subtle" } };
    expect(commonTokenSlots(nodes)).toEqual(["fill"]);
  });
});
