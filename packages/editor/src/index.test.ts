import { applyCommand, dashboardFixture } from "@uiforge/ui-schema";
import { describe, expect, it } from "vitest";
import {
  assertCanonicalPersistencePayload,
  CommandHistory,
  deleteToCommand,
  moveToCommand,
  projectDocument,
  projectNode,
  reconcileEditor,
  resizeToCommand,
  serializeCanonical,
} from "./index.js";

describe("editor projection", () => {
  it("maps every schema node to a stable semantic shape", () => {
    const projection = projectDocument(dashboardFixture);
    expect(projection.shapes).toHaveLength(Object.keys(dashboardFixture.nodes).length);
    expect(new Set(projection.shapes.map((item) => item.id)).size).toBe(projection.shapes.length);
    expect(projection.shapes.find((item) => item.meta.nodeId === "dashboard.cta")?.meta.semanticType).toBe("button");
  });

  it("projects interaction metadata into a reusable flow seam", () => {
    const flow = projectDocument(dashboardFixture).flows.find((item) => item.sourceNodeId === "dashboard.cta");
    expect(flow).toMatchObject({ destinationScreenId: "screen.mobile-list", trigger: "click", action: "navigate" });
  });

  it("turns editor mutations into canonical commands", () => {
    const projected = projectDocument(dashboardFixture).shapes.find((item) => item.meta.nodeId === "dashboard.cta");
    if (!projected) throw new Error("dashboard CTA was not projected");
    const context = { document: dashboardFixture, shape: projected } as never;
    expect(moveToCommand(context, 120, 140)?.type).toBe("UpdateNode");
    expect(resizeToCommand(context, 320, 160)?.type).toBe("UpdateNode");
    expect(deleteToCommand(context)?.type).toBe("DeleteNode");
  });

  it("reconciles canonical state without serializing editor records", () => {
    const created: unknown[] = [];
    const updated: unknown[] = [];
    const deleted: string[] = [];
    const editor = {
      createShape: (value: unknown) => created.push(value),
      updateShape: (value: unknown) => updated.push(value),
      deleteShape: (id: string) => deleted.push(id),
      getShape: () => undefined,
      getCurrentPageShapes: () => [],
      undo: () => undefined,
      redo: () => undefined,
    };
    reconcileEditor(editor, dashboardFixture);
    expect(created).toHaveLength(Object.keys(dashboardFixture.nodes).length);
    expect(updated).toHaveLength(0);
    expect(deleted).toHaveLength(0);
    expect(assertCanonicalPersistencePayload(dashboardFixture)).toBe(serializeCanonical(dashboardFixture));
  });

  it("undo and redo canonical commands", () => {
    const history = new CommandHistory(dashboardFixture);
    const before = history.document.revision.revision;
    const command = {
      type: "UpdateNode",
      commandId: "test.editor",
      nodeId: "dashboard.cta",
      patch: { editor: { x: 400, y: 200 } },
    } as const;
    history.apply(command);
    expect(history.document.nodes["dashboard.cta"]?.editor).toMatchObject({ x: 400, y: 200 });
    history.undo();
    expect(history.document.revision.revision).toBe(before);
    history.redo();
    expect(history.document.nodes["dashboard.cta"]?.editor).toMatchObject({ x: 400, y: 200 });
  });

  it("replayed commands reproduce canonical state", () => {
    const command = {
      type: "UpdateNode",
      commandId: "test.replay",
      nodeId: "dashboard.cta",
      patch: { editor: { x: 10, y: 20 } },
    } as const;
    const first = applyCommand(dashboardFixture, command);
    const second = applyCommand(dashboardFixture, structuredClone(command));
    expect(serializeCanonical(first)).toBe(serializeCanonical(second));
  });

  it("projects explicit editor bounds exactly", () => {
    const baseNode = dashboardFixture.nodes["dashboard.cta"];
    if (!baseNode) throw new Error("dashboard CTA fixture missing");
    const node = { ...baseNode, editor: { x: 7, y: 9, width: 300, height: 120 } };
    const projected = projectNode(dashboardFixture, node);
    expect(projected).toMatchObject({ x: 7, y: 9, props: { w: 300, h: 120 } });
  });
});
