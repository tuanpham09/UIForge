import { validateComponentRegistry } from "@uiforge/component-registry";
import { validateTokenSet } from "@uiforge/design-tokens";
import { validateUIDocument } from "@uiforge/ui-schema";
import type {
  Flow,
  ProjectSnapshot,
  ValidationFinding,
  ValidationReport,
} from "./types";

export function validateFlow(
  project: ProjectSnapshot,
  flow: Flow,
): ValidationReport {
  const findings: ValidationFinding[] = [];
  const screenIds = new Set(
    project.document.screens.map((screen) => screen.id),
  );
  const nodeIds = new Set(Object.keys(project.document.nodes));

  if (!screenIds.has(flow.startingPoint.screenId)) {
    findings.push({
      code: "MISSING_STARTING_SCREEN",
      path: "startingPoint.screenId",
      message:
        "Starting screen '" + flow.startingPoint.screenId + "' does not exist.",
      severity: "error",
    });
  }
  for (const transition of flow.transitions) {
    if (!screenIds.has(transition.source.screenId))
      findings.push({
        code: "MISSING_SOURCE_SCREEN",
        path: "transitions." + transition.id + ".source.screenId",
        message:
          "Source screen '" + transition.source.screenId + "' does not exist.",
        severity: "error",
      });
    if (transition.source.nodeId && !nodeIds.has(transition.source.nodeId))
      findings.push({
        code: "MISSING_SOURCE_NODE",
        path: "transitions." + transition.id + ".source.nodeId",
        message:
          "Source node '" + transition.source.nodeId + "' does not exist.",
        severity: "error",
      });
    if (
      transition.destination.screenId &&
      !screenIds.has(transition.destination.screenId)
    )
      findings.push({
        code: "MISSING_DESTINATION_SCREEN",
        path: "transitions." + transition.id + ".destination.screenId",
        message:
          "Destination screen '" +
          transition.destination.screenId +
          "' does not exist.",
        severity: "error",
      });
    if (
      transition.destination.nodeId &&
      !nodeIds.has(transition.destination.nodeId)
    )
      findings.push({
        code: "MISSING_DESTINATION_NODE",
        path: "transitions." + transition.id + ".destination.nodeId",
        message:
          "Destination node '" +
          transition.destination.nodeId +
          "' does not exist.",
        severity: "error",
      });
    if (!transition.trigger || !transition.action)
      findings.push({
        code: "INCOMPLETE_TRANSITION",
        path: "transitions." + transition.id,
        message: "Transition requires explicit trigger and action.",
        severity: "error",
      });
  }
  return { valid: findings.length === 0, findings };
}

export function validateProject(project: ProjectSnapshot): ValidationReport {
  const findings: ValidationFinding[] = [];
  try {
    validateUIDocument(project.document);
  } catch (error) {
    findings.push({
      code: "UI_SCHEMA_INVALID",
      path: "document",
      message: error instanceof Error ? error.message : String(error),
      severity: "error",
    });
  }
  for (const issue of validateComponentRegistry(project.registry).issues)
    findings.push({
      code: issue.code,
      path: issue.path,
      message: issue.message,
      severity: "error",
    });
  for (const issue of validateTokenSet(project.tokens))
    findings.push({
      code: issue.code,
      path: issue.path,
      message: issue.message,
      severity: "error",
    });
  for (const flow of project.flows)
    findings.push(...validateFlow(project, flow).findings);
  return { valid: findings.length === 0, findings };
}
