import type { UIDocument } from "@uiforge/ui-schema";
import type { TLShape } from "tldraw";
import { projectDocument } from "./projection";
import type { EditorLike, UIForgeShapeMeta } from "./types";

function isUIForgeShape(
  shape: TLShape,
): shape is TLShape & { meta: UIForgeShapeMeta } {
  const meta = shape.meta as Partial<UIForgeShapeMeta>;
  return meta.source === "uiforge" && typeof meta.nodeId === "string";
}

export function reconcileEditor(
  editor: EditorLike,
  document: UIDocument,
): void {
  const projection = projectDocument(document);
  const desired = new Map(projection.shapes.map((shape) => [shape.id, shape]));
  const current = editor.getCurrentPageShapes();

  for (const shape of current) {
    if (isUIForgeShape(shape) && !desired.has(shape.id))
      editor.deleteShape(shape.id);
  }

  for (const shape of projection.shapes) {
    const existing = editor.getShape(shape.id);
    if (!existing) {
      editor.createShape(shape);
      continue;
    }
    editor.updateShape({
      id: shape.id,
      type: existing.type,
      x: shape.x,
      y: shape.y,
      props: shape.props,
      meta: shape.meta,
    });
  }
}

export function canonicalShapeCount(editor: EditorLike): number {
  return editor.getCurrentPageShapes().filter(isUIForgeShape).length;
}
