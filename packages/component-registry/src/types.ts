export const COMPONENT_REGISTRY_VERSION = "uiforge.components/v1" as const;
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
