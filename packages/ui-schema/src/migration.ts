import { UISchemaValidationError, validateUIDocument } from "./validation.js";
import { UI_SCHEMA_VERSION, type SchemaMigration, type UIDocument } from "./types.js";

export function migrateToCurrent(
  document: unknown,
  migrations: readonly SchemaMigration[],
): UIDocument {
  const version =
    typeof document === "object" &&
    document !== null &&
    "schemaVersion" in document
      ? String((document as { schemaVersion?: unknown }).schemaVersion)
      : "unknown";

  if (version === UI_SCHEMA_VERSION) {
    return validateUIDocument(document);
  }

  let current: unknown = document;
  let currentVersion = version;
  const seen = new Set<string>();

  while (currentVersion !== UI_SCHEMA_VERSION) {
    if (seen.has(currentVersion)) {
      throw new UISchemaValidationError(["migration cycle detected"]);
    }

    seen.add(currentVersion);
    const migration = migrations.find((candidate) => candidate.from === currentVersion);
    if (!migration) {
      throw new UISchemaValidationError([
        `no migration registered from ${currentVersion} to ${UI_SCHEMA_VERSION}`,
      ]);
    }

    current = migration.migrate(current, {
      from: currentVersion,
      to: migration.to,
    });
    currentVersion = migration.to;
  }

  return validateUIDocument(current);
}
