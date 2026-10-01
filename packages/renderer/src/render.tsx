import { componentRegistry } from "@uiforge/component-registry";
import { resolveResponsive } from "@uiforge/responsive";
import type { UIDocument, UINode } from "@uiforge/ui-schema";
import React, { type CSSProperties, type ReactNode } from "react";
import { validateRendererGraph } from "./diagnostics";
import { defaultRegistry, resolveRendererBinding } from "./registry";
import { tokenStyles } from "./token-style";
import type {
  PreviewState,
  RendererComponentRegistry,
  RendererContext,
  RendererDiagnostic,
  Viewport,
} from "./types";

export interface RendererOptions {
  registry?: RendererComponentRegistry;
  fixture?: RendererContext["fixture"];
  viewport: Viewport;
  preview?: PreviewState;
}

function nodeChildren(document: UIDocument, node: UINode): UINode[] {
  return node.childrenIds
    .map((id) => document.nodes[id])
    .filter((item): item is UINode => Boolean(item));
}

function layoutStyle(node: UINode, context: RendererContext): CSSProperties {
  const style: CSSProperties = {
    display: node.layout.mode === "absolute" ? "block" : "flex",
    flexDirection: node.layout.direction ?? "column",
    alignItems: node.layout.align,
    justifyContent: node.layout.justify,
  };

  const gap = node.layout.gap?.token
    ? tokenStyles(
        { gap: node.layout.gap.token },
        context.tokens,
        context.diagnostics,
        node.id,
      ).gap
    : undefined;
  const padding = node.layout.padding?.block?.token
    ? tokenStyles(
        { padding: node.layout.padding.block.token },
        context.tokens,
        context.diagnostics,
        node.id,
      ).padding
    : undefined;

  if (gap !== undefined) style.gap = gap;
  if (padding !== undefined) style.padding = padding;

  if (node.layout.mode === "grid") {
    style.display = "grid";
    style.gridTemplateColumns = node.layout.columns
      ? `repeat(${node.layout.columns}, minmax(0, 1fr))`
      : undefined;
  }

  if (node.editor?.width) style.width = node.editor.width;
  if (node.editor?.height) style.minHeight = node.editor.height;

  return style;
}

function diagnosticsForNode(node: UINode, context: RendererContext): void {
  const containerTypes = [
    "screen-root",
    "section",
    "list",
    "list-item",
    "card",
    "icon",
    "radio",
    "dialog-trigger",
  ];

  if (
    node.component?.registryId &&
    !componentRegistry.components[node.component.registryId]
  ) {
    context.diagnostics.push({
      code: "UNKNOWN_COMPONENT",
      severity: "warning",
      nodeId: node.id,
      screenId: node.screenId,
      message: `Unknown component registry ID ${node.component.registryId}`,
    });
  }

  const bindingId = resolveRendererBinding(node.component?.registryId);

  if (node.type === "custom" && !node.component?.registryId) {
    context.diagnostics.push({
      code: "UNSUPPORTED_NODE",
      severity: "warning",
      nodeId: node.id,
      screenId: node.screenId,
      message: "No component registry binding for custom node",
    });
  } else if (
    !defaultRegistry[bindingId ?? node.type] &&
    !containerTypes.includes(node.type)
  ) {
    context.diagnostics.push({
      code: "UNSUPPORTED_NODE",
      severity: "warning",
      nodeId: node.id,
      screenId: node.screenId,
      message: `No renderer binding for semantic node type ${node.type}`,
    });
  }

  if (node.interaction?.targetScreenId) {
    context.diagnostics.push({
      code: "INVALID_TRANSITION",
      severity: "warning",
      nodeId: node.id,
      screenId: node.screenId,
      message: `Preview transition → ${node.interaction.targetScreenId}`,
    });
  }
}

function renderNode(
  node: UINode,
  context: RendererContext,
  registry: RendererComponentRegistry,
  responsiveNodes: ReturnType<typeof resolveResponsive>["nodes"],
): ReactNode {
  const resolved = responsiveNodes[node.id];

  if (resolved && !resolved.visible) return null;

  const effectiveNode: UINode = resolved
    ? {
        ...node,
        layout: {
          ...node.layout,
          ...(resolved.layout ?? {}),
        },
        style: {
          ...node.style,
          tokens: {
            ...(node.style?.tokens ?? {}),
            ...resolved.tokenOverrides,
          },
        },
        component: node.component
          ? {
              ...node.component,
              variant: resolved.variant ?? node.component.variant,
            }
          : node.component,
        interaction: node.interaction
          ? {
              ...node.interaction,
              targetScreenId:
                resolved.interaction?.targetScreenId ??
                node.interaction.targetScreenId,
              targetNodeId:
                resolved.interaction?.targetNodeId ??
                node.interaction.targetNodeId,
            }
          : node.interaction,
      }
    : node;

  diagnosticsForNode(effectiveNode, context);

  const children = nodeChildren(context.document, effectiveNode);
  const bindingId = resolveRendererBinding(effectiveNode.component?.registryId);
  const semantic = registry[bindingId ?? effectiveNode.type];

  const containerStyle: CSSProperties = {};
  if (resolved?.container?.maxWidth !== undefined) {
    containerStyle.maxWidth = resolved.container.maxWidth;
  }
  if (resolved?.container?.gutterToken) {
    const gutter = tokenStyles(
      { padding: resolved.container.gutterToken },
      context.tokens,
      context.diagnostics,
      effectiveNode.id,
    ).padding;
    if (gutter !== undefined) containerStyle.paddingInline = gutter;
  }
  if (resolved?.typography?.token) {
    const typography = tokenStyles(
      { fontSize: resolved.typography.token },
      context.tokens,
      context.diagnostics,
      effectiveNode.id,
    ).fontSize;
    if (typography !== undefined) containerStyle.fontSize = typography;
  }

  const style = {
    ...layoutStyle(effectiveNode, context),
    ...containerStyle,
    ...tokenStyles(
      effectiveNode.style?.tokens,
      context.tokens,
      context.diagnostics,
      effectiveNode.id,
    ),
  };
  const dataProps = {
    "data-node-id": effectiveNode.id,
    "data-semantic-type": effectiveNode.type,
    ...(effectiveNode.component?.registryId
      ? { "data-component-id": effectiveNode.component.registryId }
      : {}),
    ...(effectiveNode.component?.variant
      ? { "data-component-variant": effectiveNode.component.variant }
      : {}),
  };

  if (
    effectiveNode.type === "screen-root" ||
    effectiveNode.type === "section" ||
    effectiveNode.type === "list" ||
    effectiveNode.type === "list-item" ||
    effectiveNode.type === "card"
  ) {
    return (
      <section {...dataProps} style={style}>
        {children.map((child) => (
          <React.Fragment key={child.id}>
            {renderNode(child, context, registry, responsiveNodes)}
          </React.Fragment>
        ))}
      </section>
    );
  }

  if (effectiveNode.type === "icon") {
    return (
      <div
        role="img"
        aria-label={effectiveNode.accessibility?.accessibleName}
        {...dataProps}
        style={style}
      >
        ◆
      </div>
    );
  }

  if (semantic) {
    return (
      <div {...dataProps} style={style}>
        {semantic(effectiveNode, context)}
      </div>
    );
  }

  return (
    <div {...dataProps} data-unsupported="true" style={style}>
      Unsupported: {effectiveNode.type}
    </div>
  );
}

export function renderScreen(
  document: UIDocument,
  screenId: string,
  tokens: RendererContext["tokens"],
  options: RendererOptions,
): { element: ReactNode; diagnostics: RendererDiagnostic[] } {
  const diagnostics = validateRendererGraph(document);
  const responsive = resolveResponsive(document, options.viewport);

  for (const diagnostic of responsive.diagnostics) {
    diagnostics.push({
      code: "RESPONSIVE_ERROR",
      severity: diagnostic.severity,
      nodeId: diagnostic.nodeId,
      screenId: diagnostic.screenId,
      message: `[${diagnostic.code}] ${diagnostic.message}`,
    });
  }

  const screen = document.screens.find((item) => item.id === screenId);
  if (!screen) {
    return {
      element: <div role="alert">Screen not found: {screenId}</div>,
      diagnostics: [
        ...diagnostics,
        {
          code: "RENDER_ERROR",
          severity: "error",
          message: `Screen ${screenId} is not found`,
        },
      ],
    };
  }

  const context: RendererContext = {
    document,
    tokens,
    viewport: options.viewport,
    fixture: options.fixture,
    diagnostics,
  };
  const root = document.nodes[screen.rootNodeId];

  if (!root) {
    return {
      element: <div role="alert">Missing screen root</div>,
      diagnostics,
    };
  }

  return {
    element: (
      <div
        data-renderer-version="uiforge.renderer/v1"
        data-screen-id={screen.id}
        data-viewport={options.viewport.preset}
        style={{
          width: "100%",
          minHeight: options.viewport.height,
          overflow: "auto",
        }}
      >
        {renderNode(
          root,
          context,
          options.registry ?? defaultRegistry,
          responsive.nodes,
        )}
      </div>
    ),
    diagnostics,
  };
}
