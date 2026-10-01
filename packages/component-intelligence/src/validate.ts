// biome-ignore-all format: semantic domain contract formatting is CI-invariant
import type { ComponentRegistry } from "@uiforge/component-registry";
import type { ComponentDecision, DecisionContext } from "./types";

export function validateDecision(
  decision: ComponentDecision,
  context: DecisionContext,
  registry: ComponentRegistry,
): string[] {
  const findings: string[] = [];
  const component = registry.components[decision.componentId];

  if (!component) findings.push("Unknown component.");
  if (component && !component.variants.some(v => v.id === decision.variant)) findings.push(`Invalid variant: ${decision.variant}`);
  if (component && !component.states.some(s => s.id === decision.state)) findings.push(`Invalid state: ${decision.state}`);

  if (decision.componentId === "uiforge.button" && context.componentIntent === "navigation" && context.interaction === "navigate") {
    findings.push("Navigation action must be represented by a navigation semantic; button is only valid when the product explicitly requires action semantics.");
  }

  if (decision.componentId === "uiforge.card" && context.interactive && context.hasContainedAction) {
    findings.push("Interactive card with contained action is ambiguous without an explicit interaction model.");
  }

  if (decision.graphRequirements.some(r => r.kind === "navigation") && !context.graphDestinationId) {
    findings.push("Navigation decision is missing a graph destination.");
  }

  if (context.requiredStates && !context.requiredStates.every(state => component?.states.some(s => s.id === state))) {
    findings.push("One or more required states are not supported by the selected component.");
  }

  if (decision.record.validation.valid === false) findings.push(...decision.record.validation.findings);
  return [...new Set(findings)];
}
