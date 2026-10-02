import { componentRegistry } from "@uiforge/component-registry";
import { defaultTokenSet } from "@uiforge/design-tokens";
import type { ComponentInstance, NodeStyle, UIDocument, UINode } from "@uiforge/ui-schema";

export const VISUAL_DESIGN_CONTRACT_VERSION = "uiforge.visual-design/v1" as const;

export type VisualDesignPatch = {
  nodeId: string;
  style?: NodeStyle;
  component?: ComponentInstance;
};

export type VisualDesignProposal = {
  version: typeof VISUAL_DESIGN_CONTRACT_VERSION;
  sourceStage: "wireframe";
  targetStage: "visual";
  patches: VisualDesignPatch[];
  rationale: string[];
};

const token = (name: string) => {
  const exists = defaultTokenSet.semantic[name] ?? defaultTokenSet.primitives[name];
  if (!exists) throw new Error(`VISUAL_DESIGN_UNKNOWN_TOKEN:${name}`);
  return name;
};

const styleFor = (node: UINode): NodeStyle | undefined => {
  const tokens: Record<string, string> = {};
  switch (node.type) {
    case "screen-root":
      tokens.fill = token("color.background");
      tokens.typography = token("text.body");
      break;
    case "section":
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
  if (!registryId || !componentRegistry.components[registryId]) return node.component;
  const definition = componentRegistry.components[registryId];
  const preferredVariant =
    node.type === "button" ? "primary" :
    node.type === "card" ? "default" :
    "default";
  const variant = definition.variants.some((item) => item.id === preferredVariant)
    ? preferredVariant
    : definition.variants[0]?.id;
  return { registryId, ...(variant ? { variant } : {}) };
};

export function buildVisualDesignProposal(document: UIDocument): VisualDesignProposal {
  if ((document.metadata.designStage ?? "wireframe") !== "wireframe") {
    throw new Error("VISUAL_DESIGN_SOURCE_MUST_BE_WIREFRAME");
  }
  const patches = Object.values(document.nodes).map((node) => ({
    nodeId: node.id,
    style: styleFor(node),
    component: componentFor(node),
  }));
  return {
    version: VISUAL_DESIGN_CONTRACT_VERSION,
    sourceStage: "wireframe",
    targetStage: "visual",
    patches,
    rationale: [
      "Apply semantic design tokens instead of raw visual values.",
      "Resolve registered component variants where a semantic component exists.",
      "Preserve every node ID, hierarchy and interaction contract.",
      "Keep responsive rules unchanged; visual transformation is style-first.",
    ],
  };
}
