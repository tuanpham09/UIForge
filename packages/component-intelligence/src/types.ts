import type { ComponentId, ComponentRegistry } from "@uiforge/component-registry";

export const COMPONENT_INTELLIGENCE_VERSION = "uiforge.component-intelligence/v1" as const;

export type SpecialistId =
  | "information-architect" | "ux-pattern-designer" | "component-designer"
  | "visual-designer" | "responsive-designer" | "accessibility-reviewer"
  | "interaction-reviewer" | "design-critic";

export type DecisionKind = "component" | "pattern" | "variant" | "state";

export type DecisionContext = {
  screenId: string;
  nodeId?: string;
  task: "navigation" | "create" | "edit" | "submit" | "view" | "confirm" | "filter" | "select";
  componentIntent: "action" | "field" | "form" | "group" | "feedback" | "navigation" | "data" | "overlay";
  interaction?: "none" | "navigate" | "mutate" | "submit" | "open-overlay" | "select";
  viewport: "mobile" | "tablet" | "desktop";
  destructive?: boolean;
  loading?: boolean;
  disabled?: boolean;
  selectable?: boolean;
  interactive?: boolean;
  hasContainedAction?: boolean;
  parentComponentId?: ComponentId;
  existingPrimaryActions?: number;
  accessibleName?: string;
  graphDestinationId?: string;
  graphTransitionKind?: "navigation" | "overlay" | "state-change";
  requiredStates?: string[];
  navigationPattern?: "top" | "sidebar" | "rail" | "bottom" | "tabs" | "breadcrumbs" | "back";
  fieldKind?: "text" | "search" | "long-form";
};

export type SkillReference = { id: string; version: string; purpose: string };
export type SkillMetadata = SkillReference & { summary: string; ruleIds: string[] };
export type SkillLoader = { discover(context: DecisionContext): SkillReference[]; load(id: string, version: string): SkillMetadata };

export type DesignRule = {
  id: string; version: string;
  kind: "normative" | "system" | "product" | "graph" | "component" | "heuristic";
  priority: number; componentIds?: ComponentId[]; specialist: SpecialistId;
  description: string; matches: (context: DecisionContext) => boolean;
  outcome: { variant?: string; state?: string; requiresGraph?: boolean; forbidden?: boolean; message?: string };
};

export type SpecialistContract = {
  id: SpecialistId; responsibility: string; capabilities: readonly string[];
  canMutate: boolean; discovery: SkillReference[];
};

export type DecisionRecord = {
  decisionId: string; kind: DecisionKind; screenId: string; nodeId?: string;
  componentId: ComponentId; variant?: string; state?: string;
  triggeringContext: DecisionContext; ruleIds: string[]; skillIds: string[];
  rationale: string; constraintsChecked: string[];
  validation: { valid: boolean; findings: string[] };
};

export type ComponentDecision = {
  version: typeof COMPONENT_INTELLIGENCE_VERSION; componentId: ComponentId;
  variant: string; state: string; ruleIds: string[]; skillIds: string[];
  specialists: SpecialistId[];
  graphRequirements: Array<{ trigger: "click" | "submit" | "select" | "open"; kind: "navigation" | "overlay" | "state-change"; destinationId?: string }>;
  record: DecisionRecord;
};

export type DecisionInput = { context: DecisionContext; registry: ComponentRegistry; skills?: SkillReference[]; skillLoader?: SkillLoader };
export type DecisionValidation = { valid: boolean; findings: string[] };
export type OrchestratorResult = { ok: true; decision: ComponentDecision } | { ok: false; findings: string[] };
