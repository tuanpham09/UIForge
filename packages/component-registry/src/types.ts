export const COMPONENT_REGISTRY_VERSION = "uiforge.components/v1" as const;
export const CODE_MAPPING_VERSION = "uiforge.code-mapping/v1" as const;

export type ComponentId = string;

export interface ComponentAnatomyPart {
  id: string;
  description: string;
  required?: boolean;
}
export interface ComponentVariant {
  id: string;
  description: string;
  whenToUse?: string;
  whenNotToUse?: string;
}
export interface ComponentState {
  id: string;
  description: string;
  interactive?: boolean;
}
export interface AccessibilityContract {
  role: string;
  accessibleName: "required" | "recommended" | "inherited";
  keyboard?: string[];
  focusable?: boolean;
  requirements: string[];
}
export interface ComponentDecisionMetadata {
  whenToUse: string[];
  whenNotToUse: string[];
  contextFit: string[];
  alternatives: string[];
  composition: {
    allowedChildren: string[];
    preferredParents: string[];
    nestingRules: string[];
  };
  antiPatterns: string[];
  responsiveBehavior: string[];
  experienceGraphImplications: string[];
}
export interface RendererBinding {
  bindingId: string;
  semanticType: string;
}

export type CodeFramework = "react";
export type CodeRuntime = "nextjs";
export type CodeStyling = "tailwind-v4";
export type CodeLibrary = "shadcn-ui" | "base-ui";
export type MappingConfidence = "high" | "medium" | "low";
export type ImportPathKind = "project-relative" | "package";

export interface CodeSourceLocation {
  kind: "upstream";
  path: string;
  url: string;
  revision?: string;
}

export interface CodeMappingProvenance {
  kind: "verified-reference" | "manual-review";
  source: string;
  verifiedAt: string;
  notes?: string;
}

export interface CodeComponentMapping {
  mappingId: string;
  version: typeof CODE_MAPPING_VERSION;
  framework: CodeFramework;
  runtime: CodeRuntime;
  styling: CodeStyling;
  library: CodeLibrary;
  importPath: string;
  importPathKind: ImportPathKind;
  exportName: string;
  componentName: string;
  propMapping: Record<string, string>;
  variantMapping: Record<string, string>;
  tokenMapping: Record<string, string>;
  dependencies: string[];
  versionRange: string;
  sourceLocation: CodeSourceLocation;
  confidence: MappingConfidence;
  provenance: CodeMappingProvenance;
}

export interface CodeMappingSet {
  version: typeof CODE_MAPPING_VERSION;
  mappings: Record<string, CodeComponentMapping>;
}

export interface CodeMappingQuery {
  componentId: ComponentId;
  framework?: CodeFramework;
  runtime?: CodeRuntime;
  library?: CodeLibrary;
}

export interface CodeMappingResolution {
  componentId: ComponentId;
  mapping: CodeComponentMapping | null;
  reason: "resolved" | "missing" | "unsupported-target";
}

export interface CodeMappingPlaceholder {
  strategy: "project-mapping";
  componentName: string;
  source?: string;
}
export interface ComponentDefinition {
  id: ComponentId;
  version: 1;
  name: string;
  description: string;
  anatomy: ComponentAnatomyPart[];
  variants: ComponentVariant[];
  states: ComponentState[];
  tokens: string[];
  accessibility: AccessibilityContract;
  decision: ComponentDecisionMetadata;
  renderer: RendererBinding;
  codeMapping: CodeMappingPlaceholder;
}
export interface ComponentRegistry {
  version: typeof COMPONENT_REGISTRY_VERSION;
  components: Record<ComponentId, ComponentDefinition>;
}
export interface RegistryValidationIssue {
  code:
    | "DUPLICATE_ID"
    | "INVALID_ID"
    | "DUPLICATE_VARIANT"
    | "DUPLICATE_STATE"
    | "INVALID_RENDERER_BINDING"
    | "INVALID_ACCESSIBILITY"
    | "INVALID_DECISION_METADATA";
  path: string;
  message: string;
}
export interface RegistryValidationResult {
  valid: boolean;
  issues: RegistryValidationIssue[];
}
export interface CodeMappingValidationIssue {
  code:
    | "DUPLICATE_MAPPING_ID"
    | "INVALID_MAPPING_ID"
    | "INVALID_IMPORT_PATH"
    | "INVALID_EXPORT_NAME"
    | "INVALID_SOURCE_LOCATION"
    | "INVALID_PROVENANCE"
    | "INVALID_VARIANT_MAPPING"
    | "INVALID_COMPONENT_ID";
  path: string;
  message: string;
}
export interface CodeMappingValidationResult {
  valid: boolean;
  issues: CodeMappingValidationIssue[];
}
