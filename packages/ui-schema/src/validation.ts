import {
  type NodeId,
  UI_SCHEMA_VERSION,
  type UIDocument,
  type UINode,
} from "./types";

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

const hasId = (
  value: unknown,
): value is Record<string, unknown> & { id: string } =>
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

  const frames = Array.isArray(value.frames) ? value.frames : [];
  const frameIds = frames.map((frame) => (frame as { id?: unknown })?.id);

  if (new Set(frameIds).size !== frameIds.length) {
    issues.push("frame IDs must be unique");
  }

  for (const frame of frames) {
    if (
      !isRecord(frame) ||
      !isNonEmptyString(frame.id) ||
      !isNonEmptyString(frame.screenId) ||
      !isNonEmptyString(frame.presetId) ||
      !isNonEmptyString(frame.name)
    ) {
      issues.push("invalid frame");
      continue;
    }

    if (!screenIds.includes(frame.screenId)) {
      issues.push(
        `frame ${frame.id} references missing screen ${frame.screenId}`,
      );
    }

    if (
      typeof frame.x !== "number" ||
      typeof frame.y !== "number" ||
      typeof frame.width !== "number" ||
      typeof frame.height !== "number" ||
      frame.width <= 0 ||
      frame.height <= 0
    ) {
      issues.push(`frame ${frame.id} has invalid geometry`);
    }

    if (!isNonEmptyString(frame.presetVersion)) {
      issues.push(`frame ${frame.id} is missing presetVersion`);
    }
  }
