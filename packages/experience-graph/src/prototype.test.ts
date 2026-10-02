import { describe, expect, it } from "vitest";
import type { ExperienceGraph } from "./types";
import { createPrototypeSession, goBack, resolveTransition } from "./prototype";

const graph: ExperienceGraph = {
  version: "uiforge.experience-graph/v1",
  id: "fixture",
  flows: [{ id: "flow", name: "Main", screenIds: ["signup", "filter"], startingPointIds: ["start"], transitionIds: ["t1"] }],
  journeys: [],
  startingPoints: [{ id: "start", destination: { screenId: "signup" } }],
  transitions: [{
    id: "t1",
    source: { screenId: "signup", nodeId: "submit" },
    trigger: { type: "click" },
    action: { type: "navigate", destination: { screenId: "filter" } },
    animation: { name: "slide-right", durationMs: 250 },
  }],
};

describe("prototype session", () => {
  it("navigates through the Experience Graph and records history", () => {
    const session = createPrototypeSession(graph);
    const result = resolveTransition(graph, session, { screenId: "signup", nodeId: "submit" });
    expect(result?.transition.id).toBe("t1");
    expect(result?.session.current.screenId).toBe("filter");
    expect(result?.session.history).toEqual([{ screenId: "signup" }]);
    expect(goBack(result!.session).current.screenId).toBe("signup");
  });

  it("does not navigate when the hotspot has no graph edge", () => {
    const session = createPrototypeSession(graph);
    expect(resolveTransition(graph, session, { screenId: "signup", nodeId: "missing" })).toBeNull();
  });
});
