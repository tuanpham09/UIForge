// biome-ignore-all format: agent runtime contract remains compact for review
import { validateUIDocument, type NodeId, type ScreenId, type UINode } from "@uiforge/ui-schema";
import type { AgentToolDefinition } from "./contracts";
import { AgentToolRegistry } from "./registry";

type EmptyInput = Record<string, never>;
type ScreenInput = { screenId: ScreenId };
type NodeInput = { nodeId: NodeId };
type SearchInput = { query: string };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isEmptyInput = (value: unknown): value is EmptyInput => isRecord(value) && Object.keys(value).length === 0;
const isScreenInput = (value: unknown): value is ScreenInput => isRecord(value) && typeof value.screenId === "string" && Object.keys(value).length === 1;
const isNodeInput = (value: unknown): value is NodeInput => isRecord(value) && typeof value.nodeId === "string" && Object.keys(value).length === 1;
const isSearchInput = (value: unknown): value is SearchInput => isRecord(value) && typeof value.query === "string" && value.query.trim().length > 0;

const projectNode = (node: UINode) => ({
  id: node.id, screenId: node.screenId, frameId: node.frameId, parentId: node.parentId,
  childrenIds: node.childrenIds, type: node.type, layout: node.layout, content: node.content,
  component: node.component, style: node.style, responsive: node.responsive,
  accessibility: node.accessibility, interaction: node.interaction,
});

const readProject: AgentToolDefinition<EmptyInput> = {
  name: "read_project",
  description: "Read the semantic project summary from the current UI document.",
  validateInput: isEmptyInput,
  execute: (_input, context) => ({
    id: context.document.id, name: context.document.metadata.name,
    description: context.document.metadata.description,
    designStage: context.document.metadata.designStage ?? "wireframe",
    revision: context.document.revision.revision,
    screens: context.document.screens.map((screen) => ({ id: screen.id, name: screen.name, route: screen.route, nodeCount: screen.nodeIds.length })),
    frameCount: context.document.frames?.length ?? 0,
  }),
};

const readScreen: AgentToolDefinition<ScreenInput> = {
  name: "read_screen",
  description: "Read one semantic screen and its node hierarchy.",
  validateInput: isScreenInput,
  execute: (input, context) => {
    const screen = context.document.screens.find((item) => item.id === input.screenId);
    if (!screen) throw new Error(`screen not found: ${input.screenId}`);
    return {
      ...screen,
      nodes: screen.nodeIds.map((nodeId) => context.document.nodes[nodeId]).filter((node): node is UINode => Boolean(node)).map(projectNode),
      frames: (context.document.frames ?? []).filter((frame) => frame.screenId === screen.id),
    };
  },
};

const readNode: AgentToolDefinition<NodeInput> = {
  name: "read_node",
  description: "Read one semantic UI node.",
  validateInput: isNodeInput,
  execute: (input, context) => {
    const node = context.document.nodes[input.nodeId];
    if (!node) throw new Error(`node not found: ${input.nodeId}`);
    return projectNode(node);
  },
};

const searchNodes: AgentToolDefinition<SearchInput> = {
  name: "search_nodes",
  description: "Search semantic nodes by id, type, label, text, component or accessibility name.",
  validateInput: isSearchInput,
  execute: (input, context) => {
    const query = input.query.trim().toLowerCase();
    return Object.values(context.document.nodes).filter((node) => {
      const haystack = [
        node.id, node.type, node.content?.text, node.content?.label, node.content?.placeholder,
        node.component?.registryId, node.component?.variant, node.accessibility?.accessibleName,
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    }).map(projectNode);
  },
};

const inspectSelection: AgentToolDefinition<EmptyInput> = {
  name: "inspect_selection",
  description: "Read the current semantic canvas selection.",
  validateInput: isEmptyInput,
  execute: (_input, context) => ({
    screenId: context.selection?.screenId,
    nodeIds: context.selection?.nodeIds ?? [],
    frameIds: context.selection?.frameIds ?? [],
    nodes: (context.selection?.nodeIds ?? []).map((nodeId) => context.document.nodes[nodeId]).filter((node): node is UINode => Boolean(node)).map(projectNode),
    frames: (context.document.frames ?? []).filter((frame) => (context.selection?.frameIds ?? []).includes(frame.id)),
  }),
};

const validateUi: AgentToolDefinition<EmptyInput> = {
  name: "validate_ui",
  description: "Validate the current UI Schema and return a structured result.",
  validateInput: isEmptyInput,
  execute: (_input, context) => {
    try {
      validateUIDocument(context.document);
      return { valid: true, schemaVersion: context.document.schemaVersion, revision: context.document.revision.revision };
    } catch (error) {
      return { valid: false, issues: error instanceof Error ? [error.message] : [String(error)] };
    }
  },
};

export function createCoreAgentToolRegistry(): AgentToolRegistry {
  const registry = new AgentToolRegistry();
  registry.register(readProject);
  registry.register(readScreen);
  registry.register(readNode);
  registry.register(searchNodes);
  registry.register(inspectSelection);
  registry.register(validateUi);
  return registry;
}
