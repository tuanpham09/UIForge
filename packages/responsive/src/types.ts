export const RESPONSIVE_VERSION = "uiforge.responsive/v1" as const;

export type ViewportPreset = "wide" | "desktop" | "tablet" | "mobile";

export interface Viewport {
  preset: ViewportPreset;
  width: number;
  height: number;
}

export interface Breakpoint {
  id: ViewportPreset;
  minWidth?: number;
  maxWidth?: number;
  order: number;
}

export interface ContainerRule {
  maxWidth?: number;
  gutterToken?: string;
}

export interface ResponsiveTypographyRule {
  role?: string;
  token?: string;
}

export interface ResponsiveInteractionRule {
  targetScreenId?: string;
  targetNodeId?: string;
}

export interface ResponsiveRuleV1 {
  breakpoint: ViewportPreset;
  minWidth?: number;
  maxWidth?: number;
  layout?: Partial<LayoutSpec>;
  hidden?: boolean;
  variant?: string;
  tokenOverrides?: Record<string, string>;
  container?: ContainerRule;
  typography?: ResponsiveTypographyRule;
  interaction?: ResponsiveInteractionRule;
}

export interface ResolvedResponsiveNode {
  nodeId: string;
  visible: boolean;
  layout?: Record<string, unknown>;
  variant?: string;
  tokenOverrides: Record<string, string>;
  container?: ContainerRule;
  typography?: ResponsiveTypographyRule;
  interaction?: ResponsiveInteractionRule;
  appliedRuleIds: string[];
}

export type ResponsiveDiagnosticCode =
  | "INVALID_BREAKPOINT"
  | "INVALID_RANGE"
  | "DUPLICATE_BREAKPOINT"
  | "UNKNOWN_TOKEN"
  | "INVALID_LAYOUT"
  | "INVALID_NAVIGATION_TARGET"
  | "RULE_OUTSIDE_SCREEN";

export interface ResponsiveDiagnostic {
  code: ResponsiveDiagnosticCode;
  severity: "error" | "warning";
  nodeId?: string;
  screenId?: string;
  breakpoint?: string;
  message: string;
}

export interface ResponsiveProjection {
  version: typeof RESPONSIVE_VERSION;
  viewport: Viewport;
  nodes: Record<string, ResolvedResponsiveNode>;
  diagnostics: ResponsiveDiagnostic[];
}
