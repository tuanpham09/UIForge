// biome-ignore-all format: code specification contract is maintained as a reviewable semantic schema
// biome-ignore-all assist/source/organizeImports: domain contract imports are intentionally grouped
import type { ColorStrategy } from "@uiforge/color-intelligence";
import type { ComponentDecision } from "@uiforge/component-intelligence";
import type { CodeComponentMapping } from "@uiforge/component-registry";
import type { DesignStrategy } from "@uiforge/design-intelligence";
import type { UIDocument, UINode } from "@uiforge/ui-schema";
import type { VisualCraftStrategy } from "@uiforge/visual-craft-quality";

export const CODE_SPEC_VERSION = "uiforge.code-spec/v1" as const;
export type TargetFramework = "react";
export type TargetRuntime = "nextjs";
export type TargetStyling = "tailwind-v4";
export type TargetLibrary = "shadcn-ui" | "base-ui";

export type ExperienceGraphAdapter = {
  version: string;
  transitions: readonly ExperienceTransition[];
};
export type ExperienceTransition = {
  id: string;
  fromScreenId: string;
  toScreenId: string;
  sourceNodeId?: string;
  trigger: string;
  kind: "navigation" | "overlay" | "state-change";
  condition?: string;
};
export type CodeSpecTarget = {
  framework: TargetFramework;
  runtime: TargetRuntime;
  styling: TargetStyling;
  library: TargetLibrary;
};
export type FileOwnership = "generated" | "preserved" | "review-required";
export type FilePlanEntry = {
  path: string;
  kind: "page" | "layout" | "component" | "style" | "data" | "config";
  owner: FileOwnership;
  reason: string;
  screenIds: string[];
};
export type ImportRequirement = {
  source: string;
  imports: string[];
  kind: "component" | "utility" | "type";
  requiredBy: string[];
};
export type ComponentRequirement = {
  nodeId: string;
  screenId: string;
  registryId: string;
  mappingId?: string;
  componentName?: string;
  importPath?: string;
  variant?: string;
  props: Record<string, string | number | boolean | null>;
  requiredStates: string[];
  warnings: string[];
};
export type TokenRequirement = {
  nodeId: string;
  slot: string;
  token: string;
  cssVariable: string;
  tailwindValue: string;
};
export type ResponsiveRequirement = {
  nodeId: string;
  breakpoint: string;
  classes: string[];
  hidden?: boolean;
  variant?: string;
  tokenOverrides: Record<string, string>;
};
export type AccessibilityRequirement = {
  nodeId: string;
  role?: string;
  accessibleName?: string;
  required: boolean;
  keyboard: string[];
  describedBy: string[];
  labelledBy: string[];
};
export type InteractionRequirement = {
  nodeId: string;
  trigger: string;
  action: string;
  sourceScreenId: string;
  destinationScreenId?: string;
  destinationNodeId?: string;
  transitionId?: string;
  kind?: ExperienceTransition["kind"];
  condition?: string;
};
export type WarningCode =
  | "MISSING_CODE_MAPPING" | "UNSUPPORTED_TARGET" | "MISSING_GRAPH_TRANSITION"
  | "MISSING_SCREEN_ROUTE" | "UNKNOWN_TOKEN_REFERENCE" | "NON_INTERACTIVE_NAVIGATION"
  | "REVIEW_REQUIRED";
export type CodeSpecWarning = {
  code: WarningCode;
  path: string;
  message: string;
  severity: "warning" | "error";
};
export type StrategyProvenance = {
  designStrategyVersion: string;
  colorStrategyVersion: string;
  componentIntelligenceVersion: string;
  visualCraftVersion: string;
  skillIds: string[];
  requirements: string[];
};
export type CodeSpecification = {
  version: typeof CODE_SPEC_VERSION;
  target: CodeSpecTarget;
  documentId: string;
  documentRevision: number;
  filePlan: FilePlanEntry[];
  componentGraph: ComponentRequirement[];
  importPlan: ImportRequirement[];
  tokenRequirements: TokenRequirement[];
  responsiveRequirements: ResponsiveRequirement[];
  accessibilityRequirements: AccessibilityRequirement[];
  interactionRequirements: InteractionRequirement[];
  warnings: CodeSpecWarning[];
  strategyProvenance: StrategyProvenance;
  deterministicKey: string;
};
export type CodeSpecContext = {
  document: UIDocument;
  graph?: ExperienceGraphAdapter;
  target?: Partial<CodeSpecTarget>;
  designStrategy?: DesignStrategy;
  colorStrategy?: ColorStrategy;
  componentDecisions?: readonly ComponentDecision[];
  visualCraftStrategy?: VisualCraftStrategy;
};
export type CodeSpecResult = {
  spec: CodeSpecification;
  mappings: CodeComponentMapping[];
};
export type NodeLike = UINode;
