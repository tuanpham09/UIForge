export const UI_SCHEMA_VERSION = "uiforge.schema/v1" as const;

export type SchemaVersion = typeof UI_SCHEMA_VERSION;
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type DocumentId = string;
export type ScreenId = string;
export type FrameId = string;
export type NodeId = string;
export type AssetId = string;
export type CommandId = string;
export type TokenRef = string;

export type SemanticNodeType =
  | "screen-root"
  | "frame"
  | "section"
  | "text"
  | "image"
  | "icon"
  | "button"
  | "link"
  | "input"
  | "select"
  | "checkbox"
  | "radio"
  | "list"
  | "list-item"
  | "table"
  | "card"
  | "dialog-trigger"
  | "group"
  | "custom";

export type LayoutMode = "stack" | "flex" | "grid" | "absolute";

export interface SpacingValue {
  token: TokenRef;
}

export interface LayoutSpec {
  mode: LayoutMode;
  direction?: "row" | "column";
  gap?: SpacingValue;
  padding?: {
    block?: SpacingValue;
    inline?: SpacingValue;
  };
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
  visible?: boolean;
  locked?: boolean;
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
  /** Semantic breakpoint ID; the responsive engine owns the canonical breakpoint map. */
  breakpoint: string;
  /** Optional explicit range for controlled/experimental viewport validation. */
  minWidth?: number;
  maxWidth?: number;
  layout?: Partial<LayoutSpec>;
  hidden?: boolean;
  variant?: string;
  tokenOverrides?: Record<string, TokenRef>;
  container?: {
    maxWidth?: number;
    gutterToken?: TokenRef;
  };
  typography?: {
    role?: string;
    token?: TokenRef;
  };
  /** Navigation override only; the Experience Graph remains canonical. */
  interaction?: {
    targetScreenId?: ScreenId;
    targetNodeId?: NodeId;
  };
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
  trigger?:
    | "click"
    | "submit"
    | "change"
    | "input"
    | "focus"
    | "hover"
    | "keyboard";
  action?: string;
  targetScreenId?: ScreenId;
  targetNodeId?: NodeId;
}

export interface NodeStyle {
  tokens?: Record<string, TokenRef>;
}

export interface UINode {
  id: NodeId;
  screenId: ScreenId;
  /** Optional owning frame; screen remains the canonical top-level context. */
  frameId?: FrameId;
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

export interface Frame {
  id: FrameId;
  screenId: ScreenId;
  presetId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  presetVersion: string;
  safeArea?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface Screen {
  id: ScreenId;
  name: string;
  route?: string;
  rootNodeId: NodeId;
  nodeIds: NodeId[];
  viewport?: {
    minWidth?: number;
    maxWidth?: number;
  };
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
  /** Optional for backward-compatible documents. */
  frames?: Frame[];
  nodes: Record<string, UINode>;
  assets: Record<string, AssetRef>;
}

export type NodePatch = Partial<Omit<UINode, "id" | "screenId">>;

export interface CreateFrameCommand {
  type: "CreateFrame";
  commandId: CommandId;
  frame: Frame;
}

export interface UpdateFrameCommand {
  type: "UpdateFrame";
  commandId: CommandId;
  frameId: FrameId;
  patch: Partial<Omit<Frame, "id">>;
}

export interface DeleteFrameCommand {
  type: "DeleteFrame";
  commandId: CommandId;
  frameId: FrameId;
}

export interface CreateNodeCommand {
  type: "CreateNode";
  commandId: CommandId;
  node: UINode;
}

export interface UpdateNodeCommand {
  type: "UpdateNode";
  commandId: CommandId;
  nodeId: NodeId;
  patch: NodePatch;
}

export interface DeleteNodeCommand {
  type: "DeleteNode";
  commandId: CommandId;
  nodeId: NodeId;
  recursive?: boolean;
}

export interface MoveNodeCommand {
  type: "MoveNode";
  commandId: CommandId;
  nodeId: NodeId;
  toIndex: number;
}

export interface ReparentNodeCommand {
  type: "ReparentNode";
  commandId: CommandId;
  nodeId: NodeId;
  newParentId: NodeId | null;
  toIndex: number;
}

export interface SetTokenCommand {
  type: "SetToken";
  commandId: CommandId;
  nodeId: NodeId;
  slot: string;
  token: TokenRef;
}

export interface SetVariantCommand {
  type: "SetVariant";
  commandId: CommandId;
  nodeId: NodeId;
  variant: string;
}

export interface SetResponsiveRuleCommand {
  type: "SetResponsiveRule";
  commandId: CommandId;
  nodeId: NodeId;
  rule: ResponsiveRule;
}

export interface SetCodeMappingCommand {
  type: "SetCodeMapping";
  commandId: CommandId;
  nodeId: NodeId;
  mapping: CodeMapping;
}

export type UICommand =
  | CreateFrameCommand
  | UpdateFrameCommand
  | DeleteFrameCommand
  | CreateNodeCommand
  | UpdateNodeCommand
  | DeleteNodeCommand
  | MoveNodeCommand
  | ReparentNodeCommand
  | SetTokenCommand
  | SetVariantCommand
  | SetResponsiveRuleCommand
  | SetCodeMappingCommand;

export interface MigrationContext {
  readonly from: string;
  readonly to: string;
}

export interface SchemaMigration<
  From extends string = string,
  To extends string = string,
> {
  readonly from: From;
  readonly to: To;
  migrate(document: unknown, context: MigrationContext): UIDocument;
}
