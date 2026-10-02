import { dashboardFixture } from "@uiforge/ui-schema/fixtures";
import { describe, expect, it } from "vitest";
import { buildVisualDesignProposal } from "./visual-design";

describe("wireframe to visual design", () => {
  it("creates editable visual tokens, components and layout patches", () => {
    const proposal = buildVisualDesignProposal(dashboardFixture);
    expect(proposal.sourceStage).toBe("wireframe");
    expect(proposal.targetStage).toBe("visual");
    expect(proposal.patches).toHaveLength(
      Object.keys(dashboardFixture.nodes).length,
    );

    const button = proposal.patches.find(
      (item) => item.nodeId === "dashboard.cta",
    );
    expect(button?.component).toEqual({
      registryId: "uiforge.button",
      variant: "primary",
    });
    expect(button?.style?.tokens).toMatchObject({
      fill: "color.primary",
      color: "color.onPrimary",
      radius: "control.radius",
    });
    expect(button?.layout?.mode).toBe("flex");
    expect(button?.editor?.width).toBeGreaterThan(0);
  });

  it("produces a command-applicable proposal for the full fixture", async () => {
    const proposal = buildVisualDesignProposal(dashboardFixture);
    const { applyCommand } = await import("@uiforge/ui-schema");
    const next = applyCommand(dashboardFixture, {
      type: "ApplyVisualDesign",
      commandId: "test.full-visual-design",
      stage: proposal.targetStage,
      patches: proposal.patches,
    });
    expect(next.metadata.designStage).toBe("visual");
  });

  it("hides the semantic screen root because the device frame is its visual container", () => {
    const proposal = buildVisualDesignProposal(dashboardFixture);
    const root = proposal.patches.find(
      (item) => item.nodeId === "screen.dashboard.root",
    );
    expect(root?.editor?.visible).toBe(false);
  });

  it("does not accept an already visual document", () => {
    const visual = structuredClone(dashboardFixture);
    visual.metadata.designStage = "visual";
    expect(() => buildVisualDesignProposal(visual)).toThrow(
      "VISUAL_DESIGN_SOURCE_MUST_BE_WIREFRAME",
    );
  });
});
