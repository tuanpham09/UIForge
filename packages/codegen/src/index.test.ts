// biome-ignore-all format: deterministic fixture assertions are kept compact for evidence review
import { describe, expect, it } from "vitest";
import { dashboardFixture, loginFixture } from "@uiforge/ui-schema/fixtures";
import { buildCodeSpecification } from "./index";

describe("code specification", () => {
  const graph = {
    version: "uiforge.experience-graph/v1",
    transitions: [{
      id: "transition.dashboard.details",
      fromScreenId: "screen.dashboard",
      toScreenId: "screen.mobile-list",
      sourceNodeId: "dashboard.cta",
      trigger: "click",
      kind: "navigation" as const,
    }],
  };

  it("builds a deterministic React/Next/Tailwind implementation plan", () => {
    const first = buildCodeSpecification({ document: dashboardFixture, graph });
    const second = buildCodeSpecification({ document: dashboardFixture, graph });
    expect(first.spec.version).toBe("uiforge.code-spec/v1");
    expect(first.spec.target).toEqual({
      framework: "react", runtime: "nextjs", styling: "tailwind-v4", library: "shadcn-ui",
    });
    expect(first.spec.filePlan.some(f => f.path === "app/dashboard/page.tsx")).toBe(true);
    expect(first.spec.componentGraph.some(c => c.registryId === "button")).toBe(true);
    expect(first.spec.interactionRequirements[0]?.transitionId).toBe("transition.dashboard.details");
    expect(first.spec.deterministicKey).toBe(second.spec.deterministicKey);
  });

  it("reuses mapped components and warns on missing mappings", () => {
    const known = buildCodeSpecification({ document: dashboardFixture });
    expect(known.mappings.some(m => m.componentName === "Button")).toBe(true);

    const document = structuredClone(loginFixture);
    const node = document.nodes["login.submit"];
    if (!node) throw new Error("fixture node missing");
    node.component = { registryId: "not-in-registry", variant: "primary" };
    const result = buildCodeSpecification({ document });
    expect(result.spec.warnings.some(w => w.code === "MISSING_CODE_MAPPING")).toBe(true);
    expect(result.spec.componentGraph.find(c => c.nodeId === "login.submit")?.warnings).toContain("MISSING_CODE_MAPPING");
  });

  it("maps semantic tokens and responsive rules explicitly", () => {
    const document = structuredClone(dashboardFixture);
    const node = document.nodes["dashboard.summary"];
    if (!node) throw new Error("fixture node missing");
    node.style = { tokens: { color: "color.surface", gap: "space.4" } };
    node.responsive = [{ breakpoint: "mobile", hidden: true, tokenOverrides: { padding: "space.2" } }];
    const result = buildCodeSpecification({ document });
    expect(result.spec.tokenRequirements).toEqual([
      { nodeId:"dashboard.summary", slot:"color", token:"color.surface", cssVariable:"--ui-color-surface", tailwindValue:"var(--ui-color-surface)" },
      { nodeId:"dashboard.summary", slot:"gap", token:"space.4", cssVariable:"--ui-space-4", tailwindValue:"var(--ui-space-4)" },
    ]);
    expect(result.spec.responsiveRequirements[0]?.classes).toContain("sm:hidden");
  });

  it("preserves accessibility requirements", () => {
    const result = buildCodeSpecification({ document: dashboardFixture });
    const item = result.spec.accessibilityRequirements.find(a => a.nodeId === "dashboard.cta");
    expect(item?.accessibleName).toBe("Open details");
  });
});
