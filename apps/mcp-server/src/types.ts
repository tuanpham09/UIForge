
import type {
  CodeMappingResolution,
  ComponentRegistry,
} from "@uiforge/component-registry";
import type { TokenSet } from "@uiforge/design-tokens";
import type { UIDocument } from "@uiforge/ui-schema";

export const MCP_CONTRACT_VERSION = "uiforge.mcp/v1" as const;
export const MCP_PROTOCOL_VERSION = "2026-07-28" as const;
export const MCP_SERVER_VERSION = "0.1.0" as const;

export interface RevisionEnvelope {
  schemaVersion: string;
  mcpVersion: typeof MCP_CONTRACT_VERSION;
  revision: number;
  updatedAt: string;
  projectId: string;
}

export interface ResponseEnvelope<T> extends RevisionEnvelope {
  data: T;
  warnings?: string[];
}

export interface FlowTransition {
  id: string;
  source: { screenId: string; nodeId?: string };
  trigger: string;
  action: string;
  destination: { screenId?: string; nodeId?: string };
  condition?: string;
  animation?: Record<string, string | number | boolean>;
}

export interface Flow {
  id: string;
  name: string;
  startingPoint: { screenId: string };
  transitions: FlowTransition[];
}

export interface UserJourney {
  id: string;
  name: string;
  flowIds: string[];
  screenIds: string[];
}

export interface ScreenConnection {
  sourceScreenId: string;
  sourceNodeId: string;
  trigger: string;
  action: string;
  destinationScreenId?: string;
  destinationNodeId?: string;
}

export interface ResponsiveRulesProjection {
  screenId: string;
  rules: Array<{
    nodeId: string;
    breakpoint: string;
    hidden?: boolean;
    variant?: string;
  }>;
}

export interface ProjectSnapshot {
  projectId: string;
  document: UIDocument;
  tokens: TokenSet;
  registry: ComponentRegistry;
  flows: Flow[];
  journeys: UserJourney[];
  revision: number;
  updatedAt: string;
  codeSpec?: unknown;
}

export interface ProjectProvider {
  getProject(projectId: string): ProjectSnapshot | null;
}

export interface CodeMappingResult {
  resolution: CodeMappingResolution;
}

export interface ValidationFinding {
  code: string;
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationReport {
  valid: boolean;
  findings: ValidationFinding[];
}
