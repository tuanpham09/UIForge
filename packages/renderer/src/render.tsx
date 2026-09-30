// biome-ignore-all format: semantic registry implementation is maintained as a stable contract\nimport { componentRegistry } from "@uiforge/component-registry";
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

  if (gap !== undefined) {
    style.gap = gap;
  }
  if (padding !== undefined) {
    style.padding = padding;
  }

  if (node.layout.mode === "grid") {
    style.display = "grid";
    style.gridTemplateColumns = node.layout.columns
      ? "repeat(" + node.layout.columns + ", minmax(0, 1fr))"
      : undefined;
  }

  if (node.editor?.width) {
    style.width = node.editor.width;
  }
  if (node.editor?.height) {
    style.minHeight = node.editor.height;
  }

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
      message:
        "Unknown component registry ID " + node.component.registryId,
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
      message:
        "No renderer binding for semantic node type " + node.type,
    });
  }

  if (node.interaction?.targetScreenId) {
    context.diagnostics.push({
      code: "INVALID_TRANSITION",
      severity: "warning",
      nodeId: node.id,
      screenId: node.screenId,
      message:
        "Preview transition → " + node.interaction.targetScreenId,
    });
  }
}

function renderNode(
  node: UINode,
  context: RendererContext,
  registry: RendererComponentRegistry,
): ReactNode {
  diagnosticsForNode(node, context);

  const children = nodeChildren(context.document, node);
  const bindingId = resolveRendererBinding(node.component?.registryId);
  const semantic = registry[bindingId ?? node.type];
  const style = {
    ...layoutStyle(node, context),
    ...tokenStyles(
      node.style?.tokens,
      context.tokens,
      context.diagnostics,
      node.id,
    ),
  };
  const dataProps = {
    "data-node-id": node.id,
    "data-semantic-type": node.type,
    ...(node.component?.registryId
      ? { "data-component-id": node.component.registryId }
      : {}),
    ...(node.component?.variant
      ? { "data-component-variant": node.component.variant }
      : {}),
  };

  if (
    node.type === "screen-root" ||
    node.type === "section" ||
    node.type === "list" ||
    node.type === "list-item" ||
    node.type === "card"
  ) {
    return (
      <section {...dataProps} style={style}>
        {children.map((child) => (
          <React.Fragment key={child.id}>
            {renderNode(child, context, registry)}
          </React.Fragment>
        ))}
      </section>
    );
  }

  if (node.type === "icon") {
    return (
      <div
        role="img"
        aria-label={node.accessibility?.accessibleName}
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
        {semantic(node, context)}
      </div>
    );
  }

  return (
    <div
      {...dataProps}
      data-unsupported="true"
      style={style}
    >
      Unsupported: {node.type}
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
  const screen = document.screens.find((item) => item.id === screenId);

  if (!screen) {
    return {
      element: <div role="alert">Screen not found: {screenId}</div>,
      diagnostics: [
        ...diagnostics,
        {
          code: "RENDER_ERROR",
          severity: "error",
          message: "Screen " + screenId + " is not found",
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
        {renderNode(root, context, options.registry ?? defaultRegistry)}
      </div>
    ),
    diagnostics,
  };
}
