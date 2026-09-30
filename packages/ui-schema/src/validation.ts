import {
  UI_SCHEMA_VERSION,
  type NodeId,
  type UIDocument,
  type UINode,
  type ScreenId,
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

export function assertSupportedSchemaVersion(value: unknown): asserts value is UIDocument {
  if (!isRecord(value) || value.schemaVersion !== UI_SCHEMA_VERSION) {
    throw new UISchemaValidationError([
      `unsupported schema version: ${isRecord(value) ? String(value.schemaVersion) : "unknown"}`,
    ]);
  }
}

export function validateUIDocument(value: unknown): UIDocument {
  const issues: string[] = [];
  if (!isRecord(value)) throw new UISchemaValidationError(["document must be an object"]);
  if (value.schemaVersion !== UI_SCHEMA_VERSION) {
    issues.push(`unsupported schema version: ${String(value.schemaVersion)}`);
  }
  if (!hasId(value)) issues.push("document.id is required");
  if (!isRecord(value.metadata) || !isNonEmptyString(value.metadata.name)) {
    issues.push("document.metadata.name is required");
  }
  if (!isRecord(value.revision) || typeof value.revision.revision !== "number") {
    issues.push("document.revision.revision is required");
  }
  if (!Array.isArray(value.screens) || value.screens.length === 0) {
    issues.push("document.screens must contain at least one screen");
  }
  if (!isRecord(value.nodes)) issues.push("document.nodes must be an object");
  if (!isRecord(value.assets)) issues.push("document.assets must be an object");

  if (issues.length > 0) throw new UISchemaValidationError(issues);

  const nodes = value.nodes as Record<string, unknown>;
  const screens = value.screens as unknown[];

  for (const [key, node] of Object.entries(nodes)) {
    if (key !== (node as { id?: string })?.id) issues.push(`node key/id mismatch: ${key}`);
    if (!isNode(node)) {
      issues.push(`invalid node: ${key}`);
      continue;
    }
    if (!screens.some((screen) => isRecord(screen) && screen.id === node.screenId)) {
      issues.push(`node ${key} references missing screen ${node.screenId}`);
    }
    for (const childId of node.childrenIds) {
      const child = nodes[childId];
      if (!child) issues.push(`node ${key} references missing child ${childId}`);
      else if ((child as { parentId?: string | null }).parentId !== node.id) {
        issues.push(`child ${childId} does not point back to parent ${node.id}`);
      }
    }
    if (node.parentId !== null && !nodes[node.parentId]) {
      issues.push(`node ${key} references missing parent ${node.parentId}`);
    }
    if (node.interaction?.interactive) {
      if (!node.accessibility?.accessibleName && !["text","image"].includes(node.type)) {
        issues.push(`interactive node ${key} requires accessibility.accessibleName`);
      }
      if (node.interaction.targetNodeId && !nodes[node.interaction.targetNodeId]) {
        issues.push(`interactive node ${key} references missing target node`);
      }
    }
  }

  for (const screen of screens) {
    if (!isRecord(screen) || !isNonEmptyString(screen.id) || !isNonEmptyString(screen.name)) {
      issues.push("invalid screen");
      continue;
    }
    if (!isNonEmptyString(screen.rootNodeId) || !nodes[screen.rootNodeId]) {
      issues.push(`screen ${screen.id} has invalid rootNodeId`);
    }
    if (!Array.isArray(screen.nodeIds)) issues.push(`screen ${screen.id} nodeIds must be an array`);
    else {
      for (const nodeId of screen.nodeIds) {
        if (!nodes[nodeId]) issues.push(`screen ${screen.id} references missing node ${nodeId}`);
        else if ((nodes[nodeId] as { screenId?: string }).screenId !== screen.id) {
          issues.push(`node ${nodeId} belongs to another screen`);
        }
      }
    }
  }

  const screenIds = screens.map((screen) => (screen as { id: ScreenId }).id);
  if (new Set(screenIds).size !== screenIds.length) issues.push("screen IDs must be unique");
  const nodeIds = Object.keys(nodes) as NodeId[];
  if (new Set(nodeIds).size !== nodeIds.length) issues.push("node IDs must be unique");

  if (issues.length > 0) throw new UISchemaValidationError(issues);
  return value as unknown as UIDocument;
}
