// biome-ignore-all format: semantic registry implementation is maintained as a stable contract\nimport type {
  ComponentDefinition,
  ComponentRegistry,
  RegistryValidationIssue,
  RegistryValidationResult,
} from "./types";

const idPattern = /^uiforge\.[a-z][a-z0-9-]*$/;

function validateComponent(
  component: ComponentDefinition,
  issues: RegistryValidationIssue[],
): void {
  const path = component.id;

  if (!idPattern.test(component.id)) {
    issues.push({
      code: "INVALID_ID",
      path,
      message: "Component ID must use uiforge.<kebab-case>.",
    });
  }

  const variantIds = new Set<string>();
  for (const variant of component.variants) {
    if (variantIds.has(variant.id)) {
      issues.push({
        code: "DUPLICATE_VARIANT",
        path: path + ".variants",
        message: "Duplicate variant " + variant.id + ".",
      });
    }
    variantIds.add(variant.id);
  }

  const stateIds = new Set<string>();
  for (const state of component.states) {
    if (stateIds.has(state.id)) {
      issues.push({
        code: "DUPLICATE_STATE",
        path: path + ".states",
        message: "Duplicate state " + state.id + ".",
      });
    }
    stateIds.add(state.id);
  }

  if (!component.renderer.bindingId || !component.renderer.semanticType) {
    issues.push({
      code: "INVALID_RENDERER_BINDING",
      path: path + ".renderer",
      message: "Renderer binding requires bindingId and semanticType.",
    });
  }

  if (
    !component.accessibility.role ||
    !component.accessibility.accessibleName
  ) {
    issues.push({
      code: "INVALID_ACCESSIBILITY",
      path: path + ".accessibility",
      message:
        "Accessibility contract requires role and accessibleName.",
    });
  }

  const d = component.decision;
  if (
    !d.whenToUse.length ||
    !d.whenNotToUse.length ||
    !d.contextFit.length ||
    !d.alternatives.length ||
    !d.antiPatterns.length ||
    !d.experienceGraphImplications.length
  ) {
    issues.push({
      code: "INVALID_DECISION_METADATA",
      path: path + ".decision",
      message: "Decision metadata is incomplete.",
    });
  }
}

export function validateComponentRegistry(
  registry: ComponentRegistry,
): RegistryValidationResult {
  const issues: RegistryValidationIssue[] = [];
  const seenIds = new Set<string>();

  for (const [key, component] of Object.entries(registry.components)) {
    if (seenIds.has(component.id)) {
      issues.push({
        code: "DUPLICATE_ID",
        path: "components",
        message: "Duplicate component ID " + component.id + ".",
      });
    }
    seenIds.add(component.id);

    if (key !== component.id) {
      issues.push({
        code: "INVALID_ID",
        path: "components." + key,
        message: "Registry key must match component ID.",
      });
    }

    validateComponent(component, issues);
  }

  return { valid: issues.length === 0, issues };
}

export function assertValidComponentRegistry(
  registry: ComponentRegistry,
): void {
  const result = validateComponentRegistry(registry);
  if (!result.valid) {
    throw new Error(
      result.issues
        .map((issue) => issue.path + ": " + issue.message)
        .join("\\n"),
    );
  }
}
