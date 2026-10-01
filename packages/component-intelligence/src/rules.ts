import type { ComponentId, ComponentRegistry } from "@uiforge/component-registry";
import type { DecisionContext, DesignRule } from "./types";

const r = (
  id: string,
  kind: DesignRule["kind"],
  priority: number,
  specialist: DesignRule["specialist"],
  description: string,
  matches: (context: DecisionContext) => boolean,
  outcome: DesignRule["outcome"],
  componentIds?: ComponentId[],
): DesignRule => ({ id, version: "1", kind, priority, specialist, description, matches, outcome, componentIds });

export const componentRules: readonly DesignRule[] = [
  r("button.navigation-link", "component", 900, "ux-pattern-designer", "Navigation without state mutation uses navigation semantics.", c => c.componentIntent === "navigation" && c.interaction === "navigate", { variant: "secondary" }, ["uiforge.button"]),
  r("button.destructive", "component", 1000, "component-designer", "Destructive mutations require destructive action styling.", c => c.destructive === true && c.componentIntent === "action", { variant: "destructive" }, ["uiforge.button"]),
  r("button.primary", "component", 800, "component-designer", "The primary task action uses the primary variant.", c => c.componentIntent === "action" && !c.destructive && (c.existingPrimaryActions ?? 0) === 0, { variant: "primary" }, ["uiforge.button"]),
  r("button.secondary-conflict", "component", 950, "design-critic", "A second primary action is a decision-context conflict.", c => c.componentIntent === "action" && !c.destructive && (c.existingPrimaryActions ?? 0) > 0, { variant: "secondary", message: "Avoid multiple visually equal primary actions in one decision context." }, ["uiforge.button"]),
  r("button.loading", "normative", 1100, "interaction-reviewer", "Non-idempotent submission must prevent duplicate submission while loading.", c => c.loading === true && c.task === "submit", { state: "loading" }, ["uiforge.button"]),
  r("button.disabled", "normative", 1100, "accessibility-reviewer", "Disabled state is explicit when the action cannot currently be invoked.", c => c.disabled === true, { state: "disabled" }, ["uiforge.button"]),
  r("button.icon-name", "normative", 1200, "accessibility-reviewer", "Icon-only controls require an accessible name.", c => c.componentIntent === "action" && !c.accessibleName, { forbidden: true, message: "Icon-only or ambiguous action requires an accessible name." }, ["uiforge.button"]),
  r("card.group", "component", 500, "component-designer", "Card groups related information without implying interaction.", c => c.componentIntent === "group" && !c.interactive && !c.selectable, { variant: "default", state: "default" }, ["uiforge.card"]),
  r("card.selectable", "component", 700, "component-designer", "Selectable cards expose selection state.", c => c.selectable === true, { variant: "interactive", state: "selected" }, ["uiforge.card"]),
  r("card.interactive", "component", 700, "interaction-reviewer", "Interactive cards require explicit interaction semantics.", c => c.interactive === true && !c.hasContainedAction, { variant: "interactive" }, ["uiforge.card"]),
  r("card-contained-action", "normative", 1200, "design-critic", "Interactive cards must not hide a second interaction model around contained actions.", c => c.interactive === true && c.hasContainedAction === true, { forbidden: true, message: "Interactive card conflicts with a contained action unless an explicit interaction model exists." }, ["uiforge.card"]),
  r("dialog.desktop", "component", 600, "ux-pattern-designer", "Desktop focused interruption uses a dialog.", c => c.componentIntent === "overlay" && c.viewport !== "mobile", { variant: "default", state: "open" }, ["uiforge.dialog"]),
  r("dialog.mobile", "component", 650, "responsive-designer", "Mobile focused overlays prefer sheet behavior.", c => c.componentIntent === "overlay" && c.viewport === "mobile", { variant: "confirmation", state: "open" }, ["uiforge.dialog"]),
  r("dialog.confirmation", "component", 850, "interaction-reviewer", "Destructive confirmation is an explicit focused task.", c => c.componentIntent === "overlay" && c.destructive === true, { variant: "confirmation", state: "open" }, ["uiforge.dialog"]),
  r("navigation.mobile", "component", 650, "responsive-designer", "Mobile navigation changes presentation according to viewport.", c => c.componentIntent === "navigation" && c.viewport === "mobile", { variant: "default" }, ["uiforge.navigation"]),
  r("navigation.graph", "graph", 1000, "interaction-reviewer", "Navigation decisions require a graph destination.", c => c.componentIntent === "navigation" && c.interaction === "navigate", { requiresGraph: true }, ["uiforge.navigation", "uiforge.button"]),
];

export function matchingRules(context: DecisionContext, componentId: ComponentId): DesignRule[] {
  return componentRules
    .filter(rule => (!rule.componentIds || rule.componentIds.includes(componentId)) && rule.matches(context))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
}

export function registrySupports(registry: ComponentRegistry, componentId: ComponentId): boolean {
  return Boolean(registry.components[componentId]);
}
