import { validateUIDocument } from "./validation.js";
import type {
  UICommand,
  UIDocument,
  UINode,
  NodeId,
  ReparentNodeCommand,
} from "./types.js";

export class UICommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UICommandError";
  }
}

const clone = <T>(value: T): T => structuredClone(value);

function touch(document: UIDocument): UIDocument {
  const now = new Date().toISOString();
  return {
    ...document,
    revision: {
      ...document.revision,
      revision: document.revision.revision + 1,
      updatedAt: now,
    },
  };
}

function siblings(document: UIDocument, node: UINode): UINode[] {
  return Object.values(document.nodes)
    .filter((candidate) => candidate.parentId === node.parentId && candidate.screenId === node.screenId)
    .sort((a, b) => {
      const ai = document.nodes[node.parentId ?? node.id]?.childrenIds.indexOf(a.id) ?? -1;
      const bi = document.nodes[node.parentId ?? node.id]?.childrenIds.indexOf(b.id) ?? -1;
      return ai - bi;
    });
}

function assertNode(document: UIDocument, nodeId: NodeId): UINode {
  const node = document.nodes[nodeId];
  if (!node) throw new UICommandError(`node not found: ${nodeId}`);
  return node;
}

function removeFromParent(document: UIDocument, node: UINode): void {
  if (node.parentId) {
    const parent = assertNode(document, node.parentId);
    parent.childrenIds = parent.childrenIds.filter((id) => id !== node.id);
  }
}

function insertIntoParent(document: UIDocument, nodeId: NodeId, parentId: NodeId | null, index: number): void {
  if (!parentId) return;
  const parent = assertNode(document, parentId);
  const next = parent.childrenIds.filter((id) => id !== nodeId);
  const safeIndex = Math.max(0, Math.min(index, next.length));
  next.splice(safeIndex, 0, nodeId);
  parent.childrenIds = next;
}

function applyReparent(document: UIDocument, command: ReparentNodeCommand): void {
  const node = assertNode(document, command.nodeId);
  if (command.newParentId === node.id) throw new UICommandError("node cannot be its own parent");
  if (command.newParentId && document.nodes[command.newParentId]?.childrenIds.includes(node.id)) {
    throw new UICommandError("reparent target already contains node");
  }
  let ancestor = command.newParentId;
  while (ancestor) {
    if (ancestor === node.id) throw new UICommandError("cannot reparent node into its descendant");
    ancestor = document.nodes[ancestor]?.parentId ?? null;
  }
  removeFromParent(document, node);
  node.parentId = command.newParentId;
  insertIntoParent(document, node.id, command.newParentId, command.toIndex);
}

export function applyCommand(input: UIDocument, command: UICommand): UIDocument {
  const document = clone(input);
  validateUIDocument(document);

  switch (command.type) {
    case "CreateNode": {
      if (document.nodes[command.node.id]) throw new UICommandError(`node already exists: ${command.node.id}`);
      if (command.node.parentId && !document.nodes[command.node.parentId]) {
        throw new UICommandError(`parent not found: ${command.node.parentId}`);
      }
      document.nodes[command.node.id] = clone(command.node);
      const screen = document.screens.find((candidate) => candidate.id === command.node.screenId);
      if (!screen) throw new UICommandError(`screen not found: ${command.node.screenId}`);
      screen.nodeIds.push(command.node.id);
      insertIntoParent(document, command.node.id, command.node.parentId, screen.nodeIds.length);
      break;
    }
    case "UpdateNode": {
      const node = assertNode(document, command.nodeId);
      const next = { ...node, ...clone(command.patch), id: node.id, screenId: node.screenId };
      document.nodes[node.id] = next;
      break;
    }
    case "DeleteNode": {
      const node = assertNode(document, command.nodeId);
      if (document.screens.some((screen) => screen.rootNodeId === node.id)) {
        throw new UICommandError("cannot delete a screen root");
      }
      const ids = command.recursive ? collectDescendants(document, node.id) : [node.id];
      for (const id of ids) {
        const candidate = assertNode(document, id);
        removeFromParent(document, candidate);
        delete document.nodes[id];
        const screen = document.screens.find((s) => s.id === candidate.screenId);
        if (screen) screen.nodeIds = screen.nodeIds.filter((nodeId) => nodeId !== id);
      }
      break;
    }
    case "MoveNode": {
      const node = assertNode(document, command.nodeId);
      if (!node.parentId) throw new UICommandError("root nodes cannot be moved");
      const parent = assertNode(document, node.parentId);
      const current = parent.childrenIds.filter((id) => id !== node.id);
      const index = Math.max(0, Math.min(command.toIndex, current.length));
      current.splice(index, 0, node.id);
      parent.childrenIds = current;
      break;
    }
    case "ReparentNode":
      applyReparent(document, command);
      break;
    case "SetToken": {
      const node = assertNode(document, command.nodeId);
      node.style ??= {};
      node.style.tokens ??= {};
      node.style.tokens[command.slot] = command.token;
      break;
    }
    case "SetVariant": {
      const node = assertNode(document, command.nodeId);
      if (!node.component) throw new UICommandError("node has no component instance");
      node.component.variant = command.variant;
      break;
    }
    case "SetResponsiveRule": {
      const node = assertNode(document, command.nodeId);
      node.responsive ??= [];
      const existing = node.responsive.findIndex((rule) => rule.breakpoint === command.rule.breakpoint);
      if (existing >= 0) node.responsive[existing] = clone(command.rule);
      else node.responsive.push(clone(command.rule));
      break;
    }
    case "SetCodeMapping": {
      const node = assertNode(document, command.nodeId);
      (node as UINode & { codeMapping?: ReparentNodeCommand["nodeId"] }).codeMapping = undefined;
      (node as UINode & { codeMapping?: unknown }).codeMapping = clone(command.mapping);
      break;
    }
  }

  validateUIDocument(document);
  return touch(document);
}

function collectDescendants(document: UIDocument, rootId: NodeId): NodeId[] {
  const result: NodeId[] = [];
  const visit = (id: NodeId) => {
    result.push(id);
    for (const childId of document.nodes[id]?.childrenIds ?? []) visit(childId);
  };
  visit(rootId);
  return result.reverse();
}

export function applyCommands(input: UIDocument, commands: UICommand[]): UIDocument {
  return commands.reduce(applyCommand, input);
}
