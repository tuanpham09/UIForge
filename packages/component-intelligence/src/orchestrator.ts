import type { ComponentRegistry } from "@uiforge/component-registry";
import { matchingRules, registrySupports } from "./rules";
import { specialistContracts } from "./specialists";
import { validateDecision } from "./validate";
import type { ComponentDecision, DecisionContext, DecisionInput, OrchestratorResult, SpecialistId } from "./types";

const stableId = (context: DecisionContext, componentId: string, variant: string, state: string) =>
  [context.screenId, context.nodeId ?? "screen", componentId, variant, state].join(":");

function specialistsFor(context: DecisionContext): SpecialistId[] {
  const ids: SpecialistId[] = ["component-designer"];
  if (context.viewport === "mobile") ids.push("responsive-designer");
  if (context.interaction && context.interaction !== "none") ids.push("interaction-reviewer");
  if (context.accessibleName === undefined || context.componentIntent === "navigation") ids.push("accessibility-reviewer");
  ids.push("design-critic");
  return ids.filter(id => specialistContracts.some(s => s.id === id));
}

function chooseComponent(context: DecisionContext, registry: ComponentRegistry): string | undefined {
  const preferred: string[] =
    context.componentIntent === "action" ? ["uiforge.button"] :
    context.componentIntent === "field" ? ["uiforge.input"] :
    context.componentIntent === "group" ? ["uiforge.card"] :
    context.componentIntent === "feedback" ? ["uiforge.alert"] :
    context.componentIntent === "navigation" ? ["uiforge.navigation"] :
    context.componentIntent === "data" ? ["uiforge.list", "uiforge.table"] :
    context.componentIntent === "overlay" ? ["uiforge.dialog"] : [];
  return preferred.find(id => registrySupports(registry, id));
}

export function decide(input: DecisionInput): OrchestratorResult {
  const { context, registry } = input;
  const componentId = chooseComponent(context, registry);
  if (!componentId) return { ok: false, findings: ["No registered component matches the semantic intent."] };

  const rules = matchingRules(context, componentId);
  const forbidden = rules.find(rule => rule.outcome.forbidden);
  if (forbidden) return { ok: false, findings: [forbidden.outcome.message ?? forbidden.description] };

  const variant = rules.find(rule => rule.outcome.variant)?.outcome.variant
    ?? registry.components[componentId].variants[0]?.id
    ?? "default";
  const state = rules.find(rule => rule.outcome.state)?.outcome.state
    ?? (context.loading ? "loading" : context.disabled ? "disabled" : "default");

  const graphRules = rules.filter(rule => rule.outcome.requiresGraph);
  const graphRequirements = graphRules.map(() => ({
    trigger: context.task === "submit" ? "submit" as const : context.task === "select" ? "select" as const : context.componentIntent === "overlay" ? "open" as const : "click" as const,
    kind: context.graphTransitionKind ?? "navigation" as const,
    destinationId: context.graphDestinationId,
  }));

  const ruleIds = rules.map(rule => rule.id);
  const skillIds = (input.skills ?? []).map(skill => skill.id);
  const specialists = specialistsFor(context);
  const preliminary = {
    version: "uiforge.component-intelligence/v1" as const,
    componentId,
    variant,
    state,
    ruleIds,
    skillIds,
    specialists,
    graphRequirements,
    record: {
      decisionId: stableId(context, componentId, variant, state),
      kind: "component" as const,
      screenId: context.screenId,
      nodeId: context.nodeId,
      componentId,
      variant,
      state,
      triggeringContext: context,
      ruleIds,
      skillIds,
      rationale: rules.map(r => r.description).join(" ") || "Selected from semantic component intent and registry defaults.",
      constraintsChecked: ["registry", "rule-precedence", "interaction", "responsive", "accessibility"],
      validation: { valid: true, findings: [] },
    },
  };
  const findings = validateDecision(preliminary, context, registry);
  if (findings.length) {
    preliminary.record.validation = { valid: false, findings };
    return { ok: false, findings };
  }
  return { ok: true, decision: preliminary };
}
