import type { Frame, UIDocument, UINode } from "@uiforge/ui-schema";

export type LayerKind = "screen" | "frame" | "node";

export interface SemanticLayer {
  id: string;
  kind: LayerKind;
  name: string;
  nodeId?: string;
  frameId?: string;
  parentId: string | null;
  depth: number;
  visible: boolean;
  locked: boolean;
  children: SemanticLayer[];
}

function nodeName(node: UINode): string {
  return node.content?.label ?? node.content?.text ?? node.type;
}

function buildNodeLayers(
  document: UIDocument,
  nodeId: string,
  depth: number,
  visible: boolean,
  locked: boolean,
): SemanticLayer | null {
  const node = document.nodes[nodeId];
  if (!node) return null;

  const ownVisible = visible && node.editor?.visible !== false;
  const ownLocked = locked || node.editor?.locked === true;

  return {
    id: node.id,
    kind: "node",
    name: nodeName(node),
    nodeId: node.id,
    parentId: node.parentId,
    depth,
    visible: ownVisible,
    locked: ownLocked,
    children: node.childrenIds
      .map((childId) =>
        buildNodeLayers(document, childId, depth + 1, ownVisible, ownLocked),
      )
      .filter((layer): layer is SemanticLayer => layer !== null),
  };
}

function frameLayer(document: UIDocument, frame: Frame, depth: number): SemanticLayer {
  const root = document.nodes[document.screens.find((screen) => screen.id === frame.screenId)?.rootNodeId ?? ""];
  const children = root
    ? root.childrenIds
        .map((nodeId) => document.nodes[nodeId])
        .filter((node): node is UINode => Boolean(node))
        .filter((node) => node.frameId === frame.id)
        .map((node) => buildNodeLayers(document, node.id, depth + 1, true, false))
        .filter((layer): layer is SemanticLayer => layer !== null)
    : [];

  return {
    id: frame.id,
    kind: "frame",
    name: frame.name,
    frameId: frame.id,
    parentId: frame.screenId,
    depth,
    visible: true,
    locked: false,
    children,
  };
}

export function buildLayerTree(document: UIDocument): SemanticLayer[] {
  return document.screens.map((screen) => {
    const frames = (document.frames ?? [])
      .filter((frame) => frame.screenId === screen.id)
      .map((frame) => frameLayer(document, frame, 1));

    const frameNodeIds = new Set(
      frames.flatMap((frame) => frame.children.map((child) => child.nodeId).filter(Boolean)),
    );

    const root = document.nodes[screen.rootNodeId];
    const unframed = root
      ? root.childrenIds
          .filter((nodeId) => !frameNodeIds.has(nodeId))
          .map((nodeId) => buildNodeLayers(document, nodeId, 1, true, false))
          .filter((layer): layer is SemanticLayer => layer !== null)
      : [];

    return {
      id: screen.id,
      kind: "screen",
      name: screen.name,
      parentId: null,
      depth: 0,
      visible: true,
      locked: false,
      children: [...frames, ...unframed],
    };
  });
}

export function flattenLayers(layers: SemanticLayer[]): SemanticLayer[] {
  return layers.flatMap((layer) => [layer, ...flattenLayers(layer.children)]);
}

export function filterLayers(
  layers: SemanticLayer[],
  query: string,
): SemanticLayer[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return layers;

  const visit = (layer: SemanticLayer): SemanticLayer | null => {
    const children = layer.children
      .map(visit)
      .filter((child): child is SemanticLayer => child !== null);
    if (layer.name.toLowerCase().includes(needle) || children.length > 0) {
      return { ...layer, children };
    }
    return null;
  };

  return layers
    .map(visit)
    .filter((layer): layer is SemanticLayer => layer !== null);
}
