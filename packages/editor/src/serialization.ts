import type { UIDocument } from "@uiforge/ui-schema";
import { serializeUIDocument } from "@uiforge/ui-schema";

export function serializeCanonical(document: UIDocument): string {
  return serializeUIDocument(document);
}

export function assertCanonicalPersistencePayload(
  document: UIDocument,
): string {
  const payload = serializeCanonical(document);
  if (payload.includes("tldraw") || payload.includes("TLShape")) {
    throw new Error(
      "canonical payload must not contain editor/provider records",
    );
  }
  return payload;
}
