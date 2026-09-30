import type { UIDocument, UINode } from "@uiforge/ui-schema";
import type { CSSProperties, ReactNode } from "react";
import { validateRendererGraph } from "./diagnostics";
import { defaultRegistry } from "./registry";
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

  const padding = tokenStyles(
    { padding: node.layout.padding?.block?.token },
    context.tokens,
    context.diagnostics,
    node.id,
  ).padding;

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
    node.type === "custom" ||
    (!defaultRegistry[node.type] && !containerTypes.includes(node.type))
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
): ReactNode {
  diagnosticsForNode(node, context);

  const children = nodeChildren(context.document, node);
  const semantic = registry[node.component?.registryId ?? node.type];
  const style = {
    ...layoutStyle(node, context),
    ...tokenStyles(
      node.style?.tokens,
      context.tokens,
      context.diagnostics,
      node.id,
    ),
  };

  if (
    node.type === "screen-root" ||
    node.type === "section" ||
    node.type === "list" ||
    node.type === "list-item" ||
    node.type === "card"
  ) {
    return (
      <section
        data-node-id={node.id}
        data-semantic-type={node.type}
        style={style}
      >
        {children.map((child) => renderNode(child, context, registry))}
      </section>
    );
  }

  if (node.type === "icon") {
    return (
      <div
        role="img"
        aria-label={node.accessibility?.accessibleName}
        data-node-id={node.id}
        style={style}
      >
        ◆
      </div>
    );
  }

  if (semantic) {
    return (
      <div data-node-id={node.id} data-semantic-type={node.type} style={style}>
        {semantic(node, context)}
      </div>
    );
  }

  return (
    <div
      data-node-id={node.id}
      data-semantic-type={node.type}
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
        {renderNode(root, context, options.registry ?? defaultRegistry)}
      </div>
    ),
    diagnostics,
  };
}
