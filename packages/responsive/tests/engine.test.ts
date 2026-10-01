import { describe, expect, it } from "vitest";
import { dashboardFixture, mobileListFixture } from "@uiforge/ui-schema";
import {
  BREAKPOINTS,
  getViewport,
  resolveBreakpoint,
  resolveResponsive,
} from "../src";

describe("responsive rule engine", () => {
  it("resolves the four canonical viewport presets", () => {
    expect(resolveBreakpoint(getViewport("wide")).id).toBe("wide");
    expect(resolveBreakpoint(getViewport("desktop")).id).toBe("desktop");
    expect(resolveBreakpoint(getViewport("tablet")).id).toBe("tablet");
    expect(resolveBreakpoint(getViewport("mobile")).id).toBe("mobile");
    expect(BREAKPOINTS.map((item) => item.id)).toEqual([
      "mobile",
      "tablet",
      "desktop",
      "wide",
    ]);
  });

  it("applies visibility, layout, variant and token overrides deterministically", () => {
    const document = structuredClone(dashboardFixture);
    const summary = document.nodes["dashboard.summary"];
    if (!summary) throw new Error("dashboard summary fixture is missing");
    summary.responsive = [
      {
        breakpoint: "mobile",
        hidden: true,
        tokenOverrides: { padding: "space.2" },
      },
      {
        breakpoint: "tablet",
        layout: { direction: "row" },
        variant: "compact",
      },
      { breakpoint: "wide", layout: { direction: "row" } },
    ];

    const mobile = resolveResponsive(document, getViewport("mobile"));
    const tablet = resolveResponsive(document, getViewport("tablet"));
    const wide = resolveResponsive(document, getViewport("wide"));

    expect(mobile.nodes["dashboard.summary"]?.visible).toBe(false);
    expect(mobile.nodes["dashboard.summary"]?.tokenOverrides).toEqual({
      padding: "space.2",
    });
    expect(tablet.nodes["dashboard.summary"]?.layout).toEqual({
      direction: "row",
    });
    expect(tablet.nodes["dashboard.summary"]?.variant).toBe("compact");
    expect(wide.nodes["dashboard.summary"]?.layout).toEqual({
      direction: "row",
    });
  });

  it("does not invent transformations when no rule exists", () => {
    const result = resolveResponsive(dashboardFixture, getViewport("mobile"));
    expect(result.nodes["dashboard.summary"]?.visible).toBe(true);
    expect(result.nodes["dashboard.summary"]?.appliedRuleIds).toEqual([]);
  });

  it("rejects invalid ranges and graph destinations", () => {
    const document = structuredClone(dashboardFixture);
    const summary = document.nodes["dashboard.summary"];
    if (!summary) throw new Error("dashboard summary fixture is missing");
    summary.responsive = [
      { breakpoint: "mobile", minWidth: 800, maxWidth: 700 },
      {
        breakpoint: "mobile",
        interaction: { targetScreenId: "screen.missing" },
      },
    ];
    const graph = {
      version: "uiforge.experience-graph/v1",
      transitions: [
        {
          id: "t.dashboard.mobile",
          fromScreenId: "screen.dashboard",
          toScreenId: "screen.mobile-list",
        },
      ],
    };
    const result = resolveResponsive(document, getViewport("mobile"), graph);
    expect(
      result.diagnostics.some((item) => item.code === "INVALID_RANGE"),
    ).toBe(true);
    expect(
      result.diagnostics.some(
        (item) => item.code === "INVALID_NAVIGATION_TARGET",
      ),
    ).toBe(true);
  });

  it("keeps mobile-list viewport contract explicit", () => {
    const result = resolveResponsive(mobileListFixture, getViewport("mobile"));
    expect(result.diagnostics).toEqual([]);
    expect(mobileListFixture.screens[0]?.viewport?.maxWidth).toBe(767);
  });

  it("is deterministic across repeated resolution", () => {
    const first = resolveResponsive(dashboardFixture, getViewport("mobile"));
    const second = resolveResponsive(dashboardFixture, getViewport("mobile"));
    expect(first).toEqual(second);
  });
});
