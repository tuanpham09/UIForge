import {
  applyCommand,
  createFrameFromPreset,
  dashboardFixture,
  FRAME_PRESET_REGISTRY_VERSION,
  FRAME_PRESETS,
  getFramePreset,
  type UIDocument,
} from "./index";
import { describe, expect, it } from "vitest";

describe("frame preset registry", () => {
  it("contains every required device group", () => {
    for (const id of [
      "iphone-12",
      "iphone-13",
      "iphone-14",
      "iphone-15",
      "iphone-16",
      "iphone-17",
      "iphone-18",
      "ipad-portrait",
      "ipad-landscape",
      "android-phone",
      "android-tablet",
      "desktop-1280",
      "desktop-1440",
      "desktop-1920",
    ]) {
      expect(getFramePreset(id)?.version).toBe(FRAME_PRESET_REGISTRY_VERSION);
    }
  });

  it("creates a semantic frame without hard-coded canvas state", () => {
    const frame = createFrameFromPreset(
      "frame.demo" as never,
      "screen.dashboard",
      "iphone-13",
      120,
      240,
    );

    expect(frame).toMatchObject({
      presetId: "iphone-13",
      width: 390,
      height: 844,
      x: 120,
      y: 240,
      presetVersion: FRAME_PRESET_REGISTRY_VERSION,
    });
  });

  it("does not duplicate preset ids", () => {
    expect(new Set(FRAME_PRESETS.map((item) => item.id)).size).toBe(
      FRAME_PRESETS.length,
    );
  });
});

describe("issue #44 semantic canvas commands", () => {
  it("creates, moves/resizes and deletes a frame canonically", () => {
    const frame = createFrameFromPreset(
      "frame.test" as never,
      "screen.dashboard",
      "iphone-13",
      100,
      120,
    );

    let document: UIDocument = applyCommand(dashboardFixture, {
      type: "CreateFrame",
      commandId: "test.create-frame",
      frame,
    });

    expect(document.frames?.find((item) => item.id === frame.id)).toMatchObject(
      {
        width: 390,
        height: 844,
        x: 100,
        y: 120,
      },
    );

    document = applyCommand(document, {
      type: "UpdateFrame",
      commandId: "test.update-frame",
      frameId: frame.id,
      patch: { x: 240, y: 300, width: 420, height: 860 },
    });

    expect(document.frames?.find((item) => item.id === frame.id)).toMatchObject(
      {
        x: 240,
        y: 300,
        width: 420,
        height: 860,
      },
    );

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
    if (!root) throw new Error("dashboard root fixture is missing");

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
