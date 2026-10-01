import type { ComponentId, ComponentRegistry } from "@uiforge/component-registry";
import type { DecisionContext, DesignRule } from "./types";

const r = (
  id: string, kind: DesignRule["kind"], priority: number, specialist: DesignRule["specialist"],
  description: string, matches: (context: DecisionContext) => boolean,
  outcome: DesignRule["outcome"], componentIds?: ComponentId[],
): DesignRule => ({ id, version: "1", kind, priority, specialist, description, matches, outcome, componentIds });

export const componentRules: readonly DesignRule[] = [
  r("button.navigation-link", "component", 900, "ux-pattern-designer", "Navigation without state mutation uses navigation semantics.", c => c.componentIntent === "navigation" && c.interaction === "navigate", { variant: "secondary" }, ["uiforge.button"]),
  r("button.destructive", "component", 1000, "component-designer", "Destructive mutations require destructive action styling.", c => c.destructive === true && c.componentIntent === "action", { variant: "destructive" }, ["uiforge.button"]),
  r("button.primary", "component", 800, "component-designer", "The primary task action uses the primary variant.", c => c.componentIntent === "action" && !c.destructive && (c.existingPrimaryActions ?? 0) === 0, { variant: "primary" }, ["uiforge.button"]),
  r("button.secondary-conflict", "heuristic", 950, "design-critic", "A second primary action is downgraded to secondary.", c => c.componentIntent === "action" && !c.destructive && (c.existingPrimaryActions ?? 0) > 0, { variant: "secondary", message: "Avoid multiple visually equal primary actions in one decision context." }, ["uiforge.button"]),
  r("button.loading", "normative", 1100, "interaction-reviewer", "Non-idempotent submission must prevent duplicate submission while loading.", c => c.loading === true && c.task === "submit", { state: "loading" }, ["uiforge.button"]),
  r("button.disabled", "normative", 1100, "accessibility-reviewer", "Disabled state is explicit when the action cannot currently be invoked.", c => c.disabled === true, { state: "disabled" }, ["uiforge.button"]),
  r("button.icon-name", "normative", 1200, "accessibility-reviewer", "Icon-only or ambiguous actions require an accessible name.", c => c.componentIntent === "action" && !c.accessibleName, { forbidden: true, message: "Action requires an accessible name." }, ["uiforge.button"]),

  r("card.group", "component", 500, "component-designer", "Card groups related information without implying interaction.", c => c.componentIntent === "group" && !c.interactive && !c.selectable, { variant: "default", state: "default" }, ["uiforge.card"]),
  r("card.selectable", "component", 700, "component-designer", "Selectable cards expose selection state.", c => c.selectable === true, { variant: "interactive", state: "selected" }, ["uiforge.card"]),
  r("card.interactive", "component", 700, "interaction-reviewer", "Interactive cards require explicit interaction semantics.", c => c.interactive === true && !c.hasContainedAction, { variant: "interactive" }, ["uiforge.card"]),
  r("card-contained-action", "normative", 1200, "design-critic", "Interactive cards must not hide a second interaction model around contained actions.", c => c.interactive === true && c.hasContainedAction === true, { forbidden: true, message: "Interactive card conflicts with a contained action unless an explicit interaction model exists." }, ["uiforge.card"]),

  r("input.search", "component", 700, "component-designer", "Search fields use the search input variant.", c => c.componentIntent === "field" && c.fieldKind === "search", { variant: "search" }, ["uiforge.input"]),
  r("input.long-form", "normative", 1200, "accessibility-reviewer", "Long-form content should not be represented by a scalar input.", c => c.componentIntent === "field" && c.fieldKind === "long-form", { forbidden: true, message: "Use a long-form text control instead of Input." }, ["uiforge.input"]),
  r("form.submission", "component", 800, "interaction-reviewer", "Related controls submitted as one task belong to a Form.", c => c.componentIntent === "form" && c.task === "submit", { variant: "default", state: c => "submitting" } as never, ["uiforge.form"]),
  r("form.invalid", "normative", 1100, "accessibility-reviewer", "Invalid form submission exposes an invalid state.", c => c.componentIntent === "form" && c.task === "submit" && c.requiredStates?.includes("invalid") === true, { state: "invalid" }, ["uiforge.form"]),

  r("dialog.desktop", "component", 600, "ux-pattern-designer", "Desktop focused interruption uses a dialog.", c => c.componentIntent === "overlay" && c.viewport !== "mobile", { variant: "default", state: "open" }, ["uiforge.dialog"]),
  r("dialog.mobile-sheet", "component", 650, "responsive-designer", "Mobile focused overlays use sheet-style behavior.", c => c.componentIntent === "overlay" && c.viewport === "mobile", { variant: "confirmation", state: "open" }, ["uiforge.dialog"]),
  r("dialog.confirmation", "component", 850, "interaction-reviewer", "Destructive confirmation is an explicit focused task.", c => c.componentIntent === "overlay" && c.destructive === true, { variant: "confirmation", state: "open" }, ["uiforge.dialog"]),

  r("navigation.mobile", "component", 650, "responsive-designer", "Mobile navigation prefers a bottom navigation presentation.", c => c.componentIntent === "navigation" && c.viewport === "mobile" && c.navigationPattern === "bottom", { variant: "default" }, ["uiforge.navigation"]),
  r("navigation.sidebar", "component", 650, "information-architect", "Persistent desktop product navigation may use a sidebar.", c => c.componentIntent === "navigation" && c.viewport !== "mobile" && c.navigationPattern === "sidebar", { variant: "default" }, ["uiforge.sidebar"]),
  r("navigation.tabs", "component", 650, "information-architect", "Peer views in one context use tabs.", c => c.componentIntent === "navigation" && c.navigationPattern === "tabs", { variant: "default" }, ["uiforge.tabs"]),
  r("navigation.graph", "graph", 1000, "interaction-reviewer", "Navigation decisions require a graph destination.", c => c.componentIntent === "navigation" && c.interaction === "navigate", { requiresGraph: true }, ["uiforge.navigation", "uiforge.sidebar", "uiforge.tabs"]),

  r("graph.action", "graph", 900, "interaction-reviewer", "Mutating or submitting actions may emit a graph requirement.", c => c.componentIntent === "action" && c.interaction !== "none" && c.graphDestinationId !== undefined, { requiresGraph: true }, ["uiforge.button"]),
];

export function matchingRules(context: DecisionContext, componentId: ComponentId): DesignRule[] {
  return componentRules
    .filter(rule => (!rule.componentIds || rule.componentIds.includes(componentId)) && rule.matches(context))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
}
export function registrySupports(registry: ComponentRegistry, componentId: ComponentId): boolean {
  return Boolean(registry.components[componentId]);
}
