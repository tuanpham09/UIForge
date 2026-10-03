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
const hasString = (value: Record<string, unknown>, key: string) => typeof value[key] === "string" && value[key].length > 0;
const optionalDryRun = (value: Record<string, unknown>) => value.dryRun === undefined || typeof value.dryRun === "boolean";
const valid = (value: unknown, required: string[]) => record(value) && required.every((key) => hasString(value, key)) && optionalDryRun(value);

const isCreateNode = (value: unknown): value is CreateNodeInput => record(value) && record(value.node) && hasString(value.node, "id") && hasString(value.node, "screenId") && hasString(value.node, "type") && Array.isArray(value.node.childrenIds) && optionalDryRun(value);
const isUpdateNode = (value: unknown): value is UpdateNodeInput => valid(value, ["nodeId"]) && record(value.patch);
const isDeleteNode = (value: unknown): value is DeleteNodeInput => valid(value, ["nodeId"]) && (value.recursive === undefined || typeof value.recursive === "boolean");
const isMoveNode = (value: unknown): value is MoveNodeInput => valid(value, ["nodeId"]) && typeof value.toIndex === "number" && Number.isInteger(value.toIndex) && value.toIndex >= 0;
const isSetStyle = (value: unknown): value is SetStyleInput => valid(value, ["nodeId"]) && record(value.style);
const isSetToken = (value: unknown): value is SetTokenInput => valid(value, ["nodeId", "slot", "token"]);
const isSetLayout = (value: unknown): value is SetLayoutInput => valid(value, ["nodeId"]) && record(value.layout) && hasString(value.layout, "mode");
const isSetResponsiveRule = (value: unknown): value is SetResponsiveRuleInput => valid(value, ["nodeId"]) && record(value.rule) && hasString(value.rule, "breakpoint");
const isCreateComponent = (value: unknown): value is CreateComponentInput => valid(value, ["nodeId", "registryId"]);

const commandId = (name: string) => `agent.${name}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}`;

function mutation<T extends { dryRun?: boolean }>(command: UICommand, input: T, context: { document: UIDocument }): MutationResult {
  const next = applyCommand(context.document, command);
  return { proposal: { commands: [command] }, dryRun: input.dryRun !== false, revision: next.revision.revision };
}

const createNode: AgentToolDefinition<CreateNodeInput, MutationResult> = {
  name: "create_node",
  description: "Propose creation of a semantic UI node under an existing parent.",
  validateInput: isCreateNode,
  execute: (input, context) => mutation({ type: "CreateNode", commandId: commandId("create-node"), node: input.node }, input, context),
};
const updateNode: AgentToolDefinition<UpdateNodeInput, MutationResult> = {
  name: "update_node",
  description: "Propose a semantic node update.",
  validateInput: isUpdateNode,
  execute: (input, context) => mutation({ type: "UpdateNode", commandId: commandId("update-node"), nodeId: input.nodeId, patch: input.patch }, input, context),
};
const deleteNode: AgentToolDefinition<DeleteNodeInput, MutationResult> = {
  name: "delete_node",
  description: "Propose deletion of a semantic node; recursive deletion must be explicitly requested.",
  validateInput: isDeleteNode,
  execute: (input, context) => mutation({ type: "DeleteNode", commandId: commandId("delete-node"), nodeId: input.nodeId, recursive: input.recursive }, input, context),
};
const moveNode: AgentToolDefinition<MoveNodeInput, MutationResult> = {
  name: "move_node",
  description: "Propose moving a node within its current parent's child order.",
  validateInput: isMoveNode,
  execute: (input, context) => mutation({ type: "MoveNode", commandId: commandId("move-node"), nodeId: input.nodeId, toIndex: input.toIndex }, input, context),
};
const setStyle: AgentToolDefinition<SetStyleInput, MutationResult> = {
  name: "set_style",
  description: "Propose replacing semantic style token mappings for a node.",
  validateInput: isSetStyle,
  execute: (input, context) => mutation({ type: "UpdateNode", commandId: commandId("set-style"), nodeId: input.nodeId, patch: { style: input.style } }, input, context),
};
const setToken: AgentToolDefinition<SetTokenInput, MutationResult> = {
  name: "set_token",
  description: "Propose assigning a design token to one semantic style slot.",
  validateInput: isSetToken,
  execute: (input, context) => mutation({ type: "SetToken", commandId: commandId("set-token"), nodeId: input.nodeId, slot: input.slot, token: input.token }, input, context),
};
const setLayout: AgentToolDefinition<SetLayoutInput, MutationResult> = {
  name: "set_layout",
  description: "Propose replacing a node's semantic layout specification.",
  validateInput: isSetLayout,
  execute: (input, context) => mutation({ type: "UpdateNode", commandId: commandId("set-layout"), nodeId: input.nodeId, patch: { layout: input.layout } }, input, context),
};
const setResponsiveRule: AgentToolDefinition<SetResponsiveRuleInput, MutationResult> = {
  name: "set_responsive_rule",
  description: "Propose adding or replacing a responsive rule at a semantic breakpoint.",
  validateInput: isSetResponsiveRule,
  execute: (input, context) => mutation({ type: "SetResponsiveRule", commandId: commandId("set-responsive-rule"), nodeId: input.nodeId, rule: input.rule }, input, context),
};
const createComponent: AgentToolDefinition<CreateComponentInput, MutationResult> = {
  name: "create_component",
  description: "Propose attaching a component instance to an existing semantic node.",
  validateInput: isCreateComponent,
  execute: (input, context) => mutation({ type: "UpdateNode", commandId: commandId("create-component"), nodeId: input.nodeId, patch: { component: { registryId: input.registryId, variant: input.variant, props: input.props } } }, input, context),
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
