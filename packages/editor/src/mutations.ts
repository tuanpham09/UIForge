import type { UICommand } from "@uiforge/ui-schema";
import type { TLShape } from "tldraw";
import type { EditorMutationContext, UIForgeShapeMeta } from "./types.js";

const metaOf = (shape: TLShape): UIForgeShapeMeta | undefined => {
  const meta = shape.meta as Partial<UIForgeShapeMeta>;
  return meta.source === "uiforge" && typeof meta.nodeId === "string" ? meta as UIForgeShapeMeta : undefined;
};

const commandId = (suffix: string) => ["editor", suffix, Date.now()].join(".");

export function moveToCommand(context: EditorMutationContext, x: number, y: number): UICommand | null {
  const meta = metaOf(context.shape);
  if (!meta) return null;
  return {
    type: "UpdateNode",
    commandId: commandId(["move", meta.nodeId].join(".")),
    nodeId: meta.nodeId,
    patch: { editor: { ...(context.document.nodes[meta.nodeId]?.editor ?? {}), x, y } },
  };
}

export function resizeToCommand(context: EditorMutationContext, width: number, height: number): UICommand | null {
  const meta = metaOf(context.shape);
  if (!meta) return null;
  return {
    type: "UpdateNode",
    commandId: commandId(["resize", meta.nodeId].join(".")),
    nodeId: meta.nodeId,
    patch: { editor: { ...(context.document.nodes[meta.nodeId]?.editor ?? {}), width, height } },
  };
}

export function reorderToCommand(context: EditorMutationContext, toIndex: number): UICommand | null {
  const meta = metaOf(context.shape);
  return meta ? { type: "MoveNode", commandId: commandId(["reorder", meta.nodeId].join(".")), nodeId: meta.nodeId, toIndex } : null;
}

export function reparentToCommand(context: EditorMutationContext, newParentId: string, toIndex: number): UICommand | null {
  const meta = metaOf(context.shape);
  if (!meta) return null;
  return { type: "ReparentNode", commandId: commandId(["reparent", meta.nodeId].join(".")), nodeId: meta.nodeId, newParentId: newParentId as never, toIndex };
}

export function deleteToCommand(context: EditorMutationContext): UICommand | null {
  const meta = metaOf(context.shape);
  return meta ? { type: "DeleteNode", commandId: commandId(["delete", meta.nodeId].join(".")), nodeId: meta.nodeId, recursive: true } : null;
}

export function isCanonicalShape(context: EditorMutationContext): boolean {
  return metaOf(context.shape)?.documentId === context.document.id;
}
