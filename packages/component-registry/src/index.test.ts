// biome-ignore-all format: semantic registry implementation is maintained as a stable contract\nimport { describe, expect, it } from "vitest";
import { componentRegistry } from "./definitions";
import { validateComponentRegistry } from "./validate";

describe("component registry", () => {
  it("contains the 16 semantic primitives", () => {
    expect(Object.keys(componentRegistry.components)).toHaveLength(16);
    expect(componentRegistry.components["uiforge.button"].name).toBe("Button");
    expect(componentRegistry.components["uiforge.empty-state"].name).toBe(
      "EmptyState",
    );
  });

  it("validates stable IDs, decision metadata, variants and states", () => {
    const result = validateComponentRegistry(componentRegistry);

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);

    for (const component of Object.values(componentRegistry.components)) {
      expect(component.id).toMatch(/^uiforge\./);
      expect(component.variants.length).toBeGreaterThan(0);
      expect(component.states.length).toBeGreaterThan(0);
      expect(component.decision.whenToUse.length).toBeGreaterThan(0);
      expect(component.decision.whenNotToUse.length).toBeGreaterThan(0);
      expect(
        component.decision.experienceGraphImplications.length,
      ).toBeGreaterThan(0);
    }
  });

  it("rejects duplicate variants and states", () => {
    const duplicate = structuredClone(componentRegistry);
    const button = duplicate.components["uiforge.button"];

    button.variants.push(button.variants[0]);
    button.states.push(button.states[0]);

    const result = validateComponentRegistry(duplicate);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "DUPLICATE_VARIANT",
    );
    expect(result.issues.map((issue) => issue.code)).toContain(
      "DUPLICATE_STATE",
    );
  });

  it("keeps code mapping framework-neutral", () => {
    for (const component of Object.values(componentRegistry.components)) {
      expect(component.codeMapping.strategy).toBe("project-mapping");
      expect(component.codeMapping.source).toBeUndefined();
    }
  });
});
