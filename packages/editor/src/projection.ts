import type { UIDocument, UINode } from "@uiforge/ui-schema";
import { createShapeId } from "tldraw";
import type { EditorProjection, ProjectedShape } from "./types";
import { EDITOR_PROJECTION_VERSION } from "./types";

const DEFAULT_WIDTH = 240;
const DEFAULT_HEIGHT = 96;

function nodeLabel(node: UINode): string {
  return node.content?.label ?? node.content?.text ?? node.type;
}

function dimensions(node: UINode): { width: number; height: number } {
  return {
    width:
      node.editor?.width && node.editor.width > 0
        ? node.editor.width
        : DEFAULT_WIDTH,
    height:
      node.editor?.height && node.editor.height > 0
        ? node.editor.height
        : DEFAULT_HEIGHT,
  };
}

function position(node: UINode, index: number): { x: number; y: number } {
  return {
    x: node.editor?.x ?? 80 + (index % 3) * 320,
    y: node.editor?.y ?? 80 + Math.floor(index / 3) * 160,
  };
}

export function projectNode(
  document: UIDocument,
  node: UINode,
  index = 0,
): ProjectedShape {
  const size = dimensions(node);
  const point = position(node, index);
  return {
    id: createShapeId(node.id),
    type: "geo",
    x: point.x,
    y: point.y,
    props: {
      w: size.width,
      h: size.height,
      geo: "rectangle",
    },
    label: nodeLabel(node),
    meta: {
      source: "uiforge",
      projectionVersion: EDITOR_PROJECTION_VERSION,
      documentId: document.id,
      screenId: node.screenId,
      nodeId: node.id,
      semanticType: node.type,
    },
  };
}

export function projectDocument(document: UIDocument): EditorProjection {
  const nodes = Object.values(document.nodes);
  const frameShapes: ProjectedShape[] = (document.frames ?? []).map(
    (frame) => ({
    id: createShapeId(frame.id),
    type: "geo",
    x: frame.x,
    y: frame.y,
    props: {
      w: frame.width,
      h: frame.height,
      geo: "rectangle",
    },
    label: `${frame.name} · ${frame.width} × ${frame.height}`,
    meta: {
      source: "uiforge",
      projectionVersion: EDITOR_PROJECTION_VERSION,
      documentId: document.id,
      screenId: frame.screenId,
      nodeId: frame.id,
      semanticType: "frame",
    },
  }));
  const shapes = [
    ...frameShapes,
    ...nodes.map((node, index) => projectNode(document, node, index)),
  ];
  const flows = nodes
    .filter((node) => node.interaction?.targetScreenId)
    .map((node) => ({
      id: createShapeId(["flow", node.id].join(":")),
      sourceNodeId: node.id,
      destinationScreenId: node.interaction?.targetScreenId as string,
      trigger: node.interaction?.trigger,
      action: node.interaction?.action,
      label: [node.interaction?.trigger, node.interaction?.action]
        .filter(Boolean)
        .join(" → "),
    }));
  return { documentId: document.id, shapes, flows };
}

export function semanticShapeId(nodeId: string) {
  return createShapeId(nodeId);
}
