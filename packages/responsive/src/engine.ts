import type { ResponsiveRule, UIDocument, UINode } from "@uiforge/ui-schema";
import type {
  Breakpoint,
  ResolvedResponsiveNode,
  ResponsiveDiagnostic,
  ResponsiveProjection,
  ResponsiveRuleV1,
  Viewport,
  ViewportPreset,
} from "./types";
import { BREAKPOINTS, RESPONSIVE_VERSION, VIEWPORTS } from "./types";

export interface ResponsiveGraphAdapter {
  transitions: readonly Array<{
    fromScreenId: string;
    toScreenId: string;
  }>;
}

export { BREAKPOINTS, VIEWPORTS };

export function getViewport(preset: ViewportPreset): Viewport {
  return VIEWPORTS[preset];
}

export function resolveBreakpoint(viewport: Viewport): Breakpoint {
  const match = BREAKPOINTS.find(
    (item) =>
      (item.minWidth === undefined || viewport.width >= item.minWidth) &&
      (item.maxWidth === undefined || viewport.width <= item.maxWidth),
  );
  if (!match) {
    throw new Error(
      `No responsive breakpoint matches viewport width ${viewport.width}`,
    );
  }
  return match;
}

function normalizeRule(
  rule: ResponsiveRule,
  index: number,
): ResponsiveRuleV1 & { id: string } {
  return {
    ...rule,
    id: `${rule.breakpoint}:${index}`,
    breakpoint: rule.breakpoint as ViewportPreset,
  };
}

function validateRule(
  node: UINode,
  rule: ResponsiveRuleV1 & { id: string },
  diagnostics: ResponsiveDiagnostic[],
): void {
  const breakpoint = BREAKPOINTS.find((item) => item.id === rule.breakpoint);
  if (!breakpoint) {
    diagnostics.push({
      code: "INVALID_BREAKPOINT",
      severity: "error",
      nodeId: node.id,
      screenId: node.screenId,
      breakpoint: rule.breakpoint,
      message: `Unknown responsive breakpoint ${rule.breakpoint}`,
    });
    return;
  }

  const min = rule.minWidth ?? breakpoint.minWidth;
  const max = rule.maxWidth ?? breakpoint.maxWidth;
  if (min !== undefined && max !== undefined && min > max) {
    diagnostics.push({
      code: "INVALID_RANGE",
      severity: "error",
      nodeId: node.id,
      screenId: node.screenId,
      breakpoint: rule.breakpoint,
      message: "Responsive rule minWidth cannot exceed maxWidth",
    });
  }
}

function matchesRule(rule: ResponsiveRuleV1, viewport: Viewport): boolean {
  const breakpoint = BREAKPOINTS.find((item) => item.id === rule.breakpoint);
  if (!breakpoint) return false;
  const min = rule.minWidth ?? breakpoint.minWidth;
  const max = rule.maxWidth ?? breakpoint.maxWidth;
  return (
    (min === undefined || viewport.width >= min) &&
    (max === undefined || viewport.width <= max)
  );
}

function graphTargets(graph: ResponsiveGraphAdapter | undefined): Set<string> {
  return new Set(
    graph?.transitions.flatMap((transition) => [
      transition.fromScreenId,
      transition.toScreenId,
    ]) ?? [],
  );
}

function resolveNode(
  node: UINode,
  viewport: Viewport,
  graph: ResponsiveGraphAdapter | undefined,
  diagnostics: ResponsiveDiagnostic[],
): ResolvedResponsiveNode {
  const sourceRules = node.responsive ?? [];
  const rules = sourceRules
    .map(normalizeRule)
    .filter((rule) => matchesRule(rule, viewport))
    .sort((a, b) => {
      const left =
        BREAKPOINTS.find((item) => item.id === a.breakpoint)?.order ?? -1;
      const right =
        BREAKPOINTS.find((item) => item.id === b.breakpoint)?.order ?? -1;
      return left - right || a.id.localeCompare(b.id);
    });

  sourceRules.forEach((rule, index) => {
    validateRule(node, normalizeRule(rule, index), diagnostics);
  });

  const targetScreens = graphTargets(graph);
  const resolved: ResolvedResponsiveNode = {
    nodeId: node.id,
    visible: true,
    tokenOverrides: {},
    appliedRuleIds: [],
  };

  for (const rule of rules) {
    resolved.visible = rule.hidden ?? resolved.visible;
    resolved.layout = { ...(resolved.layout ?? {}), ...(rule.layout ?? {}) };
    resolved.variant = rule.variant ?? resolved.variant;
    resolved.tokenOverrides = {
      ...resolved.tokenOverrides,
      ...(rule.tokenOverrides ?? {}),
    };
    resolved.container = rule.container ?? resolved.container;
    resolved.typography = rule.typography ?? resolved.typography;
    resolved.interaction = rule.interaction ?? resolved.interaction;
    resolved.appliedRuleIds.push(rule.id);

    if (
      rule.interaction?.targetScreenId &&
      !targetScreens.has(rule.interaction.targetScreenId)
    ) {
      diagnostics.push({
        code: "INVALID_NAVIGATION_TARGET",
        severity: "error",
        nodeId: node.id,
        screenId: node.screenId,
        breakpoint: rule.breakpoint,
        message: `Responsive navigation target ${rule.interaction.targetScreenId} is not present in the Experience Graph`,
      });
    }
  }

  return resolved;
}

export function resolveResponsive(
  document: UIDocument,
  viewport: Viewport,
  graph?: ResponsiveGraphAdapter,
): ResponsiveProjection {
  const diagnostics: ResponsiveDiagnostic[] = [];
  const nodes: Record<string, ResolvedResponsiveNode> = {};

  for (const node of Object.values(document.nodes).sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    nodes[node.id] = resolveNode(node, viewport, graph, diagnostics);
  }

  diagnostics.sort((a, b) =>
    [a.nodeId ?? "", a.breakpoint ?? "", a.code, a.message]
      .join(":")
      .localeCompare(
        [b.nodeId ?? "", b.breakpoint ?? "", b.code, b.message].join(":"),
      ),
  );

  return {
    version: RESPONSIVE_VERSION,
    viewport,
    nodes,
    diagnostics,
  };
}
