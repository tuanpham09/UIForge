import { describe, expect, it } from "vitest";
import {
  checkoutExperienceGraph,
  checkoutExperienceGraphJson,
  deserializeExperienceGraph,
  replayTransitions,
  serializeExperienceGraph,
  validateExperienceGraph,
} from "../src";

describe("Experience Graph", () => {
  it("validates checkout branching", () => {
    const result = validateExperienceGraph(checkoutExperienceGraph);
    expect(result.valid).toBe(true);
    expect(result.reachableScreenIds).toEqual([
      "screen.cart",
      "screen.checkout",
      "screen.error",
      "screen.processing",
      "screen.product",
      "screen.success",
    ]);
  });

  it("serializes deterministically and round-trips", () => {
    const shuffled = {
      ...checkoutExperienceGraph,
      transitions: [...checkoutExperienceGraph.transitions].reverse(),
    };
    expect(serializeExperienceGraph(checkoutExperienceGraph)).toBe(
      serializeExperienceGraph(shuffled),
    );
    expect(deserializeExperienceGraph(checkoutExperienceGraphJson)).toEqual(
      checkoutExperienceGraph,
    );
  });

  it("replays success", () => {
    const result = replayTransitions(checkoutExperienceGraph, "start.product", [
      { type: "click" },
      { type: "click" },
      { type: "submit" },
      { type: "condition", expression: "payment.status === 'success'" },
    ]);
    expect(result.finalDestination).toEqual({ screenId: "screen.success" });
    expect(result.steps.map((step) => step.transitionId)).toEqual([
      "product.add-to-cart",
      "cart.checkout",
      "checkout.submit",
      "processing.success",
    ]);
  });

  it("rejects missing destinations and reports orphan/unreachable screens", () => {
    const flow = checkoutExperienceGraph.flows.at(0);
    if (!flow) throw new Error("checkout flow fixture is missing");
    const first = checkoutExperienceGraph.transitions.at(0);
    const second = checkoutExperienceGraph.transitions.at(1);
    if (!first || !second) {
      throw new Error("checkout transition fixture is incomplete");
    }

    const invalid = {
      ...checkoutExperienceGraph,
      flows: [{ ...flow, screenIds: [...flow.screenIds, "screen.orphan"] }],
      transitions: [
        ...checkoutExperienceGraph.transitions,
        { ...first, id: "duplicate.semantic" },
        {
          ...second,
          id: "missing.destination",
          action: {
            type: "navigate" as const,
            destination: { screenId: "screen.missing" },
          },
        },
      ],
    };
    const result = validateExperienceGraph(invalid);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "CONFLICTING_TRANSITION",
        "MISSING_DESTINATION",
        "ORPHAN_SCREEN",
        "UNREACHABLE_SCREEN",
      ]),
    );
  });

  it("represents overlay, back, scroll and state-change", () => {
    const graph = {
      ...checkoutExperienceGraph,
      transitions: [
        ...checkoutExperienceGraph.transitions,
        {
          id: "checkout.help",
          source: { screenId: "screen.checkout", nodeId: "checkout.help" },
          trigger: { type: "click" as const },
          action: {
            type: "overlay" as const,
            destination: {
              screenId: "screen.checkout",
              nodeId: "checkout.help-dialog",
            },
          },
        },
        {
          id: "checkout.help.back",
          source: {
            screenId: "screen.checkout",
            nodeId: "checkout.help-dialog",
          },
          trigger: { type: "keyboard" as const },
          action: { type: "back" as const },
        },
        {
          id: "checkout.scroll",
          source: { screenId: "screen.checkout" },
          trigger: { type: "click" as const },
          action: { type: "scroll" as const, targetNodeId: "checkout.summary" },
        },
        {
          id: "checkout.state",
          source: { screenId: "screen.checkout" },
          trigger: { type: "click" as const },
          action: {
            type: "state-change" as const,
            state: "couponOpen",
            value: true,
          },
        },
      ],
    };
    expect(graph.transitions.map((item) => item.action.type)).toEqual(
      expect.arrayContaining(["overlay", "back", "scroll", "state-change"]),
    );
  });
});
