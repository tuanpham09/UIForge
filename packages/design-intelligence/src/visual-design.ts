import { componentRegistry } from "@uiforge/component-registry";
import { defaultTokenSet } from "@uiforge/design-tokens";
import type {
  ComponentInstance,
  EditorLayoutMetadata,
  LayoutSpec,
  NodeStyle,
  UIDocument,
  UINode,
} from "@uiforge/ui-schema";

export const VISUAL_DESIGN_CONTRACT_VERSION =
  "uiforge.visual-design/v2" as const;

export type VisualDesignPatch = {
  nodeId: string;
  style?: NodeStyle;
  component?: ComponentInstance;
  layout?: LayoutSpec;
  editor?: EditorLayoutMetadata;
};

export type VisualDesignProposal = {
  version: typeof VISUAL_DESIGN_CONTRACT_VERSION;
  sourceStage: "wireframe";
  targetStage: "visual";
  patches: VisualDesignPatch[];
  rationale: string[];
};

const token = (name: string) => {
  if (!defaultTokenSet.semantic[name] && !defaultTokenSet.primitives[name]) {
    throw new Error(`VISUAL_DESIGN_UNKNOWN_TOKEN:${name}`);
  }
  return name;
};

const styleFor = (node: UINode): NodeStyle => {
  const tokens: Record<string, string> = {};
  switch (node.type) {
    case "screen-root":
      tokens.fill = token("color.background");
      tokens.typography = token("text.body");
      break;
    case "section":
    case "list":
      tokens.fill = token("color.background");
      tokens.spacing = token("layout.sectionGap");
      break;
    case "text":
      tokens.typography = token("text.body");
      tokens.color = token("color.foreground");
      break;
    case "button":
      tokens.fill = token("color.primary");
      tokens.color = token("color.onPrimary");
      tokens.radius = token("control.radius");
      tokens.typography = token("text.body");
      break;
    case "input":
      tokens.fill = token("color.surface");
      tokens.color = token("color.foreground");
      tokens.border = token("color.border");
      tokens.radius = token("control.radius");
      tokens.typography = token("text.body");
      break;
    case "card":
      tokens.fill = token("color.surface");
      tokens.color = token("color.foreground");
      tokens.border = token("color.border");
      tokens.radius = token("control.radius");
      tokens.shadow = token("shadow.subtle");
      break;
    case "image":
      tokens.fill = token("color.gray.100");
      tokens.radius = token("control.radius");
      break;
    case "icon":
      tokens.color = token("color.foreground");
      break;
    default:
      tokens.color = token("color.foreground");
      break;
  }
  return { tokens };
};

const componentFor = (node: UINode): ComponentInstance | undefined => {
  const registryId =
    node.type === "button"
      ? "uiforge.button"
      : node.type === "input"
        ? "uiforge.input"
        : node.type === "card"
          ? "uiforge.card"
          : undefined;
  if (!registryId || !componentRegistry.components[registryId])
    return node.component;

  const definition = componentRegistry.components[registryId];
  const preferredVariant =
    node.type === "button"
      ? "primary"
      : node.type === "card"
        ? "default"
        : "default";
  const variant = definition.variants.some(
    (item) => item.id === preferredVariant,
  )
    ? preferredVariant
    : definition.variants[0]?.id;
  return { registryId, ...(variant ? { variant } : {}) };
};

const layoutFor = (node: UINode): LayoutSpec => {
  switch (node.type) {
    case "screen-root":
      return {
        mode: "stack",
        direction: "column",
        gap: { token: token("space.6") },
        padding: {
          block: { token: token("space.6") },
          inline: { token: token("space.6") },
        },
        align: "stretch",
      };
    case "section":
    case "card":
    case "list":
      return {
        mode: "stack",
        direction: "column",
        gap: { token: token("space.4") },
        padding: {
          block: { token: token("space.4") },
          inline: { token: token("space.4") },
        },
        align: "stretch",
      };
    case "button":
    case "input":
      return {
        mode: "flex",
        direction: "row",
        gap: { token: token("space.2") },
        align: "center",
        justify: "center",
        width: { mode: "fit" },
        height: { mode: "fixed", token: token("space.10") },
      };
    default:
      return {
        ...node.layout,
        mode: node.layout.mode === "absolute" ? "flex" : node.layout.mode,
        align: node.layout.align ?? "start",
      };
  }
};

const defaultSize = (node: UINode) => {
  switch (node.type) {
    case "text":
      return { width: 280, height: 32 };
    case "button":
      return { width: 160, height: 44 };
    case "input":
      return { width: 320, height: 44 };
    case "card":
      return { width: 320, height: 120 };
    case "image":
      return { width: 320, height: 180 };
    case "section":
    case "list":
      return { width: 320, height: 96 };
    default:
      return { width: 320, height: 48 };
  }
};

function visualEditor(
  document: UIDocument,
  node: UINode,
): EditorLayoutMetadata {
  const existing = node.editor;
  if (existing?.x !== undefined && existing?.y !== undefined) {
    return {
      ...existing,
      width: existing.width ?? defaultSize(node).width,
      height: existing.height ?? defaultSize(node).height,
    };
  }

  const frame =
    document.frames?.find(
      (candidate) => candidate.screenId === node.screenId,
    ) ?? document.frames?.[0];
  const rootId = document.screens.find(
    (screen) => screen.id === node.screenId,
  )?.rootNodeId;
  const root = rootId ? document.nodes[rootId] : undefined;
  const size = defaultSize(node);
  const frameX = frame?.x ?? 80;
  const frameY = frame?.y ?? 80;
  const frameWidth = frame?.width ?? 390;
  const frameHeight = frame?.height ?? 844;
  const parent = node.parentId ? document.nodes[node.parentId] : undefined;
  const siblings = parent?.childrenIds ?? root?.childrenIds ?? [];
  const siblingIndex = Math.max(0, siblings.indexOf(node.id));
  const parentEditor = parent ? visualEditor(document, parent) : undefined;
  const parentX = parentEditor?.x ?? frameX + 24;
  const parentY = parentEditor?.y ?? frameY + 72;
  const parentHeight = parentEditor?.height ?? 0;
  const width = Math.min(size.width, Math.max(160, frameWidth - 48));

  return {
    ...existing,
    x: parent ? parentX : frameX + 24,
    y: parent
      ? parentY + parentHeight + 16 + siblingIndex * (size.height + 16)
      : frameY + 72 + siblingIndex * (size.height + 16),
    width,
    height: Math.min(size.height, Math.max(32, frameHeight - 96)),
  };
}

export function buildVisualDesignProposal(
  document: UIDocument,
): VisualDesignProposal {
  if ((document.metadata.designStage ?? "wireframe") !== "wireframe") {
    throw new Error("VISUAL_DESIGN_SOURCE_MUST_BE_WIREFRAME");
  }

  const patches = Object.values(document.nodes).map((node) => ({
    nodeId: node.id,
    style: styleFor(node),
    component: componentFor(node),
    layout: layoutFor(node),
    editor:
      node.type === "screen-root"
        ? { ...node.editor, visible: false }
        : visualEditor(document, node),
  }));

  return {
    version: VISUAL_DESIGN_CONTRACT_VERSION,
    sourceStage: "wireframe",
    targetStage: "visual",
    patches,
    rationale: [
      "Promote the structural wireframe into a real editable visual hierarchy.",
      "Resolve semantic component instances from the Component Registry.",
      "Apply shared typography, color, spacing, radius and elevation tokens.",
      "Convert implicit wireframe structure into deterministic stack/flex layout.",
      "Preserve node IDs, parent/child hierarchy, content and interaction metadata.",
      "Keep the transformation as a typed semantic patch so it is undoable/reversible.",
    ],
  };
}
