import type {
  CodeMappingSet,
  CodeMappingValidationIssue,
  CodeMappingValidationResult,
  ComponentRegistry,
} from "./types";

const importNamePattern = /^[a-zA-Z_][a-zA-Z0-9_./@-]*$/;
const exportNamePattern = /^[A-Z][A-Za-z0-9]*$/;

export function validateCodeMappings(
  mappings: CodeMappingSet,
  registry: ComponentRegistry,
): CodeMappingValidationResult {
  const issues: CodeMappingValidationIssue[] = [];
  const seen = new Set<string>();

  for (const mapping of Object.values(mappings.mappings)) {
    if (seen.has(mapping.mappingId)) {
      issues.push({
        code: "DUPLICATE_MAPPING_ID",
        path: mapping.mappingId,
        message: "Mapping ID must be unique.",
      });
    }
    seen.add(mapping.mappingId);

    const componentId = mapping.mappingId.split("/")[0];
    if (!registry.components[componentId]) {
      issues.push({
        code: "INVALID_COMPONENT_ID",
        path: mapping.mappingId,
        message: `Mapping references unknown semantic component ${componentId}.`,
      });
    }

    if (
      !importNamePattern.test(mapping.importPath) ||
      mapping.importPath.includes("@/")
    ) {
      issues.push({
        code: "INVALID_IMPORT_PATH",
        path: `${mapping.mappingId}.importPath`,
        message:
          "Canonical import paths cannot contain a consumer project alias.",
      });
    }

    if (!exportNamePattern.test(mapping.exportName)) {
      issues.push({
        code: "INVALID_EXPORT_NAME",
        path: `${mapping.mappingId}.exportName`,
        message: "Export name must be a valid PascalCase identifier.",
      });
    }

    if (
      mapping.sourceLocation.kind !== "upstream" ||
      !mapping.sourceLocation.path ||
      !/^https:\/\//.test(mapping.sourceLocation.url)
    ) {
      issues.push({
        code: "INVALID_SOURCE_LOCATION",
        path: `${mapping.mappingId}.sourceLocation`,
        message:
          "Canonical mappings require a verified upstream HTTPS source.",
      });
    }

    if (
      !mapping.provenance.source ||
      !/^\d{4}-\d{2}-\d{2}$/.test(mapping.provenance.verifiedAt)
    ) {
      issues.push({
        code: "INVALID_PROVENANCE",
        path: `${mapping.mappingId}.provenance`,
        message:
          "Mapping provenance requires source and YYYY-MM-DD verification date.",
      });
    }

    const component = registry.components[componentId];
    if (component) {
      for (const semanticVariant of Object.keys(mapping.variantMapping)) {
        if (
          !component.variants.some((variant) => variant.id === semanticVariant)
        ) {
          issues.push({
            code: "INVALID_VARIANT_MAPPING",
            path: `${mapping.mappingId}.variantMapping.${semanticVariant}`,
            message: `Semantic variant ${semanticVariant} is not registered on ${componentId}.`,
          });
        }
      }
    }
  }

  return { valid: issues.length === 0, issues };
}
