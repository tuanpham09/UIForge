import {
  applyCommand,
  type CodeMapping,
  type LayoutSpec,
  type NodePatch,
  type ResponsiveRule,
  type SemanticNodeType,
  type UIDocument,
  type UINode,
} from "@uiforge/ui-schema";
import type { DesignToken, TokenKind } from "@uiforge/design-tokens";
import type { ProjectSnapshot, ProjectProvider, ValidationReport } from "./types";
import { validateProject } from "./validation";

export const MCP_MUTATION_VERSION = "uiforge.mcp-mutations/v1" as const;

export type MutationCapability =
  | "design:write"
  | "design:structure"
  | "design:tokens";

export interface AuthorizationContext {
  actorId: string;
  capabilities: readonly MutationCapability[];
  authorizeProject(projectId: string, capability: MutationCapability): boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  projectId: string;
  capability: MutationCapability;
  operation: string;
  idempotencyKey: string;
  baseRevision: number;
  result: "committed" | "replayed" | "rejected";
  revision?: number;
  errorCode?: string;
}

export interface MutableProjectProvider extends ProjectProvider {
  commitProject(project: ProjectSnapshot): void;
}

export interface MutationEnvelope {
  projectId: string;
  baseRevision: number;
  idempotencyKey: string;
}

export interface CreateScreenInput extends MutationEnvelope {
  screenId: string;
  name: string;
  route?: string;
  rootNodeId: string;
  rootLayout?: LayoutSpec;
  metadata?: Record<string, string>;
}

export interface UpdateScreenInput extends MutationEnvelope {
  screenId: string;
  patch: {
    name?: string;
    route?: string;
    metadata?: Record<string, string>;
  };
}

export interface CreateComponentInstanceInput extends MutationEnvelope {
  nodeId: string;
  screenId: string;
  parentId: string;
  registryId: string;
  variant?: string;
  props?: Record<string, string | number | boolean | null>;
  type?: SemanticNodeType;
  content?: UINode["content"];
}

export interface UpdateNodeInput extends MutationEnvelope {
  nodeId: string;
  patch: NodePatch;
}

export interface MoveNodeInput extends MutationEnvelope {
  nodeId: string;
  toIndex: number;
}

export interface UpdateTokenInput extends MutationEnvelope {
  scope: "semantic" | "primitives";
  tokenName: string;
  patch: Partial<Pick<DesignToken, "kind" | "value" | "description" | "semanticRole" | "primitiveRef" | "theme" | "themes">>;
}

export interface MutationResult {
  operation: string;
  idempotencyKey: string;
  revision: number;
  replayed: boolean;
  auditEventId: string;
  validation: ValidationReport;
}

const clone = <T>(value: T): T => structuredClone(value);

export class MutationSecurity {
  private readonly idempotency = new Map<string, { projectId: string; operation: string; baseRevision: number; result: MutationResult }>();
  private readonly audits: AuditEvent[] = [];

  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  getAuditEvents(): readonly AuditEvent[] {
    return this.audits.map(clone);
  }

  execute<T extends MutationEnvelope>(
    provider: MutableProjectProvider,
    auth: AuthorizationContext,
    input: T,
    capability: MutationCapability,
    operation: string,
    mutate: (project: ProjectSnapshot) => ProjectSnapshot,
  ): MutationResult {
    if (!auth.capabilities.includes(capability) || !auth.authorizeProject(input.projectId, capability)) {
      return this.reject(auth, input, capability, operation, "CAPABILITY_DENIED");
    }

    const replay = this.idempotency.get(input.idempotencyKey);
    if (replay) {
      if (
        replay.projectId !== input.projectId ||
        replay.operation !== operation ||
        replay.baseRevision !== input.baseRevision
      ) {
        return this.reject(
          auth,
          input,
          capability,
          operation,
          "IDEMPOTENCY_KEY_REUSED",
        );
      }
      this.audit(auth, input, capability, operation, "replayed", replay.result.revision);
      return { ...replay.result, replayed: true };
    }

    const current = provider.getProject(input.projectId);
    if (!current) {
      return this.reject(auth, input, capability, operation, "PROJECT_SCOPE_NOT_FOUND");
    }
    if (current.revision !== input.baseRevision) {
      return this.reject(auth, input, capability, operation, "STALE_REVISION");
    }

    let next: ProjectSnapshot;
    try {
      next = mutate(clone(current));
      const validation = validateProject(next);
      if (!validation.valid) {
        return this.reject(auth, input, capability, operation, "VALIDATION_FAILED", validation);
      }
    } catch (error) {
      return this.reject(
        auth,
        input,
        capability,
        operation,
        "MALFORMED_COMMAND",
        undefined,
        error instanceof Error ? error.message : String(error),
      );
    }

    provider.commitProject(next);
    const result: MutationResult = {
      operation,
      idempotencyKey: input.idempotencyKey,
      revision: next.revision,
      replayed: false,
      auditEventId: this.audit(auth, input, capability, operation, "committed", next.revision),
      validation: { valid: true, findings: [] },
    };
    this.idempotency.set(input.idempotencyKey, { projectId: input.projectId, operation, baseRevision: input.baseRevision, result });
    return result;
  }

  private reject(
    auth: AuthorizationContext,
    input: MutationEnvelope,
    capability: MutationCapability,
    operation: string,
    code: string,
    validation?: ValidationReport,
    message?: string,
  ): MutationResult {
    const auditEventId = this.audit(auth, input, capability, operation, "rejected", undefined, code);
    return {
      operation,
      idempotencyKey: input.idempotencyKey,
      revision: input.baseRevision,
      replayed: false,
      auditEventId,
      validation:
        validation ??
        ({
          valid: false,
          findings: [
            {
              code,
              path: "mutation",
              message: message ?? code,
              severity: "error",
            },
          ],
        } satisfies ValidationReport),
    };
  }

  private audit(
    auth: AuthorizationContext,
    input: MutationEnvelope,
    capability: MutationCapability,
    operation: string,
    result: AuditEvent["result"],
    revision?: number,
    errorCode?: string,
  ): string {
    const id = "audit." + (this.audits.length + 1);
    this.audits.push({
      id,
      timestamp: this.now(),
      actorId: auth.actorId,
      projectId: input.projectId,
      capability,
      operation,
      idempotencyKey: input.idempotencyKey,
      baseRevision: input.baseRevision,
      result,
      ...(revision === undefined ? {} : { revision }),
      ...(errorCode ? { errorCode } : {}),
    });
    return id;
  }
}

export function createMutableProvider(
  source: ProjectProvider,
): MutableProjectProvider {
  const projects = new Map<string, ProjectSnapshot>();
  return {
    getProject(projectId) {
      if (!projects.has(projectId)) {
        const project = source.getProject(projectId);
        if (project) projects.set(projectId, clone(project));
      }
      const project = projects.get(projectId);
      return project ? clone(project) : null;
    },
    commitProject(project) {
      projects.set(project.projectId, clone(project));
    },
  };
}

export function createDefaultAuthorization(
  actorId = "anonymous",
): AuthorizationContext {
  return {
    actorId,
    capabilities: [],
    authorizeProject: () => false,
  };
}

export function createAuthorization(
  actorId: string,
  projectIds: readonly string[],
  capabilities: readonly MutationCapability[],
): AuthorizationContext {
  const allowedProjects = new Set(projectIds);
  return {
    actorId,
    capabilities,
    authorizeProject: (projectId, capability) =>
      allowedProjects.has(projectId) && capabilities.includes(capability),
  };
}

export function mutateCreateScreen(
  project: ProjectSnapshot,
  input: CreateScreenInput,
): ProjectSnapshot {
  if (project.document.screens.some((screen) => screen.id === input.screenId)) {
    throw new Error("screen already exists");
  }
  if (project.document.nodes[input.rootNodeId]) {
    throw new Error("root node already exists");
  }
  const rootNode: UINode = {
    id: input.rootNodeId,
    screenId: input.screenId,
    parentId: null,
    childrenIds: [],
    type: "screen-root",
    layout:
      input.rootLayout ??
      ({
        mode: "stack",
        direction: "column",
        gap: { token: "space.4" },
        padding: { block: { token: "space.6" }, inline: { token: "space.6" } },
      } satisfies LayoutSpec),
  };
  const document = clone(project.document);
  document.screens.push({
    id: input.screenId,
    name: input.name,
    route: input.route,
    rootNodeId: input.rootNodeId,
    nodeIds: [input.rootNodeId],
    metadata: input.metadata,
  });
  document.nodes[input.rootNodeId] = rootNode;
  document.revision = {
    ...document.revision,
    revision: document.revision.revision + 1,
    updatedAt: new Date().toISOString(),
    source: "ai",
  };
  return { ...project, document, revision: document.revision.revision, updatedAt: document.revision.updatedAt };
}

export function mutateUpdateScreen(
  project: ProjectSnapshot,
  input: UpdateScreenInput,
): ProjectSnapshot {
  const document = clone(project.document);
  const screen = document.screens.find((item) => item.id === input.screenId);
  if (!screen) throw new Error("screen not found");
  Object.assign(screen, input.patch);
  document.revision = {
    ...document.revision,
    revision: document.revision.revision + 1,
    updatedAt: new Date().toISOString(),
    source: "ai",
  };
  return { ...project, document, revision: document.revision.revision, updatedAt: document.revision.updatedAt };
}

export function mutateCreateComponentInstance(
  project: ProjectSnapshot,
  input: CreateComponentInstanceInput,
): ProjectSnapshot {
  if (!project.registry.components[input.registryId]) {
    throw new Error("unknown registry component");
  }
  const node: UINode = {
    id: input.nodeId,
    screenId: input.screenId,
    parentId: input.parentId,
    childrenIds: [],
    type: input.type ?? "section",
    layout: {
      mode: "stack",
      direction: "column",
      gap: { token: "space.4" },
    },
    content: input.content,
    component: {
      registryId: input.registryId,
      variant: input.variant,
      props: input.props,
    },
  };
  const nextDocument = applyCommand(project.document, {
    type: "CreateNode",
    commandId: input.idempotencyKey,
    node: node,
  });
  return {
    ...project,
    document: nextDocument,
    revision: nextDocument.revision.revision,
    updatedAt: new Date().toISOString(),
  };
}

export function mutateUpdateNode(
  project: ProjectSnapshot,
  input: UpdateNodeInput,
): ProjectSnapshot {
  const nextDocument = applyCommand(project.document, {
    type: "UpdateNode",
    commandId: input.idempotencyKey,
    nodeId: input.nodeId,
    patch: input.patch,
  });
  return {
    ...project,
    document: nextDocument,
    revision: nextDocument.revision.revision,
    updatedAt: new Date().toISOString(),
  };
}

export function mutateMoveNode(
  project: ProjectSnapshot,
  input: MoveNodeInput,
): ProjectSnapshot {
  const nextDocument = applyCommand(project.document, {
    type: "MoveNode",
    commandId: input.idempotencyKey,
    nodeId: input.nodeId,
    toIndex: input.toIndex,
  });
  return {
    ...project,
    document: nextDocument,
    revision: nextDocument.revision.revision,
    updatedAt: new Date().toISOString(),
  };
}

export function mutateUpdateToken(
  project: ProjectSnapshot,
  input: UpdateTokenInput,
): ProjectSnapshot {
  const tokens = clone(project.tokens);
  const set = tokens[input.scope];
  const current = set[input.tokenName];
  if (!current) throw new Error("token not found");
  set[input.tokenName] = { ...current, ...input.patch } as DesignToken;
  const validation = validateProject({ ...project, tokens });
  if (!validation.valid) throw new Error("token validation failed");
  return { ...project, tokens, revision: project.revision + 1, updatedAt: new Date().toISOString() };
}

export function mutationEnvelopeSchema(z: typeof import("zod/v4")) {
  return z.object({
    projectId: z.string().min(1).max(128),
    baseRevision: z.number().int().nonnegative(),
    idempotencyKey: z.string().min(8).max(128),
  });
}
