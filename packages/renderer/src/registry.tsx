import type { UINode } from "@uiforge/ui-schema";
import type { ReactNode } from "react";
import type { RendererComponentRegistry, RendererContext } from "./types";

function text(node: UINode): ReactNode {
  return node.content?.text ?? node.content?.label ?? "";
}

function button(node: UINode, context: RendererContext): ReactNode {
  return (
    <button
      type="button"
      aria-label={
        node.accessibility?.accessibleName ?? node.content?.label
      }
      data-node-id={node.id}
      onClick={() =>
        context.diagnostics.push({
          code: "RENDER_ERROR",
          severity: "warning",
          nodeId: node.id,
          message:
            "Preview interaction: transition is represented by diagnostics, not application navigation.",
        })
      }
    >
      {text(node)}
    </button>
  );
}

export const defaultRegistry: RendererComponentRegistry = {
  text: (node) => <span data-node-id={node.id}>{text(node)}</span>,
  button,
  link: (node) => (
    <a
      href={
        node.interaction?.targetScreenId
          ? `#screen-${node.interaction.targetScreenId}`
          : "#"
      }
      data-node-id={node.id}
    >
      {text(node)}
    </a>
  ),
  input: (node) => (
    <label data-node-id={node.id}>
      <span>{node.content?.label}</span>
      <input
        aria-label={
          node.accessibility?.accessibleName ?? node.content?.label
        }
        placeholder={node.content?.placeholder}
        defaultValue={node.content?.value}
      />
    </label>
  ),
  image: (node) => (
    <img
      data-node-id={node.id}
      src={node.content?.src ?? "about:blank"}
      alt={node.content?.alt ?? ""}
    />
  ),
  checkbox: (node) => (
    <label data-node-id={node.id}>
      <input type="checkbox" />
      {text(node)}
    </label>
  ),
  select: (node) => (
    <label data-node-id={node.id}>
      <span>{node.content?.label}</span>
      <select
        aria-label={
          node.accessibility?.accessibleName ?? node.content?.label
        }
      >
        <option>{node.content?.value ?? "Select"}</option>
      </select>
    </label>
  ),
};
