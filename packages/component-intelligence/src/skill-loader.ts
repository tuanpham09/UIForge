// biome-ignore-all format: semantic domain contract formatting is CI-invariant
import type { DecisionContext, SkillLoader, SkillMetadata, SkillReference } from "./types";

const catalog: readonly SkillMetadata[] = [
  { id: "skill.navigation", version: "1", purpose: "Navigation and hierarchy decisions.", summary: "Navigation patterns and destination semantics.", ruleIds: ["navigation.graph", "navigation.sidebar", "navigation.mobile"] },
  { id: "skill.responsive", version: "1", purpose: "Viewport-specific component behavior.", summary: "Responsive reflow and interaction strategy.", ruleIds: ["dialog.mobile-sheet", "navigation.mobile"] },
  { id: "skill.accessibility", version: "1", purpose: "Accessible names, focus and semantic interaction.", summary: "Normative accessibility checks.", ruleIds: ["button.icon-name", "button.loading", "input.long-form"] },
  { id: "skill.forms", version: "1", purpose: "Form and field task behavior.", summary: "Form grouping and validation states.", ruleIds: ["form.submission", "form.invalid", "input.search"] },
];

export const defaultSkillLoader: SkillLoader = {
  discover(context: DecisionContext): SkillReference[] {
    const ids = context.componentIntent === "navigation" ? ["skill.navigation"] :
      context.componentIntent === "form" || context.componentIntent === "field" ? ["skill.forms"] :
      context.componentIntent === "overlay" ? ["skill.responsive"] : ["skill.accessibility"];
    return catalog.filter(skill => ids.includes(skill.id)).map(({ id, version, purpose }) => ({ id, version, purpose }));
  },
  load(id: string, version: string): SkillMetadata {
    const skill = catalog.find(item => item.id === id && item.version === version);
    if (!skill) throw new Error(`Unknown skill: ${id}@${version}`);
    return skill;
  },
};
