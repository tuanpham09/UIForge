import { componentRegistry } from "@uiforge/component-registry";
import { describe, expect, it } from "vitest";
import { decide } from "../src/orchestrator";
import { specialistContracts } from "../src/specialists";

describe("component intelligence", () => {
  it("selects primary button for the first create action", () => {
    const result = decide({ registry: componentRegistry, context: {
      screenId: "expense", nodeId: "save", task: "create", componentIntent: "action",
      interaction: "mutate", viewport: "desktop", existingPrimaryActions: 0, accessibleName: "Save"
    }});
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.decision.variant).toBe("primary");
  });

  it("selects destructive button and loading state for submit", () => {
    const result = decide({ registry: componentRegistry, context: {
      screenId: "expense", nodeId: "delete", task: "submit", componentIntent: "action",
      interaction: "submit", viewport: "desktop", destructive: true, loading: true, accessibleName: "Delete"
    }});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.decision.variant).toBe("destructive");
      expect(result.decision.state).toBe("loading");
    }
  });

  it("rejects ambiguous interactive cards", () => {
    const result = decide({ registry: componentRegistry, context: {
      screenId: "dashboard", nodeId: "metric", task: "view", componentIntent: "group",
      interaction: "select", viewport: "desktop", interactive: true, hasContainedAction: true
    }});
    expect(result.ok).toBe(false);
  });

  it("requires a graph destination for navigation decisions", () => {
    const result = decide({ registry: componentRegistry, context: {
      screenId: "dashboard", nodeId: "orders", task: "navigation", componentIntent: "navigation",
      interaction: "navigate", viewport: "desktop", accessibleName: "Orders"
    }});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.findings.join(" ")).toContain("graph destination");
  });

  it("emits graph requirements when navigation has a destination", () => {
    const result = decide({ registry: componentRegistry, context: {
      screenId: "dashboard", nodeId: "orders", task: "navigation", componentIntent: "navigation",
      interaction: "navigate", viewport: "desktop", accessibleName: "Orders",
      graphDestinationId: "orders-screen", graphTransitionKind: "navigation"
    }});
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.decision.graphRequirements[0].destinationId).toBe("orders-screen");
  });

  it("is deterministic and does not allow reviewers to mutate", () => {
    const input = { registry: componentRegistry, context: {
      screenId: "settings", nodeId: "confirm", task: "confirm", componentIntent: "action",
      interaction: "mutate", viewport: "mobile", accessibleName: "Confirm"
    } } as const;
    const a = decide(input);
    const b = decide(input);
    expect(a).toEqual(b);
    expect(specialistContracts.filter(s => s.id.endsWith("reviewer") || s.id === "design-critic").every(s => !s.canMutate)).toBe(true);
  });
});
