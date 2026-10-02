import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createFrameFromPreset,
  dashboardFixture,
  type UIDocument,
} from "@uiforge/ui-schema";

describe("issue #44 semantic canvas commands", () => {
  it("creates, moves/resizes and deletes a frame canonically", () => {
    const frame = createFrameFromPreset("frame.test" as never, "screen.dashboard", "iphone-13", 100, 120);
    let document: UIDocument = applyCommand(dashboardFixture, {
      type: "CreateFrame",
      commandId: "test.create-frame",
      frame,
    });
    expect(document.frames?.find((item) => item.id === frame.id)).toMatchObject({
      width: 390,
      height: 844,
      x: 100,
      y: 120,
    });

    document = applyCommand(document, {
      type: "UpdateFrame",
      commandId: "test.update-frame",
      frameId: frame.id,
      patch: { x: 240, y: 300, width: 420, height: 860 },
    });
    expect(document.frames?.find((item) => item.id === frame.id)).toMatchObject({
      x: 240,
      y: 300,
      width: 420,
      height: 860,
    });

    document = applyCommand(document, {
      type: "DeleteFrame",
      commandId: "test.delete-frame",
      frameId: frame.id,
    });
    expect(document.frames?.some((item) => item.id === frame.id)).toBe(false);
  });

  it("keeps section creation in the semantic node hierarchy", () => {
    const sectionId = "section.issue44";
    const root = dashboardFixture.nodes["screen.dashboard.root"];
    expect(root).toBeDefined();
    const section = {
      id: sectionId,
      screenId: "screen.dashboard",
      parentId: root.id,
      childrenIds: [],
      type: "section" as const,
      layout: { mode: "stack" as const, direction: "column" as const },
      content: { label: "Dashboard Content" },
    };
    const document = applyCommand(dashboardFixture, {
      type: "CreateNode",
      commandId: "test.create-section",
      node: section,
    });
    expect(document.nodes[sectionId].parentId).toBe(root.id);
    expect(document.nodes[root.id].childrenIds).toContain(sectionId);
  });
});
