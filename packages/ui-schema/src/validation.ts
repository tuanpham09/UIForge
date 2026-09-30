import {
  type NodeId,
  UI_SCHEMA_VERSION,
  type UIDocument,
  type UINode,
} from "./types.js";

export class UISchemaValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`UI Schema validation failed: ${issues.join("; ")}`);
    this.name = "UISchemaValidationError";
  }
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasId = (value: unknown): value is { id: string } =>
  isRecord(value) && isNonEmptyString(value.id);

export function isNode(value: unknown): value is UINode {
  if (!isRecord(value) || !hasId(value)) return false;
  return (
    isNonEmptyString(value.screenId) &&
    isNonEmptyString(value.type) &&
    isRecord(value.layout) &&
    isNonEmptyString(value.layout.mode) &&
    (value.parentId === null || isNonEmptyString(value.parentId)) &&
    Array.isArray(value.childrenIds) &&
    value.childrenIds.every(isNonEmptyString)
  );
}

export function assertSupportedSchemaVersion(
  value: unknown,
): asserts value is UIDocument {
  if (!isRecord(value) || value.schemaVersion !== UI_SCHEMA_VERSION) {
    throw new UISchemaValidationError([
      `unsupported schema version: ${isRecord(value) ? String(value.schemaVersion) : "unknown"}`,
    ]);
  }
}

export function validateUIDocument(value: unknown): UIDocument {
  const issues: string[] = [];
  if (!isRecord(value)) {
    throw new UISchemaValidationError(["document must be an object"]);
  }
  if (value.schemaVersion !== UI_SCHEMA_VERSION) {
    issues.push(`unsupported schema version: ${String(value.schemaVersion)}`);
  }
  if (!hasId(value)) {
    issues.push("document.id is required");
  }
  if (!isRecord(value.metadata) || !isNonEmptyString(value.metadata.name)) {
    issues.push("document.metadata.name is required");
  }
  if (
    !isRecord(value.revision) ||
    typeof value.revision.revision !== "number"
  ) {
    issues.push("document.revision.revision is required");
  }
  if (!Array.isArray(value.screens) || value.screens.length === 0) {
    issues.push("document.screens must contain at least one screen");
  }
  if (!isRecord(value.nodes)) {
    issues.push("document.nodes must be an object");
  }
  if (!isRecord(value.assets)) {
    issues.push("document.assets must be an object");
  }

  if (issues.length > 0) {
    throw new UISchemaValidationError(issues);
  }

  const nodes = value.nodes as Record<string, unknown>;
  const screens = value.screens as unknown[];
  const screenIds = screens.map((screen) => (screen as { id?: unknown })?.id);

  if (new Set(screenIds).size !== screenIds.length) {
    issues.push("screen IDs must be unique");
  }

  for (const [key, node] of Object.entries(nodes)) {
    if (key !== (node as { id?: string })?.id) {
      issues.push(`node key/id mismatch: ${key}`);
    }
    if (!isNode(node)) {
      issues.push(`invalid node: ${key}`);
      continue;
    }
    if (!screenIds.includes(node.screenId)) {
      issues.push(`node ${key} references missing screen ${node.screenId}`);
    }
    if (new Set(node.childrenIds).size !== node.childrenIds.length) {
      issues.push(`node ${key} contains duplicate child IDs`);
    }

    for (const childId of node.childrenIds) {
      const child = nodes[childId];
      if (!child) {
        issues.push(`node ${key} references missing child ${childId}`);
      } else if ((child as { parentId?: string | null }).parentId !== node.id) {
        issues.push(
          `child ${childId} does not point back to parent ${node.id}`,
        );
      } else if ((child as { screenId?: string }).screenId !== node.screenId) {
        issues.push(`child ${childId} belongs to another screen`);
      }
    }

    if (node.parentId !== null) {
      const parent = nodes[node.parentId];
      if (!parent) {
        issues.push(`node ${key} references missing parent ${node.parentId}`);
      } else {
        if (!(parent as UINode).childrenIds.includes(node.id)) {
          issues.push(
            `parent ${node.parentId} does not contain child ${node.id}`,
          );
        }
        if ((parent as UINode).screenId !== node.screenId) {
          issues.push(`parent ${node.parentId} belongs to another screen`);
        }
      }
    }

    if (node.interaction?.interactive) {
      if (
        !node.accessibility?.accessibleName &&
        !["text", "image"].includes(node.type)
      ) {
        issues.push(
          `interactive node ${key} requires accessibility.accessibleName`,
        );
      }
      if (
        node.interaction.targetNodeId &&
        !nodes[node.interaction.targetNodeId]
      ) {
        issues.push(`interactive node ${key} references missing target node`);
      }
    }
  }

  for (const screen of screens) {
    if (
      !isRecord(screen) ||
      !isNonEmptyString(screen.id) ||
      !isNonEmptyString(screen.name)
    ) {
      issues.push("invalid screen");
      continue;
    }

    if (!isNonEmptyString(screen.rootNodeId) || !nodes[screen.rootNodeId]) {
      issues.push(`screen ${screen.id} has invalid rootNodeId`);
    } else {
      const root = nodes[screen.rootNodeId] as UINode;
      if (root.type !== "screen-root") {
        issues.push(`screen ${screen.id} root must be a screen-root node`);
      }
      if (root.parentId !== null) {
        issues.push(`screen ${screen.id} root must not have a parent`);
      }
    }

    if (!Array.isArray(screen.nodeIds)) {
      issues.push(`screen ${screen.id} nodeIds must be an array`);
    } else {
      if (new Set(screen.nodeIds).size !== screen.nodeIds.length) {
        issues.push(`screen ${screen.id} contains duplicate node IDs`);
      }
      for (const nodeId of screen.nodeIds) {
        const node = nodes[nodeId];
        if (!node) {
          issues.push(`screen ${screen.id} references missing node ${nodeId}`);
        } else if ((node as UINode).screenId !== screen.id) {
          issues.push(`node ${nodeId} belongs to another screen`);
        }
      }
    }
  }

  const nodeIds = Object.keys(nodes) as NodeId[];
  if (new Set(nodeIds).size !== nodeIds.length) {
    issues.push("node IDs must be unique");
  }

  const screenMembership = new Map<string, number>();
  for (const screen of screens) {
    if (!isRecord(screen) || !Array.isArray(screen.nodeIds)) continue;
    for (const nodeId of screen.nodeIds) {
      screenMembership.set(
        String(nodeId),
        (screenMembership.get(String(nodeId)) ?? 0) + 1,
      );
    }
  }

  for (const nodeId of nodeIds) {
    if ((screenMembership.get(nodeId) ?? 0) !== 1) {
      issues.push(`node ${nodeId} must belong to exactly one screen`);
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (nodeId: string) => {
    if (visiting.has(nodeId)) {
      issues.push(`node hierarchy cycle detected at ${nodeId}`);
      return;
    }
    if (visited.has(nodeId)) return;

    visiting.add(nodeId);
    const node = nodes[nodeId] as UINode | undefined;
    for (const childId of node?.childrenIds ?? []) {
      visit(String(childId));
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  for (const nodeId of nodeIds) {
    visit(nodeId);
  }

  if (issues.length > 0) {
    throw new UISchemaValidationError(issues);
  }
  return value as unknown as UIDocument;
}
