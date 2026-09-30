import { defaultTokenSet } from "@uiforge/design-tokens";
import {
  dashboardFixture,
  loginFixture,
  mobileListFixture,
} from "@uiforge/ui-schema";
import { describe, expect, it } from "vitest";
import { getViewport, renderScreen, validateRendererGraph } from "./index";

describe("deterministic semantic renderer", () => {
  it("renders all canonical fixtures into React elements", () => {
    for (const fixture of [dashboardFixture, loginFixture, mobileListFixture]) {
      const screen = fixture.screens[0];
      if (!screen) {
        throw new Error(`Missing screen in fixture ${fixture.id}`);
      }

      const result = renderScreen(fixture, screen.id, defaultTokenSet, {
        viewport: getViewport("desktop"),
      });

      expect(result.element).toBeTruthy();
      expect(
        result.diagnostics.filter((item) => item.severity === "error"),
      ).toHaveLength(0);
    }
  });

  it("produces stable diagnostics for repeated renders", () => {
    const a = renderScreen(
      dashboardFixture,
      "screen.dashboard",
      defaultTokenSet,
      { viewport: getViewport("desktop") },
    );
    const b = renderScreen(
      dashboardFixture,
      "screen.dashboard",
      defaultTokenSet,
      { viewport: getViewport("desktop") },
    );

    expect(a.diagnostics).toEqual(b.diagnostics);
  });

  it("supports desktop and mobile viewport presets", () => {
    expect(getViewport("desktop").width).toBe(1440);
    expect(getViewport("mobile").width).toBe(390);
  });

  it("surfaces unsupported nodes and invalid graph references", () => {
    const broken = structuredClone(dashboardFixture);
    broken.nodes["dashboard.cta"].type = "custom";
    broken.nodes["dashboard.cta"].interaction = {
      interactive: true,
      trigger: "click",
      action: "navigate",
      targetScreenId: "missing" as never,
    };

    const diagnostics = validateRendererGraph(broken);
    expect(diagnostics.some((item) => item.code === "INVALID_TRANSITION")).toBe(
      true,
    );

    const result = renderScreen(broken, "screen.dashboard", defaultTokenSet, {
      viewport: getViewport("desktop"),
    });
    expect(
      result.diagnostics.some((item) => item.code === "UNSUPPORTED_NODE"),
    ).toBe(true);
  });
});
