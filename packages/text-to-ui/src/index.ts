// biome-ignore-all format: semantic orchestration contract is kept reviewable
// biome-ignore-all assist/source/organizeImports: domain imports are intentionally grouped
import {
  PROMPTS,
  executeWithPolicy,
  normalizeIntent,
} from "@uiforge/ai";
import {
  type ColorStrategy,
  validateColorStrategy,
} from "@uiforge/color-intelligence";
import {
  decide,
  type ComponentDecision,
  type DecisionContext,
} from "@uiforge/component-intelligence";
import { componentRegistry } from "@uiforge/component-registry";
import {
  composeStrategy,
  validateStrategy,
  type DesignStrategy,
} from "@uiforge/design-intelligence";
import {
  applyCommand,
  type UICommand,
  type UIDocument,
  type UINode,
  validateUIDocument,
} from "@uiforge/ui-schema";
import {
  defaultVisualCraftStrategy,
  lintVisualCraft,
  validateStrategy as validateVisualCraftStrategy,
  type CraftNode,
  type CraftScreen,
  type VisualCraftStrategy,
} from "@uiforge/visual-craft-quality";
import {
  EXPERIENCE_GRAPH_VERSION,
  TEXT_TO_UI_VERSION,
  type ExperienceGraph,
  type PatchPreview,
  type TextToUIProviderOutput,
  type TextToUIRequest,
  type TextToUIResult,
} from "./types";

export * from "./types";

const OUTPUT_VERSION = "uiforge.text-to-ui-output/v1" as const;

function assertColorStrategy(strategy: ColorStrategy): void {
  const issues = validateColorStrategy(strategy);
  if (issues.length) throw new Error(`COLOR_STRATEGY_INVALID:${issues.join(",")}`);
}

function assertVisualCraftStrategy(strategy: VisualCraftStrategy): void {
  const issues = validateVisualCraftStrategy(strategy);
  if (issues.length) throw new Error(`VISUAL_CRAFT_INVALID:${issues.join(",")}`);
}

function assertStrategy(strategy: DesignStrategy): void {
  const issues = validateStrategy(strategy);
  if (issues.length) throw new Error(`DESIGN_STRATEGY_INVALID:${issues.join(",")}`);
}

function validateOutputShape(value: unknown): TextToUIProviderOutput {
  if (!value || typeof value !== "object") throw new Error("SCHEMA_INVALID:text-to-ui-output");
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== OUTPUT_VERSION || !v.document || !v.experienceGraph) {
    throw new Error("SCHEMA_INVALID:text-to-ui-output");
  }
  validateUIDocument(v.document);
  validateExperienceGraph(v.experienceGraph);
  return value as TextToUIProviderOutput;
}

export function validateExperienceGraph(graph: ExperienceGraph, document?: UIDocument): void {
  if (graph.version !== EXPERIENCE_GRAPH_VERSION) throw new Error("FLOW_INVALID:version");
  const screenIds = new Set((document?.screens ?? []).map(s => s.id));
  const graphNodeIds = new Set<string>();
  for (const node of graph.nodes) {
    if (!node.id || !node.screenId) throw new Error("FLOW_INVALID:node");
    if (document && !screenIds.has(node.screenId)) throw new Error(`FLOW_INVALID:unknown-screen:${node.screenId}`);
    graphNodeIds.add(node.id);
  }
  for (const transition of graph.transitions) {
    if (document && (!screenIds.has(transition.fromScreenId) || !screenIds.has(transition.toScreenId))) {
      throw new Error(`FLOW_INVALID:destination:${transition.id}`);
    }
    if (transition.sourceNodeId && document && !document.nodes[transition.sourceNodeId]) {
      throw new Error(`FLOW_INVALID:source-node:${transition.sourceNodeId}`);
    }
  }
}

function allowedColorTokens(strategy: ColorStrategy): Set<string> {
  return new Set(strategy.roles.map(role => `color.${role.name}`));
}

function validateColorUsage(document: UIDocument, strategy: ColorStrategy): void {
  const allowed = allowedColorTokens(strategy);
  for (const node of Object.values(document.nodes)) {
    for (const token of Object.values(node.style?.tokens ?? {})) {
      if (token.startsWith("color.") && !allowed.has(token)) {
        throw new Error(`COLOR_ROLE_INVALID:${node.id}:${token}`);
      }
    }
  }
}

function contextForNode(
  node: UINode,
  strategy: DesignStrategy,
  graph: ExperienceGraph,
): DecisionContext {
  const target = graph.transitions.find(t => t.sourceNodeId === node.id);
  const componentIntent: DecisionContext["componentIntent"] =
    node.interaction?.action === "navigate" ? "navigation" :
    node.type === "button" || node.type === "link" ? "action" :
    node.type === "input" || node.type === "select" ? "field" :
    node.type === "card" ? "group" :
    node.type === "dialog-trigger" ? "overlay" :
    node.type === "list" || node.type === "table" ? "data" :
    node.type === "section" ? "group" :
    node.type === "custom" ? "navigation" : "group";
  const task: DecisionContext["task"] =
    node.interaction?.trigger === "submit" ? "submit" :
    node.interaction?.action === "navigate" ? "navigation" :
    componentIntent === "field" ? "edit" :
    "view";
  const viewport: DecisionContext["viewport"] =
    node.responsive?.some(r => r.breakpoint === "mobile") || strategy.responsive.some(x => /mobile/i.test(x))
      ? "mobile" : "desktop";
  const registryId = node.component?.registryId;
  return {
    screenId: node.screenId,
    nodeId: node.id,
    task,
    componentIntent,
    interaction: node.interaction?.interactive ? (node.interaction.action === "navigate" ? "navigate" : "mutate") : "none",
    viewport,
    interactive: node.interaction?.interactive,
    accessibleName: node.accessibility?.accessibleName,
    graphDestinationId: target?.toScreenId,
    graphTransitionKind: target?.kind,
    navigationPattern: strategy.navigation.includes("sidebar") ? "sidebar" : strategy.navigation.includes("bottom") ? "bottom" : "tabs",
    requiredStates: registryId ? undefined : undefined,
  };
}

function decideComponents(
  document: UIDocument,
  strategy: DesignStrategy,
  graph: ExperienceGraph,
): ComponentDecision[] {
  const decisions: ComponentDecision[] = [];
  for (const node of Object.values(document.nodes)) {
    if (node.type === "screen-root" || node.type === "text" || node.type === "image" || node.type === "icon") continue;
    const context = contextForNode(node, strategy, graph);
    const result = decide({ context, registry: componentRegistry });
    if (!result.ok) throw new Error(`COMPONENT_DECISION_INVALID:${node.id}:${result.findings.join("|")}`);
    node.component = {
      registryId: result.decision.componentId,
      variant: result.decision.variant,
      props: node.component?.props,
    };
    decisions.push(result.decision);
  }
  return decisions;
}

function craftForDocument(document: UIDocument, strategy: VisualCraftStrategy): CraftScreen[] {
  return document.screens.map(screen => {
    const nodes: CraftNode[] = [];
    for (const id of screen.nodeIds) {
      const node = document.nodes[id];
      if (!node) continue;
      const kind: CraftNode["kind"] =
        node.type === "text" ? "text" :
        node.type === "icon" ? "icon" :
        node.type === "card" ? "card" :
        ["button", "input", "select", "checkbox", "radio"].includes(node.type) ? "control" :
        "container";
      nodes.push({
        id: node.id,
        kind,
        typeRole: node.type === "text" ? "body" : undefined,
        spacing: node.layout.gap ? Number(node.layout.gap.token.split(".").pop()) * 4 : undefined,
        cardPurpose: node.type === "card" ? "grouping" : undefined,
        radius: node.type === "card" && typeof strategy.radius.md === "number" ? strategy.radius.md : undefined,
        elevation: node.type === "card" ? "subtle" : undefined,
        colorRole: node.style?.tokens?.color,
        interactiveTarget: node.interaction?.interactive ? 44 : undefined,
      });
    }
    return { id: screen.id, viewport: screen.viewport?.maxWidth ? "mobile" : "desktop", nodes };
  });
}

function assertVisualCraft(document: UIDocument, strategy: VisualCraftStrategy): void {
  for (const screen of craftForDocument(document, strategy)) {
    const lint = lintVisualCraft(screen, strategy);
    if (!lint.valid) throw new Error(`VISUAL_CRAFT_INVALID:${screen.id}:${lint.findings.map(f => f.ruleId).join(",")}`);
  }
}

function buildInformationArchitecture(strategy: DesignStrategy): string[] {
  return [...strategy.informationArchitecture];
}

function buildJourneyPlan(strategy: DesignStrategy, requested: string[]): string[] {
  const allowed = new Set(strategy.tasks.map(task => task.toLowerCase()));
  return requested.filter(step => allowed.has(step.toLowerCase()) || strategy.screenArchetypes.some(a => a.toLowerCase().includes(step.toLowerCase())));
}

export async function generateTextToUI(request: TextToUIRequest): Promise<TextToUIResult> {
  const intent = normalizeIntent(request.intent);
  const strategy = composeStrategy(intent);
  assertStrategy(strategy);
  assertColorStrategy(request.colorStrategy);
  const visualCraftStrategy = request.visualCraftStrategy ?? defaultVisualCraftStrategy;
  assertVisualCraftStrategy(visualCraftStrategy);
  const journey = buildJourneyPlan(strategy, request.journey ?? []);

  const providerResult = await executeWithPolicy(
    signal => request.provider.generateStructured({
      intent,
      strategy,
      prompt: PROMPTS["ui-generation"],
    }, signal),
  );
  const parsed = typeof providerResult.raw === "string"
    ? JSON.parse(providerResult.raw) as unknown
    : providerResult.raw;
  const generated = validateOutputShape(parsed);
  validateUIDocument(generated.document);
  validateExperienceGraph(generated.experienceGraph, generated.document);
  validateColorUsage(generated.document, request.colorStrategy);

  const decisions = decideComponents(generated.document, strategy, generated.experienceGraph);
  assertVisualCraft(generated.document, visualCraftStrategy);

  generated.document.metadata.productIntentRef = `uiforge.intent/${intent.domain}:${intent.productType}`;
  generated.document.metadata.designStrategyRef = strategy.version;
  generated.document.revision.source = "ai";

  return {
    version: TEXT_TO_UI_VERSION,
    document: generated.document,
    experienceGraph: generated.experienceGraph,
    strategy,
    colorStrategy: request.colorStrategy,
    componentDecisions: decisions,
    providerMetadata: providerResult.metadata,
    informationArchitecture: buildInformationArchitecture(strategy),
    journeyPlan: journey,
    provenance: {
      designStrategyVersion: strategy.version,
      skillIds: strategy.skills,
      colorStrategyVersion: request.colorStrategy.version,
      componentIntelligenceVersion: "uiforge.component-intelligence/v1",
      visualCraftVersion: visualCraftStrategy.version,
    },
  };
}

export function previewSelectedNodePatch(
  document: UIDocument,
  nodeId: string,
  patch: Partial<Omit<UINode, "id" | "screenId">>,
): PatchPreview {
  validateUIDocument(document);
  const before = document.nodes[nodeId];
  if (!before) throw new Error(`PATCH_SCOPE_INVALID:unknown-node:${nodeId}`);
  const command: UICommand = {
    type: "UpdateNode",
    commandId: `patch:${nodeId}`,
    nodeId,
    patch,
  };
  const next = applyCommand(document, command);
  const changedNodeIds = Object.keys(next.nodes).filter(id =>
    JSON.stringify(next.nodes[id]) !== JSON.stringify(document.nodes[id]),
  );
  const unrelatedNodeIds = changedNodeIds.filter(id => id !== nodeId);
  if (unrelatedNodeIds.length) throw new Error(`PATCH_SCOPE_INVALID:${unrelatedNodeIds.join(",")}`);
  return {
    command,
    targetNodeId: nodeId,
    before,
    after: next.nodes[nodeId]!,
    changedNodeIds,
    unrelatedNodeIds,
  };
}

export function applySelectedNodePatch(
  document: UIDocument,
  preview: PatchPreview,
): UIDocument {
  if (preview.changedNodeIds.length !== 1 || preview.changedNodeIds[0] !== preview.targetNodeId) {
    throw new Error("PATCH_SCOPE_INVALID:preview");
  }
  return applyCommand(document, preview.command);
}
