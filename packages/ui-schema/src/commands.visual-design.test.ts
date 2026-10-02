import { describe, expect, it } from "vitest";
import { applyCommand } from "./commands";
import { dashboardFixture } from "./fixtures";

describe("ApplyVisualDesign command", () => {
  it("applies semantic style, component, layout and editor patches atomically", () => {
    const next = applyCommand(dashboardFixture, {
      type: "ApplyVisualDesign",
      commandId: "test.visual-design",
      stage: "visual",
      patches: [
        {
          nodeId: "dashboard.cta",
          style: { tokens: { fill: "color.primary" } },
          component: { registryId: "uiforge.button", variant: "primary" },
          layout: {
            mode: "flex",
            direction: "row",
            align: "center",
            justify: "center",
          },
          editor: { x: 104, y: 176, width: 160, height: 44 },
        },
      ],
    });

    expect(next.metadata.designStage).toBe("visual");
    expect(next.nodes["dashboard.cta"]?.style?.tokens?.fill).toBe("color.primary");
    expect(next.nodes["dashboard.cta"]?.component?.registryId).toBe("uiforge.button");
    expect(next.nodes["dashboard.cta"]?.layout.mode).toBe("flex");
    expect(next.nodes["dashboard.cta"]?.editor?.width).toBe(160);
  });
});
