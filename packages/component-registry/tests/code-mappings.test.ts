import { describe, expect, it } from "vitest";
import { componentRegistry } from "../src/definitions";
import { codeMappingSet, queryCodeMappings, resolveCodeMapping } from "../src/code-mappings";
import { validateCodeMappings } from "../src/code-mapping-validate";

describe("code mapping registry", () => {
  it("maps Button, Card and Input to explicit React/Next.js shadcn implementations", () => {
    for (const componentId of ["uiforge.button", "uiforge.card", "uiforge.input"]) {
      const result = resolveCodeMapping(componentId, { framework: "react", runtime: "nextjs", library: "shadcn-ui" });
      expect(result.reason).toBe("resolved");
      expect(result.mapping).not.toBeNull();
      expect(result.mapping?.exportName).toBeDefined();
      expect(result.mapping?.importPath).toMatch(/^components\/ui\//);
      expect(result.mapping?.sourceLocation.kind).toBe("upstream");
      expect(result.mapping?.confidence).toBe("high");
    }
  });

  it("resolves design variants explicitly", () => {
    const button = resolveCodeMapping("uiforge.button", { framework: "react", runtime: "nextjs", library: "shadcn-ui" }).mapping;
    expect(button?.variantMapping).toMatchObject({
      primary: "default",
      secondary: "secondary",
      destructive: "destructive",
      ghost: "ghost",
    });
  });

  it("returns visible missing and unsupported mapping results", () => {
    expect(resolveCodeMapping("uiforge.navigation").reason).toBe("missing");
    expect(resolveCodeMapping("uiforge.button", { framework: "react", runtime: "nextjs", library: "base-ui" }).reason).toBe("unsupported-target");
    expect(queryCodeMappings({ componentId: "uiforge.navigation" })[0].mapping).toBeNull();
  });

  it("rejects invalid import/export and variant mappings", () => {
    const invalid = structuredClone(codeMappingSet);
    const button = invalid.mappings["uiforge.button/react-nextjs/shadcn-ui"];
    button.importPath = "bad path";
    button.exportName = "button";
    button.variantMapping.primary = "missing-semantic-variant";
    const result = validateCodeMappings(invalid, componentRegistry);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["INVALID_IMPORT_PATH", "INVALID_EXPORT_NAME", "INVALID_VARIANT_MAPPING"]),
    );
  });

  it("keeps canonical mappings free of consumer project aliases", () => {
    for (const mapping of Object.values(codeMappingSet.mappings)) {
      expect(mapping.importPath).not.toContain("@/");
      expect(mapping.sourceLocation.kind).toBe("upstream");
    }
  });
});
