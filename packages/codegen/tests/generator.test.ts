import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generateReactCode, runCompileGate } from "../src";
import type { CodeSpecification } from "../src";

const spec: CodeSpecification = {
  version: "uiforge.code-spec/v1",
  target: { framework: "react", runtime: "nextjs", styling: "tailwind-v4", library: "shadcn-ui" },
  documentId: "doc.dashboard",
  documentRevision: 1,
  filePlan: [
    { path: "app/layout.tsx", kind: "layout", owner: "generated", reason: "shell", screenIds: [] },
    { path: "app/globals.css", kind: "style", owner: "generated", reason: "tokens", screenIds: [] },
    { path: "app/dashboard/page.tsx", kind: "page", owner: "generated", reason: "dashboard", screenIds: ["screen.dashboard"] },
  ],
  componentGraph: [{ nodeId: "node.button", screenId: "screen.dashboard", registryId: "uiforge.button", mappingId: "shadcn.button", componentName: "Button", importPath: "@/components/ui/button", variant: "primary", props: { children: "Create" }, requiredStates: [], warnings: [] }],
  importPlan: [{ source: "@/components/ui/button", imports: ["Button"], kind: "component", requiredBy: ["node.button"] }],
  tokenRequirements: [{ nodeId: "node.button", slot: "color", token: "color.primary", cssVariable: "--ui-color-primary", tailwindValue: "var(--ui-color-primary)" }],
  responsiveRequirements: [{ nodeId: "node.button", breakpoint: "mobile", classes: ["sm:hidden"], hidden: true, tokenOverrides: {} }],
  accessibilityRequirements: [{ nodeId: "node.button", role: "button", accessibleName: "Create", required: true, keyboard: ["Enter"], describedBy: [], labelledBy: [] }],
  interactionRequirements: [],
  warnings: [],
  strategyProvenance: { designStrategyVersion: "v1", colorStrategyVersion: "v1", componentIntelligenceVersion: "v1", visualCraftVersion: "v1", skillIds: [], requirements: [] },
  deterministicKey: "dashboard-key",
};

describe("deterministic React generator", () => {
  it("emits mapped components, semantic tokens, responsive and accessibility requirements", () => {
    const result = generateReactCode(spec);
    const page = result.files.find((file) => file.path === "app/dashboard/page.tsx")?.content ?? "";
    expect(page).toContain('import { Button } from "@/components/ui/button";');
    expect(page).toContain("data-responsive-classes");
    expect(page).toContain("aria-label");
    expect(result.manifest.files.map((file) => file.path)).toEqual(["app/dashboard/page.tsx", "app/globals.css", "app/layout.tsx"]);
  });

  it("is deterministic for the same specification", () => {
    expect(generateReactCode(spec)).toEqual(generateReactCode(spec));
  });

  it("passes the generated-source compile gate", () => {
    const result = generateReactCode(spec);
    const gate = runCompileGate(result.files);
    expect(gate.passed).toBe(true);
    expect(gate.filesChecked).toBe(2);
    mkdirSync("artifacts/codegen", { recursive: true });
    writeFileSync("artifacts/codegen/generated-source.json", JSON.stringify(result.files, null, 2));
    writeFileSync("artifacts/codegen/generated-manifest.json", JSON.stringify(result.manifest, null, 2));
    writeFileSync("artifacts/codegen/compile-gate.json", JSON.stringify(gate, null, 2));
  });
});