import type { UIDocument } from "@uiforge/ui-schema";

/**
 * Issue #62 spike.
 *
 * This is intentionally a small TypeScript adapter inspired by Penpot's
 * geometry + worker selection/snapping architecture. It does not import
 * Penpot runtime code and does not replace the production tldraw canvas.
 *
 * UIForge Schema remains the source of truth.
 */

export type CanvasRect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CanvasPoint = { x: number; y: number };

export type CanvasTransform = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type CanvasSelection = {
  id: string | null;
  bounds: CanvasRect | null;
};

export type CanvasSpike = {
  documentId: string;
  rects: CanvasRect[];
  transform: CanvasTransform;
  selection: CanvasSelection;
};

const DEFAULT_SIZE = { width: 240, height: 96 };

function nodeRect(node: UIDocument["nodes"][string], index: number): CanvasRect {
  return {
    id: String(node.id),
    x: node.editor?.x ?? 80 + (index % 3) * 320,
    y: node.editor?.y ?? 80 + Math.floor(index / 3) * 160,
    width: node.editor?.width && node.editor.width > 0 ? node.editor.width : DEFAULT_SIZE.width,
    height: node.editor?.height && node.editor.height > 0 ? node.editor.height : DEFAULT_SIZE.height,
  };
}

/** UIForge Schema -> canvas projection boundary. */
export function createPenpotCanvasSpike(document: UIDocument): CanvasSpike {
  return {
    documentId: String(document.id),
    rects: Object.values(document.nodes).map(nodeRect),
    transform: { zoom: 1, offsetX: 0, offsetY: 0 },
    selection: { id: null, bounds: null },
  };
}

export function screenToCanvas(
  point: CanvasPoint,
  transform: CanvasTransform,
): CanvasPoint {
  return {
    x: (point.x - transform.offsetX) / transform.zoom,
    y: (point.y - transform.offsetY) / transform.zoom,
  };
}

/**
 * Geometry-based hit test. Penpot uses a geometric selection index in a
 * worker; this spike keeps the same responsibility boundary in a tiny form.
 */
export function hitTest(
  rects: CanvasRect[],
  point: CanvasPoint,
): CanvasRect | null {
  for (let index = rects.length - 1; index >= 0; index -= 1) {
    const rect = rects[index];
    if (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    ) {
      return rect;
    }
  }
  return null;
}

export function selectAt(
  spike: CanvasSpike,
  screenPoint: CanvasPoint,
): CanvasSpike {
  const canvasPoint = screenToCanvas(screenPoint, spike.transform);
  const selected = hitTest(spike.rects, canvasPoint);
  return {
    ...spike,
    selection: {
      id: selected?.id ?? null,
      bounds: selected ? { ...selected } : null,
    },
  };
}

export function moveSelected(
  spike: CanvasSpike,
  delta: CanvasPoint,
): CanvasSpike {
  const selectedId = spike.selection.id;
  if (!selectedId) return spike;

  return {
    ...spike,
    rects: spike.rects.map((rect) =>
      rect.id === selectedId
        ? { ...rect, x: rect.x + delta.x, y: rect.y + delta.y }
        : rect,
    ),
    selection: spike.selection.bounds
      ? {
          id: selectedId,
          bounds: {
            ...spike.selection.bounds,
            x: spike.selection.bounds.x + delta.x,
            y: spike.selection.bounds.y + delta.y,
          },
        }
      : spike.selection,
  };
}

export function resizeSelected(
  spike: CanvasSpike,
  size: { width: number; height: number },
): CanvasSpike {
  const selectedId = spike.selection.id;
  if (!selectedId) return spike;

  const width = Math.max(1, size.width);
  const height = Math.max(1, size.height);

  return {
    ...spike,
    rects: spike.rects.map((rect) =>
      rect.id === selectedId ? { ...rect, width, height } : rect,
    ),
    selection: spike.selection.bounds
      ? { id: selectedId, bounds: { ...spike.selection.bounds, width, height } }
      : spike.selection,
  };
}

export function zoomAt(
  spike: CanvasSpike,
  screenPoint: CanvasPoint,
  nextZoom: number,
): CanvasSpike {
  const zoom = Math.max(0.1, Math.min(8, nextZoom));
  const before = screenToCanvas(screenPoint, spike.transform);
  const nextOffsetX = screenPoint.x - before.x * zoom;
  const nextOffsetY = screenPoint.y - before.y * zoom;

  return {
    ...spike,
    transform: { zoom, offsetX: nextOffsetX, offsetY: nextOffsetY },
  };
}

/** Simple edge/center snap primitive for the spike. */
export function snapPosition(
  moving: CanvasRect,
  others: CanvasRect[],
  threshold = 6,
): CanvasPoint {
  let x = moving.x;
  let y = moving.y;

  const movingEdgesX = [moving.x, moving.x + moving.width / 2, moving.x + moving.width];
  const movingEdgesY = [moving.y, moving.y + moving.height / 2, moving.y + moving.height];

  for (const other of others) {
    const targetX = [other.x, other.x + other.width / 2, other.x + other.width];
    const targetY = [other.y, other.y + other.height / 2, other.y + other.height];

    const xMatch = movingEdgesX
      .map((candidate, index) => ({ delta: targetX[index] - candidate, abs: Math.abs(targetX[index] - candidate) }))
      .sort((a, b) => a.abs - b.abs)[0];
    const yMatch = movingEdgesY
      .map((candidate, index) => ({ delta: targetY[index] - candidate, abs: Math.abs(targetY[index] - candidate) }))
      .sort((a, b) => a.abs - b.abs)[0];

    if (xMatch && xMatch.abs <= threshold) x += xMatch.delta;
    if (yMatch && yMatch.abs <= threshold) y += yMatch.delta;
  }

  return { x, y };
}

export function describePenpotBoundary(): string[] {
  return [
    "geometry: CanvasRect + transform",
    "selection: geometric hit-test",
    "snapping: edge/center candidate matching",
    "viewport: zoomAt + screen/canvas transform",
    "canonical model: UIForge Schema",
    "production renderer: unchanged",
  ];
}
