import type { ProviderMetadata, AIProvider } from "@uiforge/ai";
import type { ColorStrategy } from "@uiforge/color-intelligence";
import type { ComponentDecision } from "@uiforge/component-intelligence";
import type { DesignStrategy, ProductIntent } from "@uiforge/design-intelligence";
import type { UICommand, UIDocument, UINode } from "@uiforge/ui-schema";
import type { VisualCraftStrategy } from "@uiforge/visual-craft-quality";

export const TEXT_TO_UI_VERSION = "uiforge.text-to-ui/v1" as const;
export const EXPERIENCE_GRAPH_VERSION = "uiforge.experience-graph/v1" as const;

export type ExperienceGraph = {
  version: typeof EXPERIENCE_GRAPH_VERSION;
  nodes: Array<{ id: string; screenId: string; label: string }>;
  transitions: Array<{
    id: string;
    fromScreenId: string;
    toScreenId: string;
    sourceNodeId?: string;
    trigger: "click" | "submit" | "select" | "open";
    kind: "navigation" | "overlay" | "state-change";
  }>;
};

export type TextToUIRequest = {
  intent: ProductIntent;
  colorStrategy: ColorStrategy;
  visualCraftStrategy?: VisualCraftStrategy;
  journey?: string[];
  provider: AIProvider;
};

export type TextToUIProviderOutput = {
  schemaVersion: "uiforge.text-to-ui-output/v1";
  document: UIDocument;
  experienceGraph: ExperienceGraph;
};

export type TextToUIResult = {
  version: typeof TEXT_TO_UI_VERSION;
  document: UIDocument;
  experienceGraph: ExperienceGraph;
  strategy: DesignStrategy;
  colorStrategy: ColorStrategy;
  componentDecisions: ComponentDecision[];
  providerMetadata: ProviderMetadata;
  informationArchitecture: string[];
  journeyPlan: string[];
  provenance: {
    designStrategyVersion: string;
    skillIds: string[];
    colorStrategyVersion: string;
    componentIntelligenceVersion: string;
    visualCraftVersion: string;
  };
};

export type PatchPreview = {
  command: UICommand;
  targetNodeId: string;
  before: UINode;
  after: UINode;
  changedNodeIds: string[];
  unrelatedNodeIds: string[];
};

export type TextToUIProviderFactory = (input: {
  strategy: DesignStrategy;
  colorStrategy: ColorStrategy;
  visualCraftStrategy: VisualCraftStrategy;
  journey: string[];
}) => AIProvider;
