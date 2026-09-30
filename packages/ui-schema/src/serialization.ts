import type { UIDocument } from "./types.js";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) sorted[key] = canonicalize((value as Record<string, unknown>)[key]);
    return sorted;
  }
  return value;
}

export function serializeUIDocument(document: UIDocument): string {
  return JSON.stringify(canonicalize(document));
}

export function deserializeUIDocument(serialized: string): UIDocument {
  return JSON.parse(serialized) as UIDocument;
}
