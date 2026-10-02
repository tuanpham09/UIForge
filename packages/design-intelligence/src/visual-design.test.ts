import { describe, expect, it } from "vitest";
import { buildVisualDesignProposal } from "./visual-design";
import { dashboardFixture } from "@uiforge/ui-schema/fixtures";

describe("wireframe to visual design", () => {
  it("produces semantic token/component patches without changing node identity", () => {
    const proposal = buildVisualDesignProposal(dashboardFixture);
    expect(proposal.sourceStage).toBe("wireframe");
    expect(proposal.targetStage).toBe("visual");
    expect(proposal.patches).toHaveLength(Object.keys(dashboardFixture.nodes).length);
    const button = proposal.patches.find((item) => item.nodeId === "dashboard.cta");
    expect(button?.component).toEqual({
      registryId: "uiforge.button",
      variant: "primary",
    });
    expect(button?.style?.tokens).toMatchObject({
      fill: "color.primary",
      color: "color.onPrimary",
      radius: "control.radius",
    });
  });

  it("does not accept an already visual document as a wireframe source", () => {
    const visual = structuredClone(dashboardFixture);
    visual.metadata.designStage = "visual";
    expect(() => buildVisualDesignProposal(visual)).toThrow(
      "VISUAL_DESIGN_SOURCE_MUST_BE_WIREFRAME",
    );
  });
});
