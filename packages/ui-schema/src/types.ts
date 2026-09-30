export const UI_SCHEMA_VERSION = "uiforge.schema/v1" as const;

export type SchemaVersion = typeof UI_SCHEMA_VERSION;
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type DocumentId = Brand<string, "DocumentId">;
export type ScreenId = Brand<string, "ScreenId">;
export type NodeId = Brand<string, "NodeId">;
export type AssetId = Brand<string, "AssetId">;
export type CommandId = Brand<string, "CommandId">;
export type TokenRef = string & { readonly __tokenRef: true };

export type SemanticNodeType =
  | "screen-root" | "section" | "text" | "image" | "icon" | "button" | "link"
  | "input" | "select" | "checkbox" | "radio" | "list" | "list-item" | "table"
  | "card" | "dialog-trigger" | "custom";

export type LayoutMode = "stack" | "flex" | "grid" | "absolute";

export interface SpacingValue { token: TokenRef; }

export interface LayoutSpec {
  mode: LayoutMode;
  direction?: "row" | "column";
  gap?: SpacingValue;
  padding?: { block?: SpacingValue; inline?: SpacingValue };
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  columns?: number;
  rows?: number;
  width?: { mode: "fill" | "fit" | "fixed"; token?: TokenRef };
  height?: { mode: "fill" | "fit" | "fixed"; token?: TokenRef };
}

export interface EditorLayoutMetadata {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
}

export interface NodeContent {
  text?: string;
  placeholder?: string;
  alt?: string;
  src?: string;
  value?: string;
  label?: string;
  description?: string;
  data?: Record<string, string | number | boolean | null>;
}

export interface ComponentInstance {
  registryId: string;
  variant?: string;
  props?: Record<string, string | number | boolean | null>;
}

export interface CodeMapping {
  source: string;
  exportName: string;
  componentName: string;
}

export interface ResponsiveRule {
  breakpoint: string;
  layout?: Partial<LayoutSpec>;
  hidden?: boolean;
  variant?: string;
  tokenOverrides?: Record<string, TokenRef>;
}

export interface AccessibilityMetadata {
  role?: string;
  accessibleName?: string;
  description?: string;
  required?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  keyboard?: string[];
  describedBy?: NodeId[];
  labelledBy?: NodeId[];
}

export interface AssetRef {
  id: AssetId;
  kind: "image" | "icon" | "font" | "file";
  source: string;
  alt?: string;
}

export interface InteractionMetadata {
  interactive: boolean;
  trigger?: "click" | "submit" | "change" | "input" | "focus" | "hover" | "keyboard";
  action?: string;
  targetScreenId?: ScreenId;
  targetNodeId?: NodeId;
}

export interface NodeStyle { tokens?: Record<string, TokenRef>; }

export interface UINode {
  id: NodeId;
  screenId: ScreenId;
  parentId: NodeId | null;
  childrenIds: NodeId[];
  type: SemanticNodeType;
  layout: LayoutSpec;
  editor?: EditorLayoutMetadata;
  content?: NodeContent;
  style?: NodeStyle;
  component?: ComponentInstance;
  codeMapping?: CodeMapping;
  responsive?: ResponsiveRule[];
  accessibility?: AccessibilityMetadata;
  assets?: AssetRef[];
  interaction?: InteractionMetadata;
}

export interface Screen {
  id: ScreenId;
  name: string;
  route?: string;
  rootNodeId: NodeId;
  nodeIds: NodeId[];
  viewport?: { minWidth?: number; maxWidth?: number };
  metadata?: Record<string, string>;
}

export interface RevisionMetadata {
  revision: number;
  createdAt: string;
  updatedAt: string;
  source: "manual" | "ai" | "migration" | "import";
}

export interface UIDocumentMetadata {
  name: string;
  description?: string;
  productIntentRef?: string;
  designStrategyRef?: string;
}

export interface UIDocument {
  schemaVersion: SchemaVersion;
  id: DocumentId;
  metadata: UIDocumentMetadata;
  revision: RevisionMetadata;
  screens: Screen[];
  nodes: Record<NodeId, UINode>;
  assets: Record<AssetId, AssetRef>;
}

export type NodePatch = Partial<Omit<UINode, "id" | "screenId">>;

export interface CreateNodeCommand { type: "CreateNode"; commandId: CommandId; node: UINode; }
export interface UpdateNodeCommand { type: "UpdateNode"; commandId: CommandId; nodeId: NodeId; patch: NodePatch; }
export interface DeleteNodeCommand { type: "DeleteNode"; commandId: CommandId; nodeId: NodeId; recursive?: boolean; }
export interface MoveNodeCommand { type: "MoveNode"; commandId: CommandId; nodeId: NodeId; toIndex: number; }
export interface ReparentNodeCommand { type: "ReparentNode"; commandId: CommandId; nodeId: NodeId; newParentId: NodeId | null; toIndex: number; }
export interface SetTokenCommand { type: "SetToken"; commandId: CommandId; nodeId: NodeId; slot: string; token: TokenRef; }
export interface SetVariantCommand { type: "SetVariant"; commandId: CommandId; nodeId: NodeId; variant: string; }
export interface SetResponsiveRuleCommand { type: "SetResponsiveRule"; commandId: CommandId; nodeId: NodeId; rule: ResponsiveRule; }
export interface SetCodeMappingCommand { type: "SetCodeMapping"; commandId: CommandId; nodeId: NodeId; mapping: CodeMapping; }

export type UICommand =
  | CreateNodeCommand | UpdateNodeCommand | DeleteNodeCommand | MoveNodeCommand
  | ReparentNodeCommand | SetTokenCommand | SetVariantCommand
  | SetResponsiveRuleCommand | SetCodeMappingCommand;

export interface MigrationContext { readonly from: string; readonly to: string; }

export interface SchemaMigration<From extends string = string, To extends string = string> {
  readonly from: From;
  readonly to: To;
  migrate(document: unknown, context: MigrationContext): UIDocument;
}
