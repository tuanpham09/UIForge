import type { ExperienceGraph, Destination, Transition } from "./types";

export interface PrototypeSession {
  current: Destination;
  history: Destination[];
}

export function createPrototypeSession(
  graph: ExperienceGraph,
  start?: Destination,
): PrototypeSession {
  const initial =
    start ??
    graph.startingPoints[0]?.destination ??
    graph.flows[0]?.screenIds[0]
      ? { screenId: graph.flows[0]?.screenIds[0] as string }
      : null;
  if (!initial) throw new Error("PROTOTYPE_NO_STARTING_POINT");
  return { current: initial, history: [] };
}

export function resolveTransition(
  graph: ExperienceGraph,
  session: PrototypeSession,
  source: Destination,
  triggerType: "click" | "tap" = "click",
): { session: PrototypeSession; transition: Transition } | null {
  const transition = graph.transitions.find(
    (item) =>
      item.source.screenId === source.screenId &&
      item.source.nodeId === source.nodeId &&
      item.trigger.type === triggerType &&
      item.action.type === "navigate",
  );
  if (!transition || transition.action.type !== "navigate") return null;
  return {
    transition,
    session: {
      current: transition.action.destination,
      history: [...session.history, session.current],
    },
  };
}

export function goBack(session: PrototypeSession): PrototypeSession {
  const previous = session.history.at(-1);
  if (!previous) return session;
  return {
    current: previous,
    history: session.history.slice(0, -1),
  };
}
