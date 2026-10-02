import type {
  Frame,
  NodeId,
  ReparentNodeCommand,
  UICommand,
  UIDocument,
  UINode,
} from "./types";
import { validateUIDocument } from "./validation";

export class UICommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UICommandError";
  }
}

const clone = <T>(value: T): T => structuredClone(value);

function touch(document: UIDocument): UIDocument {
  return {
    ...document,
    revision: {
      ...document.revision,
      revision: document.revision.revision + 1,
    },
  };
}

function assertNode(document: UIDocument, nodeId: NodeId): UINode {
  const node = document.nodes[nodeId];
  if (!node) {
    throw new UICommandError(`node not found: ${nodeId}`);
  }
  return node;
}

function assertParent(
  document: UIDocument,
  node: UINode,
  parentId: NodeId | null,
): UINode {
  if (!parentId) {
    throw new UICommandError("non-root nodes must have a parent");
  }
  const parent = assertNode(document, parentId);
  if (parent.screenId !== node.screenId) {
    throw new UICommandError("parent must belong to the same screen");
  }
  return parent;
}

function removeFromParent(document: UIDocument, node: UINode): void {
  if (node.parentId) {
    const parent = assertNode(document, node.parentId);
    parent.childrenIds = parent.childrenIds.filter((id) => id !== node.id);
  }
}

function insertIntoParent(
  document: UIDocument,
  nodeId: NodeId,
  parentId: NodeId,
  index: number,
): void {
  const parent = assertNode(document, parentId);
  const next = parent.childrenIds.filter((id) => id !== nodeId);
  const safeIndex = Math.max(0, Math.min(index, next.length));
  next.splice(safeIndex, 0, nodeId);
  parent.childrenIds = next;
}

function applyReparent(
  document: UIDocument,
  command: ReparentNodeCommand,
): void {
  const node = assertNode(document, command.nodeId);
  if (document.screens.some((screen) => screen.rootNodeId === node.id)) {
    throw new UICommandError("screen roots cannot be reparented");
  }
  if (command.newParentId === node.id) {
    throw new UICommandError("node cannot be its own parent");
  }

  let ancestor = command.newParentId;
  while (ancestor) {
    if (ancestor === node.id) {
      throw new UICommandError("cannot reparent node into its descendant");
    }
    ancestor = document.nodes[ancestor]?.parentId ?? null;
  }

  if (command.newParentId) {
    assertParent(document, node, command.newParentId);
  }
  removeFromParent(document, node);
  node.parentId = command.newParentId;
  if (command.newParentId) {
    insertIntoParent(document, node.id, command.newParentId, command.toIndex);
  }
}

export function applyCommand(
  input: UIDocument,
  command: UICommand,
): UIDocument {
  const document = clone(input);
  validateUIDocument(document);

  switch (command.type) {
    case "CreateFrame": {
      const frames = document.frames ?? [];
      if (frames.some((frame) => frame.id === command.frame.id)) {
        throw new UICommandError(`frame already exists: ${command.frame.id}`);
      }
      if (
        !document.screens.some((screen) => screen.id === command.frame.screenId)
      ) {
        throw new UICommandError(`screen not found: ${command.frame.screenId}`);
      }
      if (command.frame.width <= 0 || command.frame.height <= 0) {
        throw new UICommandError("frame dimensions must be positive");
      }
      document.frames = [...frames, clone(command.frame)];
      break;
    }
    case "UpdateFrame": {
      const frames = document.frames ?? [];
      const index = frames.findIndex((frame) => frame.id === command.frameId);
      if (index < 0) {
        throw new UICommandError(`frame not found: ${command.frameId}`);
      }
      const current = frames[index];
      if (!current) {
        throw new UICommandError(`frame not found: ${command.frameId}`);
      }
      const next: Frame = {
        ...current,
        ...clone(command.patch),
        id: current.id,
      };
      if (next.width <= 0 || next.height <= 0) {
        throw new UICommandError("frame dimensions must be positive");
      }
      frames[index] = next;
      document.frames = frames;
      break;
    }
    case "DeleteFrame": {
      const frames = document.frames ?? [];
      if (!frames.some((frame) => frame.id === command.frameId)) {
        throw new UICommandError(`frame not found: ${command.frameId}`);
      }
      document.frames = frames.filter((frame) => frame.id !== command.frameId);
      break;
    }
    case "CreateNode": {
      if (document.nodes[command.node.id]) {
        throw new UICommandError(`node already exists: ${command.node.id}`);
      }
      if (command.node.type === "screen-root") {
        throw new UICommandError("screen roots are created with screens");
      }
      if (!command.node.parentId) {
        throw new UICommandError("created nodes require a parent");
      }
      assertParent(document, command.node, command.node.parentId);

      const screen = document.screens.find(
        (candidate) => candidate.id === command.node.screenId,
      );
      if (!screen) {
        throw new UICommandError(`screen not found: ${command.node.screenId}`);
      }

      document.nodes[command.node.id] = clone(command.node);
      screen.nodeIds.push(command.node.id);
      insertIntoParent(
        document,
        command.node.id,
        command.node.parentId,
        Number.MAX_SAFE_INTEGER,
      );
      break;
    }
    case "UpdateNode": {
      const node = assertNode(document, command.nodeId);
      const next = {
        ...node,
        ...clone(command.patch),
        id: node.id,
        screenId: node.screenId,
      };
      document.nodes[node.id] = next;
      break;
    }
    case "DeleteNode": {
      const node = assertNode(document, command.nodeId);
      if (document.screens.some((screen) => screen.rootNodeId === node.id)) {
        throw new UICommandError("cannot delete a screen root");
      }
      if (node.childrenIds.length > 0 && !command.recursive) {
        throw new UICommandError("node has children; use recursive delete");
      }

      const ids = command.recursive
        ? collectDescendants(document, node.id)
        : [node.id];
      for (const id of ids) {
        const candidate = assertNode(document, id);
        removeFromParent(document, candidate);
        delete document.nodes[id];
        const screen = document.screens.find(
          (screen) => screen.id === candidate.screenId,
        );
        if (screen) {
          screen.nodeIds = screen.nodeIds.filter((nodeId) => nodeId !== id);
        }
      }
      break;
    }
    case "MoveNode": {
      const node = assertNode(document, command.nodeId);
      if (!node.parentId) {
        throw new UICommandError("root nodes cannot be moved");
      }
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
      if (!node.component) {
        throw new UICommandError("node has no component instance");
      }
      node.component.variant = command.variant;
      break;
    }
    case "SetResponsiveRule": {
      const node = assertNode(document, command.nodeId);
      node.responsive ??= [];
      const existing = node.responsive.findIndex(
        (rule) => rule.breakpoint === command.rule.breakpoint,
      );
      if (existing >= 0) {
        node.responsive[existing] = clone(command.rule);
      } else {
        node.responsive.push(clone(command.rule));
      }
      break;
    }
    case "SetCodeMapping": {
      const node = assertNode(document, command.nodeId);
      node.codeMapping = clone(command.mapping);
      break;
    }
    case "ApplyVisualDesign": {
      for (const patch of command.patches) {
        const node = assertNode(document, patch.nodeId);
        if (patch.style) node.style = clone(patch.style);
        if (patch.component) node.component = clone(patch.component);
        if (patch.layout) node.layout = clone(patch.layout);
        if (patch.editor) node.editor = clone(patch.editor);
      }
      document.metadata = {
        ...document.metadata,
        designStage: command.stage ?? "visual",
      };
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
    for (const childId of document.nodes[id]?.childrenIds ?? []) {
      visit(childId);
    }
  };

  visit(rootId);
  return result.reverse();
}

export function applyCommands(
  input: UIDocument,
  commands: readonly UICommand[],
): UIDocument {
  return commands.reduce(applyCommand, input);
}
