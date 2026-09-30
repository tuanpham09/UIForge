// biome-ignore-all format: semantic registry implementation is maintained as a stable contract\nimport { componentRegistry } from "@uiforge/component-registry";
import type { UINode } from "@uiforge/ui-schema";
import React, { type ReactNode } from "react";
import type { RendererComponentRegistry, RendererContext } from "./types";

void React;

function text(node: UINode): ReactNode {
  return node.content?.text ?? node.content?.label ?? "";
}

function generic(node: UINode): ReactNode {
  return <span data-node-id={node.id}>{text(node)}</span>;
}

function button(node: UINode, context: RendererContext): ReactNode {
  return (
    <button
      type="button"
      aria-label={node.accessibility?.accessibleName ?? node.content?.label}
      data-node-id={node.id}
      onClick={() =>
        context.diagnostics.push({
          code: "RENDER_ERROR",
          severity: "warning",
          nodeId: node.id,
          message:
            "Preview interaction is represented by diagnostics, not application navigation.",
        })
      }
    >
      {text(node)}
    </button>
  );
}

function input(node: UINode): ReactNode {
  return (
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
  );
}

function link(node: UINode): ReactNode {
  return (
    <a
      href={
        node.interaction?.targetScreenId
          ? "#screen-" + node.interaction.targetScreenId
          : "#"
      }
      data-node-id={node.id}
    >
      {text(node)}
    </a>
  );
}

function image(node: UINode): ReactNode {
  return (
    <img
      data-node-id={node.id}
      src={node.content?.src ?? "about:blank"}
      alt={node.content?.alt ?? ""}
    />
  );
}

function checkbox(node: UINode): ReactNode {
  return (
    <label data-node-id={node.id}>
      <input type="checkbox" />
      {text(node)}
    </label>
  );
}

function select(node: UINode): ReactNode {
  return (
    <label data-node-id={node.id}>
      <span>{node.content?.label}</span>
      <select
        aria-label={node.accessibility?.accessibleName ?? node.content?.label}
      >
        <option>{node.content?.value ?? "Select"}</option>
      </select>
    </label>
  );
}

function dialog(node: UINode): ReactNode {
  return (
    <div
      role="dialog"
      data-node-id={node.id}
      aria-label={node.accessibility?.accessibleName}
    >
      {text(node)}
    </div>
  );
}

function table(node: UINode): ReactNode {
  return (
    <div role="table" data-node-id={node.id}>
      {text(node)}
    </div>
  );
}

function list(node: UINode): ReactNode {
  return <ul data-node-id={node.id}>{text(node)}</ul>;
}

export function resolveRendererBinding(
  registryId?: string,
): string | undefined {
  if (!registryId) {
    return undefined;
  }
  return componentRegistry.components[registryId]?.renderer.bindingId;
}

export const defaultRegistry: RendererComponentRegistry = {
  text: generic,
  label: generic,
  button,
  input,
  link,
  image,
  avatar: image,
  badge: generic,
  alert: generic,
  card: generic,
  dialog,
  tabs: generic,
  table,
  list,
  navigation: generic,
  sidebar: generic,
  header: generic,
  form: generic,
  "empty-state": generic,
  checkbox,
  select,
};
