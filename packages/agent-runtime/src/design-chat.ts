// biome-ignore-all format: design chat MVP contract remains compact for review
import {
  applyCommands,
  type NodeId,
  type ScreenId,
  type UICommand,
  type UIDocument,
} from "@uiforge/ui-schema";
import type { AgentEvent } from "./contracts";
import { AgentRuntime } from "./runtime";
import type { AgentContext } from "./contracts";
import { createCoreAgentToolRegistry } from "./tools";

export interface DesignChatSelection {
  screenId?: ScreenId;
  nodeIds: NodeId[];
  frameIds: string[];
}

export interface DesignProposal {
  id: string;
  summary: string;
  commands: UICommand[];
  preview: string[];
}

export interface DesignChatResult {
  reply: string;
  plan: { goal: string; steps: string[] };
  events: AgentEvent[];
  proposal?: DesignProposal;
}

const id = (prefix: string) => `${prefix}.${Date.now()}`;

function interpretDesignRequest(document: UIDocument, request: string, selection: DesignChatSelection): DesignProposal | undefined {
  const text = request.trim();
  const lower = text.toLowerCase();
  const selectedId = selection.nodeIds[0];
  const selected = selectedId ? document.nodes[selectedId] : undefined;

  const textMatch =
    text.match(/(?:change|set|update|đổi|sửa|đặt).*(?:text|label|nội dung).*(?:to|thành)\s+["“']?(.+?)["”']?$/i) ??
    text.match(/(?:button|nút)\s+(?:text|label)?\s*(?:to|thành)\s+["“']?(.+?)["”']?$/i);

  if (textMatch?.[1] && selected && (selected.type === "button" || selected.type === "text" || selected.type === "link")) {
    const value = textMatch[1].trim().replace(/[."”']+$/, "");
    return {
      id: id("proposal"),
      summary: `Change “${selected.content?.text ?? selected.content?.label ?? selected.type}” to “${value}”.`,
      commands: [{
        type: "UpdateNode",
        commandId: id("chat.update-text"),
        nodeId: selected.id,
        patch: { content: { ...selected.content, text: value, label: value } },
      }],
      preview: [`Update ${selected.type} ${selected.id}: text/label → “${value}”`],
    };
  }

  const addButton = lower.includes("add button") || lower.includes("thêm nút") || lower.includes("create button");
  if (addButton) {
    const screenId = selection.screenId ?? document.screens[0]?.id;
    const screen = document.screens.find((item) => item.id === screenId);
    const parentId = selected?.parentId ?? screen?.rootNodeId;
    if (!screen || !parentId) return undefined;
    const nodeId = id("button");
    const node = {
      id: nodeId,
      screenId: screen.id,
      parentId,
      childrenIds: [],
      type: "button" as const,
      layout: { mode: "flex" as const, direction: "row" as const, align: "center" as const, justify: "center" as const },
      editor: { x: 120, y: 560, width: 180, height: 48 },
      content: { text: "New Button", label: "New Button" },
      accessibility: { role: "button", accessibleName: "New Button" },
      interaction: { interactive: true, trigger: "click" as const },
    };
    return {
      id: id("proposal"),
      summary: `Add a button to “${screen.name}”.`,
      commands: [{ type: "CreateNode", commandId: id("chat.create-button"), node }],
      preview: [`Create button ${nodeId} under ${parentId}`],
    };
  }

  if (lower.includes("make visual") || lower.includes("design ui") || lower.includes("visual design")) {
    const source = structuredClone(document);
    const visual = applyCommands(source, []);
    return {
      id: id("proposal"),
      summary: "Move the document into the visual-design stage.",
      commands: [{
        type: "ApplyVisualDesign",
        commandId: id("chat.visual-design"),
        patches: Object.values(visual.nodes).filter((node) => node.type !== "screen-root").map((node) => ({
          nodeId: node.id,
          style: node.style ?? { tokens: {} },
          layout: node.layout,
          editor: node.editor,
        })),
        stage: "visual",
      }],
      preview: ["Set document designStage → visual"],
    };
  }

  return undefined;
}

export async function runDesignChat(
  document: UIDocument,
  request: string,
  selection: DesignChatSelection,
): Promise<DesignChatResult> {
  const events: AgentEvent[] = [];
  const registry = createCoreAgentToolRegistry();
  const runtime = new AgentRuntime(registry, (event) => events.push(event));
  const sessionId = id("session");
  const runId = id("run");
  const context: AgentContext = AgentRuntime.createContext(document, sessionId, runId, selection);
  const screenId = selection.screenId ?? document.screens[0]?.id;
  const calls = [
    { id: id("tool"), toolName: "inspect_selection", input: {} },
    ...(screenId ? [{ id: id("tool"), toolName: "read_screen", input: { screenId } }] : []),
    { id: id("tool"), toolName: "validate_ui", input: {} },
  ];
  const plan = {
    id: id("plan"),
    goal: request,
    steps: ["Inspect current selection", "Read the active screen", "Validate the current UI Schema", "Interpret the design request"],
    createdAt: new Date().toISOString(),
  };
  const run = await runtime.run(context, calls, plan);
  if (run.status !== "completed") {
    return { reply: "I couldn't inspect the current UI safely, so no change was proposed.", plan, events };
  }
  const proposal = interpretDesignRequest(document, request, selection);
  if (!proposal) {
    return {
      reply: "I understand the request, but this MVP does not have a deterministic mutation rule for it yet. Try “add button” or “change text to …” with a node selected.",
      plan,
      events,
    };
  }
  return { reply: proposal.summary, plan, events, proposal };
}
