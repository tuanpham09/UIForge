// biome-ignore-all format: MCP mutation schemas are kept grouped by tool contract for review.
// biome-ignore-all assist/source/organizeImports: Import grouping mirrors the MCP server runtime layers.
import {
  type CallToolResult,
  createMcpHandler,
  McpServer,
  ResourceTemplate,
  type StandardSchemaWithJSON,
} from "@modelcontextprotocol/server";
import { codeMappingSet, resolveCodeMapping } from "@uiforge/component-registry";
import * as z from "zod/v4";
import { getLayoutTree, sampleProjectProvider } from "./sample-project";
import {
  MutationSecurity,
  createDefaultAuthorization,
  mutateCreateComponentInstance,
  mutateCreateScreen,
  mutateMoveNode,
  type MoveNodeInput,
  mutateUpdateNode,
  mutateUpdateScreen,
  mutateUpdateToken,
  type AuthorizationContext,
  type CreateComponentInstanceInput,
  type CreateScreenInput,
  type MutableProjectProvider,
  type MutationEnvelope,
  type UpdateNodeInput,
  type UpdateScreenInput,
  type UpdateTokenInput,
} from "./mutations";
import { validateFlow, validateProject } from "./validation";
import {
  MCP_CONTRACT_VERSION,
  MCP_SERVER_VERSION,
  type ProjectProvider,
  type ProjectSnapshot,
  type ResponseEnvelope,
  type ScreenConnection,
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
    ...(warnings?.length ? { warnings } : {}),
  };
}

function textResult<T>(
  value: ResponseEnvelope<T>,
  isError = false,
): CallToolResult {
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
      `Project scope '${projectId}' is not available.`,
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
        const normalizedVariables = Object.fromEntries(
          Object.entries(variables)
            .map(([key, value]) => [
              key,
              Array.isArray(value) ? value[0] : value,
            ])
            .filter(([, value]) => typeof value === "string"),
        ) as Record<string, string>;
        const projectId = normalizedVariables.projectId;
        if (!projectId) {
          return {
            contents: [
              {
                uri: uri.href,
                mimeType: "application/json",
                text: JSON.stringify({
                  error: { code: "PROJECT_SCOPE_REQUIRED" },
                }),
              },
            ],
          };
        }
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
    (project, vars) => {
      const screenId = vars.screenId;
      return screenId
        ? (project.document.screens.find(
            (screen) => screen.id === screenId,
          ) ?? { error: "SCREEN_NOT_FOUND" })
        : { error: "SCREEN_ID_REQUIRED" };
    },
  );
  registerJsonTemplate(
    "component",
    "uiforge://projects/{projectId}/components/{componentId}",
    "Component",
    (project, vars) => {
      const componentId = vars.componentId;
      return componentId
        ? (project.registry.components[componentId] ?? {
            error: "COMPONENT_NOT_FOUND",
          })
        : { error: "COMPONENT_ID_REQUIRED" };
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
    (project, vars) => {
      const flowId = vars.flowId;
      return flowId
        ? (project.flows.find((flow) => flow.id === flowId) ?? {
            error: "FLOW_NOT_FOUND",
          })
        : { error: "FLOW_ID_REQUIRED" };
    },
  );
  registerJsonTemplate(
    "journey",
    "uiforge://projects/{projectId}/journeys/{journeyId}",
    "User journey",
    (project, vars) => {
      const journeyId = vars.journeyId;
      return journeyId
        ? (project.journeys.find((journey) => journey.id === journeyId) ?? {
            error: "JOURNEY_NOT_FOUND",
          })
        : { error: "JOURNEY_ID_REQUIRED" };
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
  auth: AuthorizationContext = createDefaultAuthorization(),
  mutationProvider?: MutableProjectProvider,
  mutationSecurity = new MutationSecurity(),
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

  const registerReadTool = <T extends z.ZodObject<z.ZodRawShape>>(
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
        inputSchema: inputSchema as unknown as StandardSchemaWithJSON,
        outputSchema: envelopeSchema,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (args) => handler(args as z.infer<T>),
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

  if (mutationProvider && auth.capabilities.length > 0) {
    const registerMutationTool = <T extends z.ZodObject<z.ZodRawShape>>(
      name: string,
      description: string,
      inputSchema: T,
      operation: string,
      capability: "design:write" | "design:structure" | "design:tokens",
      mutate: (input: z.infer<T>) => (project: ProjectSnapshot) => ProjectSnapshot,
    ) => {
      server.registerTool(
        name,
        {
          title: name.replaceAll("_", " "),
          description,
          inputSchema: inputSchema as unknown as StandardSchemaWithJSON,
          outputSchema: z.object({
            operation: z.string(),
            idempotencyKey: z.string(),
            revision: z.number(),
            replayed: z.boolean(),
            auditEventId: z.string(),
            validation: z.object({
              valid: z.boolean(),
              findings: z.array(z.object({
                code: z.string(),
                path: z.string(),
                message: z.string(),
                severity: z.enum(["error", "warning"]),
              })),
            }),
          }),
          annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
          },
        },
        async (args) => {
          const mutationInput = args as z.infer<T> & MutationEnvelope;
          const result = mutationSecurity.execute(
            mutationProvider,
            auth,
            mutationInput,
            capability,
            operation,
            mutate(args as z.infer<T>),
          );
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result) }],
            structuredContent: result,
            ...(result.validation.valid ? {} : { isError: true }),
          };
        },
      );
    };

    const mutationBase = z.object({
      projectId: z.string().min(1).max(128),
      baseRevision: z.number().int().nonnegative(),
      idempotencyKey: z.string().min(8).max(128),
    });

    registerMutationTool(
      "create_screen",
      "Create a semantic screen with a validated root node.",
      mutationBase.extend({
        screenId: z.string().min(1).max(128),
        name: z.string().min(1).max(200),
        route: z.string().max(500).optional(),
        rootNodeId: z.string().min(1).max(128),
        rootLayout: z.object({
          mode: z.enum(["stack", "flex", "grid", "absolute"]),
          direction: z.enum(["row", "column"]).optional(),
        }).optional(),
        metadata: z.record(z.string(), z.string()).optional(),
      }),
      "create_screen",
      "design:structure",
      (input) => (project) => mutateCreateScreen(project, input as CreateScreenInput),
    );

    registerMutationTool(
      "update_screen",
      "Update editable semantic screen metadata.",
      mutationBase.extend({
        screenId: z.string().min(1).max(128),
        patch: z.object({
          name: z.string().min(1).max(200).optional(),
          route: z.string().max(500).optional(),
          metadata: z.record(z.string(), z.string()).optional(),
        }),
      }),
      "update_screen",
      "design:write",
      (input) => (project) => mutateUpdateScreen(project, input as UpdateScreenInput),
    );

    registerMutationTool(
      "create_component_instance",
      "Create a registry-backed component instance inside an existing parent.",
      mutationBase.extend({
        nodeId: z.string().min(1).max(128),
        screenId: z.string().min(1).max(128),
        parentId: z.string().min(1).max(128),
        registryId: z.string().min(1).max(128),
        variant: z.string().max(128).optional(),
        props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
        type: z.enum(["section","text","image","icon","button","link","input","select","checkbox","radio","list","list-item","table","card","dialog-trigger","custom"]).optional(),
        content: z.object({
          text: z.string().optional(),
          placeholder: z.string().optional(),
          alt: z.string().optional(),
          src: z.string().optional(),
          value: z.string().optional(),
          label: z.string().optional(),
          description: z.string().optional(),
        }).optional(),
      }),
      "create_component_instance",
      "design:structure",
      (input) => (project) => mutateCreateComponentInstance(project, input as CreateComponentInstanceInput),
    );

    registerMutationTool(
      "update_node",
      "Patch one semantic node without changing its identity or screen.",
      mutationBase.extend({
        nodeId: z.string().min(1).max(128),
        patch: z.object({
          layout: z
            .object({
              mode: z.enum(["stack", "flex", "grid", "absolute"]),
              direction: z.enum(["row", "column"]).optional(),
            })
            .optional(),
          editor: z
            .object({
              x: z.number().optional(),
              y: z.number().optional(),
              width: z.number().optional(),
              height: z.number().optional(),
              zIndex: z.number().optional(),
            })
            .optional(),
          content: z
            .object({
              text: z.string().optional(),
              placeholder: z.string().optional(),
              alt: z.string().optional(),
              src: z.string().optional(),
              value: z.string().optional(),
              label: z.string().optional(),
              description: z.string().optional(),
              data: z.record(
                z.string(),
                z.union([z.string(), z.number(), z.boolean(), z.null()]),
              ).optional(),
            })
            .optional(),
          style: z.object({
            tokens: z.record(z.string(), z.string()).optional(),
          }).optional(),
          component: z.object({
            registryId: z.string().min(1),
            variant: z.string().optional(),
            props: z.record(
              z.string(),
              z.union([z.string(), z.number(), z.boolean(), z.null()]),
            ).optional(),
          }).optional(),
          codeMapping: z.object({
            source: z.string(),
            exportName: z.string(),
            componentName: z.string(),
          }).optional(),
          responsive: z.array(z.object({
            breakpoint: z.string(),
            hidden: z.boolean().optional(),
            variant: z.string().optional(),
          })).optional(),
          accessibility: z.object({
            role: z.string().optional(),
            accessibleName: z.string().optional(),
            description: z.string().optional(),
            required: z.boolean().optional(),
            invalid: z.boolean().optional(),
            disabled: z.boolean().optional(),
            keyboard: z.array(z.string()).optional(),
            describedBy: z.array(z.string()).optional(),
            labelledBy: z.array(z.string()).optional(),
          }).optional(),
          assets: z.array(z.object({
            id: z.string(),
            kind: z.enum(["image", "icon", "font", "file"]),
            source: z.string(),
            alt: z.string().optional(),
          })).optional(),
          interaction: z.object({
            interactive: z.boolean(),
            trigger: z.enum(["click", "submit", "change", "input", "focus", "hover", "keyboard"]).optional(),
            action: z.string().optional(),
            targetScreenId: z.string().optional(),
            targetNodeId: z.string().optional(),
          }).optional(),
        })
      }),
      "update_node",
      "design:write",
      (input) => (project) => mutateUpdateNode(project, input as UpdateNodeInput),
    );

    registerMutationTool(
      "move_node",
      "Move a node within its existing parent ordering.",
      mutationBase.extend({
        nodeId: z.string().min(1).max(128),
        toIndex: z.number().int().min(0).max(10000),
      }),
      "move_node",
      "design:structure",
      (input) => (project) => mutateMoveNode(project, input as MoveNodeInput),
    );

    registerMutationTool(
      "update_token",
      "Update one existing design token and validate the complete token set before commit.",
      mutationBase.extend({
        scope: z.enum(["semantic", "primitives"]),
        tokenName: z.string().min(1).max(128),
        patch: z.object({
          kind: z.enum(["color","spacing","typography","radius","shadow","border","breakpoint","motion"]).optional(),
          value: z.union([z.string(), z.number()]).optional(),
          description: z.string().optional(),
          semanticRole: z.string().optional(),
          primitiveRef: z.string().optional(),
          theme: z.enum(["light","dark","all"]).optional(),
          themes: z.record(z.enum(["light","dark"]), z.union([z.string(), z.number()])).optional(),
        }),
      }),
      "update_token",
      "design:tokens",
      (input) => (project) => mutateUpdateToken(project, input as UpdateTokenInput),
    );
  }

  registerResources(server, provider);
  return server;
}

export const createHttpHandler = (
  provider: ProjectProvider = sampleProjectProvider,
  auth: AuthorizationContext = createDefaultAuthorization(),
  mutationProvider?: MutableProjectProvider,
  mutationSecurity = new MutationSecurity(),
) =>
  createMcpHandler(
    () => createMcpServer(provider, auth, mutationProvider, mutationSecurity),
    { legacy: "stateless" },
  );

export { validateFlow, validateProject } from "./validation";
