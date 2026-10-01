// biome-ignore-all format: semantic domain contract formatting is CI-invariant
import type { SpecialistContract } from "./types";

export const specialistContracts: readonly SpecialistContract[] = [
  { id: "information-architect", responsibility: "Navigation, hierarchy, screen decomposition and grouping.", capabilities: ["read-product-intent", "read-navigation"], canMutate: false, discovery: [] },
  { id: "ux-pattern-designer", responsibility: "Task and interaction pattern selection.", capabilities: ["read-product-intent", "read-experience-graph"], canMutate: false, discovery: [] },
  { id: "component-designer", responsibility: "Concrete component, variant, anatomy and state selection.", capabilities: ["read-component-registry", "propose-component-decision"], canMutate: false, discovery: [] },
  { id: "visual-designer", responsibility: "Typography, spacing, color-role and composition requirements.", capabilities: ["read-design-strategy", "read-color-strategy"], canMutate: false, discovery: [] },
  { id: "responsive-designer", responsibility: "Breakpoint and responsive interaction decisions.", capabilities: ["read-viewport", "read-component-rules"], canMutate: false, discovery: [] },
  { id: "accessibility-reviewer", responsibility: "Accessible name, keyboard, focus and non-color semantics.", capabilities: ["read-component-registry", "validate-accessibility"], canMutate: false, discovery: [] },
  { id: "interaction-reviewer", responsibility: "Triggers, states and Experience Graph requirements.", capabilities: ["read-experience-graph", "validate-interaction"], canMutate: false, discovery: [] },
  { id: "design-critic", responsibility: "Read-only inconsistency, overuse and anti-pattern review.", capabilities: ["read-component-registry", "read-decision"], canMutate: false, discovery: [] },
];

export const specialistById = Object.fromEntries(
  specialistContracts.map((specialist) => [specialist.id, specialist]),
);
