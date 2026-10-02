import { workspaceFixture } from "@uiforge/ui-schema";
import { describe, expect, it } from "vitest";
import {
  createPenpotCanvasSpike,
  hitTest,
  moveSelected,
  resizeSelected,
  selectAt,
  snapPosition,
  zoomAt,
} from "./penpot-canvas-spike";

describe("Penpot canvas spike", () => {
  it("projects UIForge Schema without changing the canonical document", () => {
    const before = JSON.stringify(workspaceFixture);
    const spike = createPenpotCanvasSpike(workspaceFixture);

    expect(spike.documentId).toBe("fixture-workspace");
    expect(spike.rects.length).toBeGreaterThan(0);
    expect(JSON.stringify(workspaceFixture)).toBe(before);
  });

  it("performs geometric hit testing", () => {
    const rects = [{ id: "a", x: 10, y: 20, width: 100, height: 50 }];
    expect(hitTest(rects, { x: 30, y: 30 })?.id).toBe("a");
    expect(hitTest(rects, { x: 500, y: 500 })).toBeNull();
  });

  it("selects, moves and resizes a semantic canvas object", () => {
    let spike = createPenpotCanvasSpike(workspaceFixture);
    const first = spike.rects[0];

    spike = selectAt(spike, { x: first.x + 2, y: first.y + 2 });
    expect(spike.selection.id).toBe(first.id);

    spike = moveSelected(spike, { x: 20, y: 10 });
    expect(spike.rects[0].x).toBe(first.x + 20);

    spike = resizeSelected(spike, { width: 300, height: 140 });
    expect(spike.selection.bounds?.width).toBe(300);
    expect(spike.selection.bounds?.height).toBe(140);
  });

  it("keeps zoom anchored to the same canvas point", () => {
    const spike = createPenpotCanvasSpike(workspaceFixture);
    const zoomed = zoomAt(spike, { x: 200, y: 160 }, 2);
    const point = {
      x: (200 - zoomed.transform.offsetX) / zoomed.transform.zoom,
      y: (160 - zoomed.transform.offsetY) / zoomed.transform.zoom,
    };

    expect(point.x).toBeCloseTo(200);
    expect(point.y).toBeCloseTo(160);
  });

  it("finds nearby edge/center snap candidates", () => {
    const moving = { id: "moving", x: 96, y: 100, width: 100, height: 50 };
    const target = { id: "target", x: 200, y: 100, width: 100, height: 50 };
    const snapped = snapPosition(moving, [target], 6);

    expect(snapped.x).toBe(100);
    expect(snapped.y).toBe(100);
  });
});
