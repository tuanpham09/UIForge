// biome-ignore-all format: agent mutation tools remain compact for review
import {
  applyCommand,
  type ComponentInstance,
  type LayoutSpec,
  type NodeId,
  type NodeStyle,
  type ResponsiveRule,
  type Screen,
  type TokenRef,
  type UICommand,
  type UIDocument,
  type UINode,
} from "@uiforge/ui-schema";
import type { AgentToolDefinition } from "./contracts";
import { AgentToolRegistry } from "./registry";

type CreateScreenInput = { screen: Screen; rootNode: UINode; dryRun?: boolean };
type CreateFlowInput = { screens: Array<{ screen: Screen; rootNode: UINode }>; nodes: UINode[]; dryRun?: boolean };

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

const isCreateFlow = (value: unknown): value is CreateFlowInput => {
  if (!record(value) || !Array.isArray(value.screens) || !Array.isArray(value.nodes) || value.screens.length === 0 || value.nodes.length === 0) return false;
  if (!value.screens.every((item) => record(item) && record(item.screen) && record(item.rootNode))) return false;
  if (!value.nodes.every((node) => record(node) && hasString(node, "id") && hasString(node, "screenId") && hasString(node, "type") && Array.isArray(node.childrenIds))) return false;
  return optionalDryRun(value);
};

const isCreateScreen = (value: unknown): value is CreateScreenInput => {
  if (!record(value) || !record(value.screen) || !record(value.rootNode)) return false;
  return hasString(value.screen, "id") && hasString(value.screen, "name") && hasString(value.screen, "rootNodeId") && hasString(value.rootNode, "id") && value.rootNode.type === "screen-root" && optionalDryRun(value);
};

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

const createFlow: AgentToolDefinition<CreateFlowInput, MutationResult> = {
  name: "create_flow",
  description: "Propose a complete initial product flow in one operation: multiple screens followed by their semantic nodes. Prefer this for bootstrapping a new project.",
  validateInput: isCreateFlow,
  execute: (input, context) => {
    let working = context.document;
    const commands: UICommand[] = [];
    for (const item of input.screens) {
      const command = { type: "CreateScreen", commandId: stableId("create-flow-screen", item.screen), screen: item.screen, rootNode: item.rootNode } satisfies UICommand;
      working = applyCommand(working, command);
      commands.push(command);
    }
    for (const node of input.nodes) {
      const command = { type: "CreateNode", commandId: stableId("create-flow-node", node), node } satisfies UICommand;
      working = applyCommand(working, command);
      commands.push(command);
    }
    return { proposal: { commands }, dryRun: input.dryRun !== false, revision: working.revision.revision };
  },
};

const createScreen: AgentToolDefinition<CreateScreenInput, MutationResult> = {
  name: "create_screen",
  description: "Propose creation of a new product screen with its semantic screen-root node.",
  validateInput: isCreateScreen,
  execute: (input, context) => {
    const command = { type: "CreateScreen", commandId: stableId("create-screen", input.screen), screen: input.screen, rootNode: input.rootNode } satisfies UICommand;
    return mutation(command, input, context);
  },
};

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
  registry.register(createFlow);
  registry.register(createScreen);
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
