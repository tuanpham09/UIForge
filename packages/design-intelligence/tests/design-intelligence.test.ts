import { describe, expect, it } from "vitest";
import {
  composeStrategy,
  discoverSkills,
  validateStrategy,
} from "../src";

describe("design intelligence", () => {
  const finance = {
    domain: "finance",
    productType: "expense-management",
    primaryTasks: ["quick-entry", "review transactions", "budget"],
    platforms: ["web", "mobile"],
  } as const;

  it("discovers representative finance skills", () => {
    expect(discoverSkills(finance).map((x) => x.skillId)).toEqual(
      expect.arrayContaining([
        "personal-finance",
        "dashboard",
        "quick-entry",
        "responsive-navigation",
        "accessibility",
      ]),
    );
  });

  it("is deterministic", () => {
    expect(composeStrategy(finance)).toEqual(composeStrategy(finance));
  });

  it("supports ecommerce", () => {
    expect(
      composeStrategy({
        domain: "ecommerce",
        productType: "shop",
        primaryTasks: ["browse", "checkout"],
        platforms: ["web"],
      }).skills,
    ).toContain("ecommerce-browse");
  });

  it("rejects unknown skill", () => {
    const strategy = composeStrategy(finance);
    strategy.skills.push("missing");
    expect(validateStrategy(strategy)).toContain("UNKNOWN_SKILL");
  });
});
