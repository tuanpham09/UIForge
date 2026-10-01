
import {
  createMcpHandler,
  McpServer,
  type CallToolResult,
  ResourceTemplate,
} from "@modelcontextprotocol/server";
import {
  codeMappingSet,
  resolveCodeMapping,
  validateComponentRegistry,
} from "@uiforge/component-registry";
import { validateTokenSet } from "@uiforge/design-tokens";
import { validateUIDocument } from "@uiforge/ui-schema";
import * as z from "zod/v4";
import { getLayoutTree, sampleProjectProvider } from "./sample-project";
import {
  type Flow,
  MCP_CONTRACT_VERSION,
  MCP_SERVER_VERSION,
  type ProjectProvider,
  type ProjectSnapshot,
  type ResponseEnvelope,
  type ScreenConnection,
  type ValidationFinding,
  type ValidationReport,
} from "./types";

const PROJECT_SCOPE = z.object({ projectId: z.string().min(1).max(128) });
const SCREEN_SCOPE = PROJECT_SCOPE.extend({
  screenId: z.string().min(1).max(128),
});
const COMPONENT_SCOPE = PROJECT_SCOPE.extend({
  componentId: z.string().min(1).max(128),
});
const FLOW_SCOPE = PROJECT_SCOPE.extend({ flowId: z.string().min(1).max(128) });
const JOURNEY_SCOPE = PROJECT_SCOPE.extend({
  journeyId: z.string().min(1).max(128),
});
const MAPPING_SCOPE = COMPONENT_SCOPE.extend({
  framework: z.enum(["react"]).optional(),
  runtime: z.enum(["nextjs"]).optional(),
  library: z.enum(["shadcn-ui", "base-ui"]).optional(),
});
const envelopeSchema = z.object({
  schemaVersion: z.string(),
  mcpVersion: z.literal(MCP_CONTRACT_VERSION),
  revision: z.number(),
  updatedAt: z.string(),
  projectId: z.string(),
  data: z.unknown(),
  warnings: z.array(z.string()).optional(),
});

function envelope<T>(
  project: ProjectSnapshot,
  data: T,
  warnings?: string[],
): ResponseEnvelope<T> {
  return {
    schemaVersion: project.document.schemaVersion,
    mcpVersion: MCP_CONTRACT_VERSION,
    revision: project.revision,
    updatedAt: project.updatedAt,
    projectId: project.projectId,
    data,
    ...(warnings && warnings.length ? { warnings } : {}),
  };
}

function textResult<T>(value: ResponseEnvelope<T>, isError = false): CallToolResult {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
    structuredContent: value,
    ...(isError ? { isError: true } : {}),
  };
}

function errorResult(code: string, message: string): CallToolResult {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ error: { code, message } }),
      },
    ],
    isError: true,
  };
}

function withProject<T>(
  provider: ProjectProvider,
  projectId: string,
  fn: (project: ProjectSnapshot) => T,
): T | ReturnType<typeof errorResult> {
  const project = provider.getProject(projectId);
  if (!project) {
    return errorResult(
      "PROJECT_SCOPE_NOT_FOUND",
      "Project scope '" + projectId + "' is not available.",
    );
  }
  return fn(project);
}

function screenConnections(project: ProjectSnapshot): ScreenConnection[] {
  return Object.values(project.document.nodes)
    .filter((node) => node.interaction?.interactive && node.interaction.action)
    .map((node) => ({
      sourceScreenId: node.screenId,
      sourceNodeId: node.id,
      trigger: node.interaction?.trigger ?? "unknown",
      action: node.interaction?.action ?? "unknown",
      ...(node.interaction?.targetScreenId
        ? { destinationScreenId: node.interaction.targetScreenId }
        : {}),
      ...(node.interaction?.targetNodeId
        ? { destinationNodeId: node.interaction.targetNodeId }
        : {}),
    }));
}

function validateFlow(project: ProjectSnapshot, flow: Flow): ValidationReport {
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
    if (!screenIds.has(transition.source.screenId)) {
      findings.push({
        code: "MISSING_SOURCE_SCREEN",
        path: "transitions." + transition.id + ".source.screenId",
        message:
          "Source screen '" + transition.source.screenId + "' does not exist.",
        severity: "error",
      });
    }
    if (transition.source.nodeId && !nodeIds.has(transition.source.nodeId)) {
      findings.push({
        code: "MISSING_SOURCE_NODE",
        path: "transitions." + transition.id + ".source.nodeId",
        message:
          "Source node '" + transition.source.nodeId + "' does not exist.",
        severity: "error",
      });
    }
    if (
      transition.destination.screenId &&
      !screenIds.has(transition.destination.screenId)
    ) {
      findings.push({
        code: "MISSING_DESTINATION_SCREEN",
        path: "transitions." + transition.id + ".destination.screenId",
        message:
          "Destination screen '" +
          transition.destination.screenId +
          "' does not exist.",
        severity: "error",
      });
    }
    if (
      transition.destination.nodeId &&
      !nodeIds.has(transition.destination.nodeId)
    ) {
      findings.push({
        code: "MISSING_DESTINATION_NODE",
        path: "transitions." + transition.id + ".destination.nodeId",
        message:
          "Destination node '" +
          transition.destination.nodeId +
          "' does not exist.",
        severity: "error",
      });
    }
    if (!transition.trigger || !transition.action) {
      findings.push({
        code: "INCOMPLETE_TRANSITION",
        path: "transitions." + transition.id,
        message: "Transition requires explicit trigger and action.",
        severity: "error",
      });
    }
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

  for (const issue of validateComponentRegistry(project.registry).issues) {
    findings.push({
      code: issue.code,
      path: issue.path,
      message: issue.message,
      severity: "error",
    });
  }

  for (const issue of validateTokenSet(project.tokens)) {
    findings.push({
      code: issue.code,
      path: issue.path,
      message: issue.message,
      severity: "error",
    });
  }

  for (const flow of project.flows) {
    findings.push(...validateFlow(project, flow).findings);
  }

  return { valid: findings.length === 0, findings };
}

function registerResources(server: McpServer, provider: ProjectProvider) {
  const registerJsonTemplate = (
    name: string,
    template: string,
    title: string,
    read: (
      project: ProjectSnapshot,
      variables: Record<string, string>,
    ) => unknown,
  ) => {
    server.registerResource(
      name,
      new ResourceTemplate(template, { list: async () => ({ resources: [] }) }),
      { title, mimeType: "application/json" },
      async (uri, variables) => {
        const projectId = variables.projectId;
        const project = provider.getProject(projectId);
        if (!project) {
          return {
            contents: [
              {
                uri: uri.href,
                mimeType: "application/json",
                text: JSON.stringify({
                  error: { code: "PROJECT_SCOPE_NOT_FOUND", projectId },
                }),
              },
            ],
          };
        }
        const body = envelope(project, read(project, normalizedVariables));
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(body),
            },
          ],
        };
      },
    );
  };

  server.registerResource(
    "project",
    "uiforge://projects/sample-project",
    { title: "UIForge project summary", mimeType: "application/json" },
    async (uri) => {
      const project = provider.getProject("sample-project");
      if (!project) throw new Error("sample project unavailable");
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(
              envelope(project, {
                id: project.projectId,
                name: project.document.metadata.name,
                description: project.document.metadata.description,
                screenCount: project.document.screens.length,
                revision: project.revision,
              }),
            ),
          },
        ],
      };
    },
  );

  registerJsonTemplate(
    "screens",
    "uiforge://projects/{projectId}/screens",
    "Project screens",
    (project) =>
      project.document.screens.map(
        ({ id, name, route, rootNodeId, nodeIds, viewport }) => ({
          id,
          name,
          route,
          rootNodeId,
          nodeCount: nodeIds.length,
          viewport,
        }),
      ),
  );
  registerJsonTemplate(
    "screen",
    "uiforge://projects/{projectId}/screens/{screenId}",
    "Screen",
    (project, vars) =>
      project.document.screens.find(
        (screen) => screen.id === vars.screenId,
      ) ?? { error: "SCREEN_NOT_FOUND" },
  );
  registerJsonTemplate(
    "component",
    "uiforge://projects/{projectId}/components/{componentId}",
    "Component",
    (project, vars) =>
      project.registry.components[vars.componentId] ?? {
        error: "COMPONENT_NOT_FOUND",
      },
  );
  registerJsonTemplate(
    "tokens",
    "uiforge://projects/{projectId}/tokens",
    "Design tokens",
    (project) => ({
      version: project.tokens.version,
      semantic: project.tokens.semantic,
    }),
  );
  registerJsonTemplate(
    "assets",
    "uiforge://projects/{projectId}/assets",
    "Project assets",
    (project) => project.document.assets,
  );
  registerJsonTemplate(
    "flows",
    "uiforge://projects/{projectId}/flows",
    "Project flows",
    (project) =>
      project.flows.map((flow) => ({
        id: flow.id,
        name: flow.name,
        startingPoint: flow.startingPoint,
        transitionCount: flow.transitions.length,
      })),
  );
  registerJsonTemplate(
    "flow",
    "uiforge://projects/{projectId}/flows/{flowId}",
    "Flow",
    (project, vars) =>
      project.flows.find((flow) => flow.id === vars.flowId) ?? {
        error: "FLOW_NOT_FOUND",
      },
  );
  registerJsonTemplate(
    "journey",
    "uiforge://projects/{projectId}/journeys/{journeyId}",
    "User journey",
    (project, vars) =>
      project.journeys.find((journey) => journey.id === vars.journeyId) ?? {
        error: "JOURNEY_NOT_FOUND",
      },
  );
  registerJsonTemplate(
    "screen-connections",
    "uiforge://projects/{projectId}/screen-connections",
    "Screen connections",
    screenConnections,
  );
}

export function createMcpServer(
  provider: ProjectProvider = sampleProjectProvider,
): McpServer {
  const server = new McpServer(
    {
      name: "uiforge",
      title: "UIForge Read-only MCP",
      version: MCP_SERVER_VERSION,
      description:
        "Scoped semantic read access to UIForge designs, components, tokens and flows.",
    },
    { capabilities: { tools: {}, resources: { listChanged: false } } },
  );

  const registerReadTool = <T extends z.ZodTypeAny>(
    name: string,
    description: string,
    inputSchema: T,
    handler: (args: z.infer<T>) => CallToolResult | Promise<CallToolResult>,
  ) => {
    server.registerTool(
      name,
      {
        title: name.replaceAll("_", " "),
        description,
        inputSchema,
        outputSchema: envelopeSchema,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (args) => handler(args),
    );
  };

  registerReadTool(
    "get_project",
    "Read a scoped project summary.",
    PROJECT_SCOPE,
    ({ projectId }) =>
      withProject(provider, projectId, (project) =>
        textResult(
          envelope(project, {
            id: project.projectId,
            name: project.document.metadata.name,
            description: project.document.metadata.description,
            screenCount: project.document.screens.length,
            revision: project.revision,
          }),
        ),
      ),
  );

  registerReadTool(
    "get_screen",
    "Read one screen and its semantic nodes.",
    SCREEN_SCOPE,
    ({ projectId, screenId }) =>
      withProject(provider, projectId, (project) => {
        const screen = project.document.screens.find(
          (item) => item.id === screenId,
        );
        return screen
          ? textResult(
              envelope(project, {
                screen,
                nodes: screen.nodeIds
                  .map((id) => project.document.nodes[id])
                  .filter(Boolean),
              }),
            )
          : textResult(
              envelope(project, { error: "SCREEN_NOT_FOUND", screenId }),
              true,
            );
      }),
  );

  registerReadTool(
    "get_layout_tree",
    "Read a semantic layout tree without canvas geometry.",
    SCREEN_SCOPE,
    ({ projectId, screenId }) =>
      withProject(provider, projectId, (project) => {
        const tree = getLayoutTree(project.document, screenId);
        return tree
          ? textResult(envelope(project, tree))
          : textResult(
              envelope(project, { error: "SCREEN_NOT_FOUND", screenId }),
              true,
            );
      }),
  );

  registerReadTool(
    "get_component",
    "Read one semantic component definition.",
    COMPONENT_SCOPE,
    ({ projectId, componentId }) =>
      withProject(provider, projectId, (project) => {
        const component = project.registry.components[componentId];
        return component
          ? textResult(envelope(project, component))
          : textResult(
              envelope(project, { error: "COMPONENT_NOT_FOUND", componentId }),
              true,
            );
      }),
  );

  registerReadTool(
    "get_component_registry",
    "Read the semantic component registry.",
    PROJECT_SCOPE,
    ({ projectId }) =>
      withProject(provider, projectId, (project) =>
        textResult(
          envelope(project, {
            version: project.registry.version,
            components: project.registry.components,
          }),
        ),
      ),
  );

  registerReadTool(
    "get_design_tokens",
    "Read semantic design tokens, optionally filtered by kind.",
    PROJECT_SCOPE.extend({
      kind: z
        .enum([
          "color",
          "spacing",
          "typography",
          "radius",
          "shadow",
          "border",
          "breakpoint",
          "motion",
        ])
        .optional(),
    }),
    ({ projectId, kind }) =>
      withProject(provider, projectId, (project) =>
        textResult(
          envelope(project, {
            version: project.tokens.version,
            semantic: Object.fromEntries(
              Object.entries(project.tokens.semantic).filter(
                ([, token]) => !kind || token.kind === kind,
              ),
            ),
          }),
        ),
      ),
  );

  registerReadTool(
    "get_code_mapping",
    "Resolve a semantic component to a verified code mapping.",
    MAPPING_SCOPE,
    ({ projectId, componentId, framework, runtime, library }) =>
      withProject(provider, projectId, (project) =>
        textResult(
          envelope(project, {
            version: codeMappingSet.version,
            resolution: resolveCodeMapping(componentId, {
              framework,
              runtime,
              library,
            }),
          }),
        ),
      ),
  );

  registerReadTool(
    "get_responsive_rules",
    "Read explicit responsive rules for a screen or one node.",
    SCREEN_SCOPE.extend({ nodeId: z.string().min(1).max(128).optional() }),
    ({ projectId, screenId, nodeId }) =>
      withProject(provider, projectId, (project) => {
        const screen = project.document.screens.find(
          (item) => item.id === screenId,
        );
        if (!screen)
          return textResult(
            envelope(project, { error: "SCREEN_NOT_FOUND", screenId }),
            true,
          );
        const ids = nodeId ? [nodeId] : screen.nodeIds;
        const rules = ids.flatMap((id) =>
          (project.document.nodes[id]?.responsive ?? []).map((rule) => ({
            nodeId: id,
            ...rule,
          })),
        );
        return textResult(envelope(project, { screenId, rules }));
      }),
  );

  registerReadTool(
    "get_code_spec",
    "Read the code specification projection when available.",
    PROJECT_SCOPE,
    ({ projectId }) =>
      withProject(provider, projectId, (project) =>
        textResult(
          envelope(
            project,
            project.codeSpec ?? {
              status: "not_available",
              reason: "Code specification is owned by #13.",
            },
          ),
        ),
      ),
  );

  registerReadTool(
    "get_flows",
    "Read scoped flow summaries without unrelated screens.",
    PROJECT_SCOPE,
    ({ projectId }) =>
      withProject(provider, projectId, (project) =>
        textResult(
          envelope(
            project,
            project.flows.map((flow) => ({
              id: flow.id,
              name: flow.name,
              startingPoint: flow.startingPoint,
              transitionCount: flow.transitions.length,
            })),
          ),
        ),
      ),
  );

  registerReadTool(
    "get_flow",
    "Read one complete semantic flow.",
    FLOW_SCOPE,
    ({ projectId, flowId }) =>
      withProject(provider, projectId, (project) => {
        const flow = project.flows.find((item) => item.id === flowId);
        return flow
          ? textResult(envelope(project, flow))
          : textResult(
              envelope(project, { error: "FLOW_NOT_FOUND", flowId }),
              true,
            );
      }),
  );

  registerReadTool(
    "get_user_journey",
    "Read one user journey.",
    JOURNEY_SCOPE,
    ({ projectId, journeyId }) =>
      withProject(provider, projectId, (project) => {
        const journey = project.journeys.find((item) => item.id === journeyId);
        return journey
          ? textResult(envelope(project, journey))
          : textResult(
              envelope(project, { error: "JOURNEY_NOT_FOUND", journeyId }),
              true,
            );
      }),
  );

  registerReadTool(
    "get_transitions",
    "Read transitions for one flow or all flows.",
    PROJECT_SCOPE.extend({ flowId: z.string().min(1).max(128).optional() }),
    ({ projectId, flowId }) =>
      withProject(provider, projectId, (project) => {
        const flows = flowId
          ? project.flows.filter((flow) => flow.id === flowId)
          : project.flows;
        return textResult(
          envelope(
            project,
            flows.flatMap((flow) => flow.transitions),
          ),
        );
      }),
  );

  registerReadTool(
    "get_screen_connections",
    "Read explicit screen/node connections.",
    PROJECT_SCOPE.extend({ screenId: z.string().min(1).max(128).optional() }),
    ({ projectId, screenId }) =>
      withProject(provider, projectId, (project) =>
        textResult(
          envelope(
            project,
            screenConnections(project).filter(
              (edge) => !screenId || edge.sourceScreenId === screenId,
            ),
          ),
        ),
      ),
  );

  registerReadTool(
    "get_navigation_map",
    "Read a compact navigation graph.",
    PROJECT_SCOPE,
    ({ projectId }) =>
      withProject(provider, projectId, (project) =>
        textResult(
          envelope(project, {
            nodes: project.document.screens.map((screen) => ({
              id: screen.id,
              name: screen.name,
              route: screen.route,
            })),
            edges: screenConnections(project)
              .filter((edge) => edge.destinationScreenId)
              .map((edge) => ({
                source: edge.sourceScreenId,
                destination: edge.destinationScreenId,
                trigger: edge.trigger,
                action: edge.action,
              })),
          }),
        ),
      ),
  );

  registerReadTool(
    "validate_design",
    "Validate UI Schema, component registry and design tokens.",
    PROJECT_SCOPE,
    ({ projectId }) =>
      withProject(provider, projectId, (project) =>
        textResult(envelope(project, validateProject(project))),
      ),
  );

  registerReadTool(
    "validate_flow",
    "Validate a flow and return structured findings.",
    FLOW_SCOPE,
    ({ projectId, flowId }) =>
      withProject(provider, projectId, (project) => {
        const flow = project.flows.find((item) => item.id === flowId);
        return flow
          ? textResult(envelope(project, validateFlow(project, flow)))
          : textResult(
              envelope(project, { error: "FLOW_NOT_FOUND", flowId }),
              true,
            );
      }),
  );

  registerResources(server, provider);
  return server;
}

export const createHttpHandler = (
  provider: ProjectProvider = sampleProjectProvider,
) => createMcpHandler(() => createMcpServer(provider), { legacy: "stateless" });
