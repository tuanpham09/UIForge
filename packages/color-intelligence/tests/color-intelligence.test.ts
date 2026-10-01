import { describe, expect, it } from "vitest";
import { buildColorStrategy, contrast, validateColorStrategy } from "../src";

describe("color intelligence", () => {
  it("creates deterministic project strategy", () => {
    const input = {
      primary: "#2563eb",
      secondary: "#7c3aed",
      domain: "finance",
      designStrategyVersion: "uiforge.design-strategy/v1",
    };
    expect(buildColorStrategy(input)).toEqual(buildColorStrategy(input));
  });

  it("checks contrast", () => {
    expect(contrast("#111111", "#ffffff")).toBeGreaterThan(15);
  });

  it("keeps semantic roles", () => {
    const strategy = buildColorStrategy({
      primary: "#2563eb",
      secondary: "#7c3aed",
      domain: "finance",
      designStrategyVersion: "uiforge.design-strategy/v1",
    });
    expect(validateColorStrategy(strategy)).toEqual([]);
  });
});
