import type { UIDocument, UINode } from "@uiforge/ui-schema";
import { createShapeId } from "tldraw";
import type {
  EditorProjection,
  ProjectedGeoShape,
  ProjectedShape,
  ProjectedTextShape,
} from "./types";
import { EDITOR_PROJECTION_VERSION } from "./types";

const DEFAULT_WIDTH = 240;
const DEFAULT_HEIGHT = 96;

type GeoProps = ProjectedGeoShape["props"];

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

function nodeLabel(node: UINode): string {
  return (
    node.content?.label ??
    node.content?.text ??
    node.content?.placeholder ??
    node.content?.alt ??
    node.type
  );
}

function visualGeoStyle(document: UIDocument, node: UINode): GeoProps {
  const { width, height } = dimensions(node);
  const base = {
    w: width,
    h: height,
    geo: "rectangle" as const,
  };

  if ((document.metadata.designStage ?? "wireframe") === "wireframe") {
    return {
      ...base,
      fill: "none",
      color: "grey",
      labelColor: "grey",
      size: "s",
      font: "sans",
      dash: "dashed",
      align: "middle",
      verticalAlign: "middle",
    };
  }

  switch (node.type) {
    case "button":
      return {
        ...base,
        fill: "solid",
        color: "blue",
        labelColor: "white",
        size: "m",
        font: "sans",
        dash: "solid",
        align: "middle",
        verticalAlign: "middle",
      };
    case "input":
      return {
        ...base,
        fill: "solid",
        color: "grey",
        labelColor: "black",
        size: "s",
        font: "sans",
        dash: "solid",
        align: "start",
        verticalAlign: "middle",
      };
    case "card":
      return {
        ...base,
        fill: "solid",
        color: "grey",
        labelColor: "black",
        size: "m",
        font: "sans",
        dash: "solid",
        align: "start",
        verticalAlign: "start",
      };
    case "image":
      return {
        ...base,
        fill: "semi",
        color: "grey",
        labelColor: "grey",
        size: "s",
        font: "sans",
        dash: "solid",
        align: "middle",
        verticalAlign: "middle",
      };
    case "section":
    case "list":
      return {
        ...base,
        fill: "none",
        color: "grey",
        labelColor: "black",
        size: "s",
        font: "sans",
        dash: "solid",
        align: "start",
        verticalAlign: "start",
      };
    default:
      return {
        ...base,
        fill: "none",
        color: "grey",
        labelColor: "black",
        size: "s",
        font: "sans",
        dash: "solid",
        align: "start",
        verticalAlign: "middle",
      };
  }
}

function textSize(node: UINode): ProjectedTextShape["props"]["size"] {
  const text = node.content?.label ?? node.content?.text ?? "";
  if (text.length > 28) return "m";
  if (/title|heading/i.test(text)) return "l";
  return "m";
}

function projectText(
  document: UIDocument,
  node: UINode,
  index: number,
): ProjectedTextShape {
  const point = position(node, index);
  const { width } = dimensions(node);
  return {
    id: createShapeId(node.id),
    type: "text",
    x: point.x,
    y: point.y,
    opacity: node.editor?.visible === false ? 0 : 1,
    isLocked: node.editor?.locked === true,
    props: {
      color:
        (document.metadata.designStage ?? "wireframe") === "visual"
          ? "black"
          : "grey",
      size: textSize(node),
      font: "sans",
      textAlign: "start",
      autoSize: false,
      w: width,
    },
    label: nodeLabel(node),
    meta: {
      source: "uiforge",
      projectionVersion: EDITOR_PROJECTION_VERSION,
      documentId: document.id,
      screenId: node.screenId,
      nodeId: node.id,
      semanticType: node.type,
      ...(node.component?.registryId
        ? { componentRegistryId: node.component.registryId }
        : {}),
      ...(node.component?.variant
        ? { componentVariant: node.component.variant }
        : {}),
    },
  };
}

export function projectNode(
  document: UIDocument,
  node: UINode,
  index = 0,
): ProjectedShape {
  if (node.type === "text") return projectText(document, node, index);

  const point = position(node, index);
  return {
    id: createShapeId(node.id),
    type: "geo",
    x: point.x,
    y: point.y,
    opacity: node.editor?.visible === false ? 0 : 1,
    isLocked: node.editor?.locked === true,
    props: visualGeoStyle(document, node),
    label: nodeLabel(node),
    meta: {
      source: "uiforge",
      projectionVersion: EDITOR_PROJECTION_VERSION,
      documentId: document.id,
      screenId: node.screenId,
      nodeId: node.id,
      semanticType: node.type,
      ...(node.component?.registryId
        ? { componentRegistryId: node.component.registryId }
        : {}),
      ...(node.component?.variant
        ? { componentVariant: node.component.variant }
        : {}),
    },
  };
}

function projectFrame(
  frame: NonNullable<UIDocument["frames"]>[number],
): ProjectedGeoShape {
  return {
    id: createShapeId(frame.id),
    type: "geo",
    x: frame.x,
    y: frame.y,
    props: {
      w: frame.width,
      h: frame.height,
      geo: "rectangle",
      fill: "none",
      color: "grey",
      labelColor: "grey",
      size: "s",
      font: "sans",
      dash: "solid",
      align: "start",
      verticalAlign: "start",
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
  };
}

export function projectDocument(document: UIDocument): EditorProjection {
  const nodes = Object.values(document.nodes);
  const frameShapes = (document.frames ?? []).map((frame) =>
    projectFrame(frame),
  );
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
