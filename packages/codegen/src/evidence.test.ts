import { dashboardFixture } from "@uiforge/ui-schema/fixtures";
import { describe, expect, it } from "vitest";
import { buildCodeSpecification } from "./index";
describe("issue #13 evidence contract", () => {
  it("produces reviewable file/component/interaction evidence", () => {
    const result = buildCodeSpecification({
      document: dashboardFixture,
      graph: {
        version: "uiforge.experience-graph/v1",
        transitions: [{
          id: "transition.dashboard.details",
          fromScreenId: "screen.dashboard",
          toScreenId: "screen.mobile-list",
          sourceNodeId: "dashboard.cta",
          trigger: "click",
          kind: "navigation",
        }],
      },
    });
    expect(result.spec.filePlan.length).toBeGreaterThan(0);
    expect(result.spec.componentGraph.length).toBeGreaterThan(0);
    expect(result.spec.interactionRequirements.length).toBeGreaterThan(0);
  });
});
