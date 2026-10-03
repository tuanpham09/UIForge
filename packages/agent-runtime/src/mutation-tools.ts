// biome-ignore-all format: agent mutation tools remain compact for review
import {
  applyCommand,
  type ComponentInstance,
  type LayoutSpec,
  type NodeId,
  type NodeStyle,
  type ResponsiveRule,
  type TokenRef,
  type UICommand,
  type UIDocument,
  type UINode,
} from "@uiforge/ui-schema";
import type { AgentToolDefinition } from "./contracts";
import { AgentToolRegistry } from "./registry";

type MutationResult = {
  proposal: { commands: UICommand[] };
  dryRun: boolean;
  revision: number;
};

type CreateNodeInput = { node: UINode; dryRun?: boolean };
type UpdateNodeInput = { nodeId: NodeId; patch: Partial<Omit<UINode, "id" | "screenId">>; dryRun?: boolean };
type DeleteNodeInput = { nodeId: NodeId; recursive?: boolean; dryRun?: boolean };
type MoveNodeInput = { nodeId: NodeId; toIndex: number; dryRun?: boolean };
type SetStyleInput = { nodeId: NodeId; style: NodeStyle; dryRun?: boolean };
type SetTokenInput = { nodeId: NodeId; slot: string; token: TokenRef; dryRun?: boolean };
type SetLayoutInput = { nodeId: NodeId; layout: LayoutSpec; dryRun?: boolean };
type SetResponsiveRuleInput = { nodeId: NodeId; rule: ResponsiveRule; dryRun?: boolean };
type CreateComponentInput = { nodeId: NodeId; registryId: string; variant?: string; props?: ComponentInstance["props"]; dryRun?: boolean };

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const hasString = (value: Record<string, unknown>, key: string) =>
  typeof value[key] === "string" && value[key].length > 0;
const optionalDryRun = (value: Record<string, unknown>) =>
  value.dryRun === undefined || typeof value.dryRun === "boolean";

const isCreateNode = (value: unknown): value is CreateNodeInput => {
  if (!record(value) || !record(value.node)) return false;
  return (
    hasString(value.node, "id") &&
    hasString(value.node, "screenId") &&
    hasString(value.node, "type") &&
    Array.isArray(value.node.childrenIds) &&
    optionalDryRun(value)
  );
};
const isUpdateNode = (value: unknown): value is UpdateNodeInput => {
  if (!record(value)) return false;
  return hasString(value, "nodeId") && record(value.patch) && optionalDryRun(value);
};
const isDeleteNode = (value: unknown): value is DeleteNodeInput => {
  if (!record(value)) return false;
  return hasString(value, "nodeId") && (value.recursive === undefined || typeof value.recursive === "boolean") && optionalDryRun(value);
};
const isMoveNode = (value: unknown): value is MoveNodeInput => {
  if (!record(value)) return false;
  return hasString(value, "nodeId") && typeof value.toIndex === "number" && Number.isInteger(value.toIndex) && value.toIndex >= 0 && optionalDryRun(value);
};
const isSetStyle = (value: unknown): value is SetStyleInput => {
  if (!record(value)) return false;
  return hasString(value, "nodeId") && record(value.style) && optionalDryRun(value);
};
const isSetToken = (value: unknown): value is SetTokenInput => {
  if (!record(value)) return false;
  return hasString(value, "nodeId") && hasString(value, "slot") && hasString(value, "token") && optionalDryRun(value);
};
const isSetLayout = (value: unknown): value is SetLayoutInput => {
  if (!record(value) || !record(value.layout)) return false;
  return hasString(value, "nodeId") && hasString(value.layout, "mode") && optionalDryRun(value);
};
const isSetResponsiveRule = (value: unknown): value is SetResponsiveRuleInput => {
  if (!record(value) || !record(value.rule)) return false;
  return hasString(value, "nodeId") && hasString(value.rule, "breakpoint") && optionalDryRun(value);
};
const isCreateComponent = (value: unknown): value is CreateComponentInput => {
  if (!record(value)) return false;
  return hasString(value, "nodeId") && hasString(value, "registryId") && optionalDryRun(value);
};

const stableId = (prefix: string, value: unknown) => {
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `agent.${prefix}.${(hash >>> 0).toString(16)}`;
};

function mutation<T extends { dryRun?: boolean }>(command: UICommand, input: T, context: { document: UIDocument }): MutationResult {
  const next = applyCommand(context.document, command);
  return { proposal: { commands: [command] }, dryRun: input.dryRun !== false, revision: next.revision.revision };
}

const createNode: AgentToolDefinition<CreateNodeInput, MutationResult> = {
  name: "create_node",
  description: "Propose creation of a semantic UI node under an existing parent.",
  validateInput: isCreateNode,
  execute: (input, context) => {
    const command = { type: "CreateNode", commandId: stableId("create-node", input.node), node: input.node } satisfies UICommand;
    return mutation(command, input, context);
  },
};
const updateNode: AgentToolDefinition<UpdateNodeInput, MutationResult> = {
  name: "update_node",
  description: "Propose a semantic node update.",
  validateInput: isUpdateNode,
  execute: (input, context) => {
    const command = { type: "UpdateNode", commandId: stableId("update-node", input), nodeId: input.nodeId, patch: input.patch } satisfies UICommand;
    return mutation(command, input, context);
  },
};
const deleteNode: AgentToolDefinition<DeleteNodeInput, MutationResult> = {
  name: "delete_node",
  description: "Propose deletion of a semantic node; recursive deletion must be explicitly requested.",
  validateInput: isDeleteNode,
  execute: (input, context) => {
    const command = { type: "DeleteNode", commandId: stableId("delete-node", input), nodeId: input.nodeId, recursive: input.recursive } satisfies UICommand;
    return mutation(command, input, context);
  },
};
const moveNode: AgentToolDefinition<MoveNodeInput, MutationResult> = {
  name: "move_node",
  description: "Propose moving a node within its current parent's child order.",
  validateInput: isMoveNode,
  execute: (input, context) => {
    const command = { type: "MoveNode", commandId: stableId("move-node", input), nodeId: input.nodeId, toIndex: input.toIndex } satisfies UICommand;
    return mutation(command, input, context);
  },
};
const setStyle: AgentToolDefinition<SetStyleInput, MutationResult> = {
  name: "set_style",
  description: "Propose replacing semantic style token mappings for a node.",
  validateInput: isSetStyle,
  execute: (input, context) => {
    const command = { type: "UpdateNode", commandId: stableId("set-style", input), nodeId: input.nodeId, patch: { style: input.style } } satisfies UICommand;
    return mutation(command, input, context);
  },
};
const setToken: AgentToolDefinition<SetTokenInput, MutationResult> = {
  name: "set_token",
  description: "Propose assigning a design token to one semantic style slot.",
  validateInput: isSetToken,
  execute: (input, context) => {
    const command = { type: "SetToken", commandId: stableId("set-token", input), nodeId: input.nodeId, slot: input.slot, token: input.token } satisfies UICommand;
    return mutation(command, input, context);
  },
};
const setLayout: AgentToolDefinition<SetLayoutInput, MutationResult> = {
  name: "set_layout",
  description: "Propose replacing a node's semantic layout specification.",
  validateInput: isSetLayout,
  execute: (input, context) => {
    const command = { type: "UpdateNode", commandId: stableId("set-layout", input), nodeId: input.nodeId, patch: { layout: input.layout } } satisfies UICommand;
    return mutation(command, input, context);
  },
};
const setResponsiveRule: AgentToolDefinition<SetResponsiveRuleInput, MutationResult> = {
  name: "set_responsive_rule",
  description: "Propose adding or replacing a responsive rule at a semantic breakpoint.",
  validateInput: isSetResponsiveRule,
  execute: (input, context) => {
    const command = { type: "SetResponsiveRule", commandId: stableId("set-responsive-rule", input), nodeId: input.nodeId, rule: input.rule } satisfies UICommand;
    return mutation(command, input, context);
  },
};
const createComponent: AgentToolDefinition<CreateComponentInput, MutationResult> = {
  name: "create_component",
  description: "Propose attaching a component instance to an existing semantic node.",
  validateInput: isCreateComponent,
  execute: (input, context) => {
    const command = { type: "UpdateNode", commandId: stableId("create-component", input), nodeId: input.nodeId, patch: { component: { registryId: input.registryId, variant: input.variant, props: input.props } } } satisfies UICommand;
    return mutation(command, input, context);
  },
};

export function registerMutationTools(registry: AgentToolRegistry): AgentToolRegistry {
  registry.register(createNode);
  registry.register(updateNode);
  registry.register(deleteNode);
  registry.register(moveNode);
  registry.register(setStyle);
  registry.register(setToken);
  registry.register(setLayout);
  registry.register(setResponsiveRule);
  registry.register(createComponent);
  return registry;
}

export function createAgentToolRegistry(): AgentToolRegistry {
  return registerMutationTools(new AgentToolRegistry());
}
