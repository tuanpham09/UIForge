import type { UIDocument } from "@uiforge/ui-schema";
import type { RendererDiagnostic } from "./types";

export function validateRendererGraph(
  document: UIDocument,
): RendererDiagnostic[] {
  const diagnostics: RendererDiagnostic[] = [];

  for (const screen of document.screens) {
    if (!document.nodes[screen.rootNodeId]) {
      diagnostics.push({
        code: "INVALID_PARENT",
        severity: "error",
        screenId: screen.id,
        message: `Screen root ${screen.rootNodeId} is missing`,
      });
    }

    for (const nodeId of screen.nodeIds) {
      const node = document.nodes[nodeId];
      if (!node) continue;

      if (node.parentId && !document.nodes[node.parentId]) {
        diagnostics.push({
          code: "INVALID_PARENT",
          severity: "error",
          nodeId,
          screenId: screen.id,
          message: `Parent ${node.parentId} is missing`,
        });
      }

      for (const childId of node.childrenIds) {
        const child = document.nodes[childId];
        if (!child) {
          diagnostics.push({
            code: "INVALID_CHILD",
            severity: "error",
            nodeId,
            screenId: screen.id,
            message: `Child ${childId} is missing`,
          });
        } else if (child.parentId !== node.id) {
          diagnostics.push({
            code: "INVALID_CHILD",
            severity: "error",
            nodeId,
            screenId: screen.id,
            message: `Child ${childId} does not point back to parent ${node.id}`,
          });
        }
      }

      const targetScreenId = node.interaction?.targetScreenId;
      if (
        targetScreenId &&
        !document.screens.some((target) => target.id === targetScreenId)
      ) {
        diagnostics.push({
          code: "INVALID_TRANSITION",
          severity: "warning",
          nodeId,
          screenId: screen.id,
          message: `Transition target ${targetScreenId} is missing`,
        });
      }
    }
  }

  return diagnostics;
}
