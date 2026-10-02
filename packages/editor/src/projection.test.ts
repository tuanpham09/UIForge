import { dashboardFixture } from "@uiforge/ui-schema/fixtures";
import { describe, expect, it } from "vitest";
import { projectDocument } from "./projection";

describe("visual design projection", () => {
  it("keeps wireframes neutral", () => {
    const projection = projectDocument(dashboardFixture);
    const button = projection.shapes.find(
      (shape) => shape.meta.nodeId === "dashboard.cta",
    );
    expect(button?.type).toBe("geo");
    if (button?.type === "geo") {
      expect(button.props.fill).toBe("none");
      expect(button.props.dash).toBe("dashed");
    }
  });

  it("projects visual design as styled editable shapes", () => {
    const visual = structuredClone(dashboardFixture);
    visual.metadata.designStage = "visual";
    const cta = visual.nodes["dashboard.cta"];
    if (!cta) throw new Error("dashboard CTA fixture missing");
    cta.editor = {
      x: 104,
      y: 176,
      width: 160,
      height: 44,
    };
    const projection = projectDocument(visual);
    const button = projection.shapes.find(
      (shape) => shape.meta.nodeId === "dashboard.cta",
    );
    expect(button?.type).toBe("geo");
    if (button?.type === "geo") {
      expect(button.props.fill).toBe("solid");
      expect(button.props.color).toBe("blue");
      expect(button.props.labelColor).toBe("white");
    }
  });
});
