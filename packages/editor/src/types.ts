import type { Editor, TLShape, TLShapeId } from "tldraw";
import type { UICommand, UIDocument, UINode } from "@uiforge/ui-schema";

export const EDITOR_PROJECTION_VERSION = "uiforge.editor/v1" as const;

export interface UIForgeShapeMeta {
  source: "uiforge";
  projectionVersion: typeof EDITOR_PROJECTION_VERSION;
  documentId: string;
  screenId: string;
  nodeId: string;
  semanticType: UINode["type"];
}

export interface ProjectedShape {
  id: TLShapeId;
  type: "geo";
  x: number;
  y: number;
  props: { w: number; h: number; geo: "rectangle"; richText: unknown };
  meta: UIForgeShapeMeta;
}

export interface ProjectedFlow {
  id: TLShapeId;
  sourceNodeId: string;
  destinationScreenId: string;
  trigger?: string;
  action?: string;
  label: string;
}

export interface EditorProjection {
  documentId: string;
  shapes: ProjectedShape[];
  flows: ProjectedFlow[];
}

export interface EditorMutationContext {
  document: UIDocument;
  shape: TLShape;
}

export interface EditorLike {
  createShape(shape: unknown): void;
  updateShape(shape: unknown): void;
  deleteShape(id: TLShapeId): void;
  getShape(id: TLShapeId): TLShape | undefined;
  getCurrentPageShapes(): readonly TLShape[];
  undo(): void;
  redo(): void;
}

export type TldrawEditor = Editor;
export type CanonicalCommand = UICommand;
