// biome-ignore-all format: inspector contracts are intentionally compact
import {
  type DesignToken,
  defaultTokenSet,
  validateTokenReference,
} from "@uiforge/design-tokens";
import type {
  Frame,
  ResponsiveRule,
  UIDocument,
  UINode,
} from "@uiforge/ui-schema";

export type InspectorDiagnostic = {
  severity: "error" | "warning" | "ok";
  code: string;
  message: string;
};

export const TOKEN_OPTIONS: DesignToken[] = [
  ...Object.values(defaultTokenSet.semantic),
  ...Object.values(defaultTokenSet.primitives),
];

export const BREAKPOINTS = ["mobile", "tablet", "desktop", "wide"] as const;

export function nodeLabel(node: UINode): string {
  return node.content?.label ?? node.content?.text ?? node.type;
}

export function selectedObject(
  document: UIDocument,
  nodeId: string | null,
  frameId: string | null,
): { kind: "node"; value: UINode } | { kind: "frame"; value: Frame } | null {
  if (nodeId) {
    const node = document.nodes[nodeId];
    return node ? { kind: "node", value: node } : null;
  }
  if (frameId) {
    const frame = document.frames?.find((item) => item.id === frameId);
    return frame ? { kind: "frame", value: frame } : null;
  }
  return null;
}

function inspectTokens(node: UINode): InspectorDiagnostic[] {
  const diagnostics: InspectorDiagnostic[] = [];
  for (const [slot, token] of Object.entries(node.style?.tokens ?? {})) {
    const issues = validateTokenReference(token, defaultTokenSet);
    for (const issue of issues) {
      diagnostics.push({
        severity: "error",
        code: issue.code,
        message: `${slot}: ${issue.message}`,
      });
    }
  }
  return diagnostics;
}

function inspectResponsive(node: UINode): InspectorDiagnostic[] {
  const diagnostics: InspectorDiagnostic[] = [];
  const seen = new Set<string>();
  for (const rule of node.responsive ?? []) {
    if (seen.has(rule.breakpoint)) {
      diagnostics.push({
        severity: "error",
        code: "DUPLICATE_BREAKPOINT",
        message: `Responsive rule ${rule.breakpoint} is duplicated.`,
      });
    }
    seen.add(rule.breakpoint);
    if (
      rule.minWidth !== undefined &&
      rule.maxWidth !== undefined &&
      rule.minWidth > rule.maxWidth
    ) {
      diagnostics.push({
        severity: "error",
        code: "INVALID_RANGE",
        message: `${rule.breakpoint}: minimum width cannot exceed maximum width.`,
      });
    }
  }
  return diagnostics;
}

export function inspectNode(node: UINode): InspectorDiagnostic[] {
  const diagnostics: InspectorDiagnostic[] = [];
  if ((node.editor?.width ?? 1) <= 0) {
    diagnostics.push({
      severity: "error",
      code: "INVALID_WIDTH",
      message: "Width must be greater than 0.",
    });
  }
  if ((node.editor?.height ?? 1) <= 0) {
    diagnostics.push({
      severity: "error",
      code: "INVALID_HEIGHT",
      message: "Height must be greater than 0.",
    });
  }
  diagnostics.push(...inspectTokens(node), ...inspectResponsive(node));
  if (node.component && !node.component.registryId) {
    diagnostics.push({
      severity: "error",
      code: "MISSING_COMPONENT",
      message: "Component instance has no registry ID.",
    });
  }
  return diagnostics.length
    ? diagnostics
    : [{ severity: "ok", code: "OK", message: "No issues" }];
}

export function inspectFrame(frame: Frame): InspectorDiagnostic[] {
  const diagnostics: InspectorDiagnostic[] = [];
  if (frame.width <= 0 || frame.height <= 0) {
    diagnostics.push({
      severity: "error",
      code: "INVALID_FRAME_SIZE",
      message: "Frame width and height must be greater than 0.",
    });
  }
  return diagnostics.length
    ? diagnostics
    : [{ severity: "ok", code: "OK", message: "No issues" }];
}

export function findResponsiveRule(
  node: UINode,
  breakpoint: string,
): ResponsiveRule | undefined {
  return node.responsive?.find((rule) => rule.breakpoint === breakpoint);
}

export function commonTokenSlots(nodes: UINode[]): string[] {
  if (!nodes.length) return [];
  const first = Object.keys(nodes[0]?.style?.tokens ?? {});
  return first.filter((slot) =>
    nodes.every((node) => Object.hasOwn(node.style?.tokens ?? {}, slot)),
  );
}
