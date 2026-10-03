// biome-ignore-all format: agent brain tests remain compact for review
import { workspaceFixture } from "@uiforge/ui-schema";
import { describe, expect, it } from "vitest";
import {
  AgentBrain,
  type AgentModelProvider,
  type AgentModelResponse,
  AgentRuntime,
  createFullAgentToolRegistry,
} from "../src";

const context = () => AgentRuntime.createContext(structuredClone(workspaceFixture), "session.brain", "run.brain");

function fakeProvider(responses: AgentModelResponse[]): AgentModelProvider {
  let index = 0;
  return {
    complete: async () => {
      const response = responses[Math.min(index, responses.length - 1)];
      index += 1;
      if (!response) throw new Error("fake provider exhausted");
      return response;
    },
  };
}

const assistant = (content: string, toolCalls?: AgentModelResponse["toolCalls"]): AgentModelResponse => ({
  message: { id: `assistant.${content}`, role: "assistant", content, createdAt: "2026-10-03T00:00:00.000Z" },
  toolCalls,
  stopReason: toolCalls?.length ? "tool_calls" : "stop",
});

describe("AgentBrain", () => {
  it("executes a read → mutate → final response loop", async () => {
    const document = structuredClone(workspaceFixture);
    const node = Object.values(document.nodes).find((item) => item.type === "text");
    if (!node) throw new Error("fixture text node not found");
    const provider = fakeProvider([
      assistant("I need to inspect the selected node.", [{ id: "call-read", toolName: "read_node", input: { nodeId: node.id } }]),
      assistant("Now I will propose the text update.", [{ id: "call-update", toolName: "update_node", input: { nodeId: node.id, patch: { content: { ...node.content, text: "Save" } } } }]),
      assistant("I prepared a semantic UI proposal for review."),
    ]);
    const result = await new AgentBrain(provider, createFullAgentToolRegistry()).run(
      context(),
      "Change the selected text to Save.",
    );
    expect(result.status).toBe("completed");
    expect(result.toolResults.map((item) => item.toolName)).toEqual(["read_node", "update_node"]);
    expect(document.nodes[node.id]?.content?.text).not.toBe("Save");
    expect(result.message.content).toContain("proposal");
  });

  it("restricts empty-project bootstrap to create_flow and inspection tools", async () => {
    const provider = fakeProvider([
      assistant("Inspect first.", [{ id: "call-read", toolName: "read_project", input: {} }]),
      assistant("Create the complete flow.", [{
        id: "call-flow",
        toolName: "create_flow",
        input: {
          screens: [{
            screen: { id: "screen.bootstrap.home", name: "Home", route: "/", rootNodeId: "root.bootstrap.home", nodeIds: ["root.bootstrap.home"] },
            rootNode: { id: "root.bootstrap.home", screenId: "screen.bootstrap.home", parentId: null, childrenIds: [], type: "screen-root", layout: { mode: "stack", direction: "column" } },
          }],
          nodes: [
            { id: "node.bootstrap.title", screenId: "screen.bootstrap.home", parentId: "root.bootstrap.home", childrenIds: [], type: "text", layout: { mode: "stack", direction: "column" }, content: { text: "Home" } },
            { id: "node.bootstrap.cta", screenId: "screen.bootstrap.home", parentId: "root.bootstrap.home", childrenIds: [], type: "button", layout: { mode: "stack", direction: "column" }, content: { label: "Start" } },
          ],
          dryRun: true,
        },
      }]),
      assistant("The initial flow is ready for review."),
    ]);
    const result = await new AgentBrain(provider, createFullAgentToolRegistry(), {
      maxIterations: 6,
      allowedTools: ["read_project", "read_screen", "inspect_selection", "validate_ui", "create_flow"],
    }).run(context(), "Build the initial product flow.");
    expect(result.status).toBe("completed");
    expect(result.toolResults.map((item) => item.toolName)).toEqual(["read_project", "create_flow"]);
    expect(result.iterations).toBe(3);
  });

  it("maintains a virtual document across sequential bootstrap mutations", async () => {
    const screenId = "screen.bootstrap.details";
    const rootId = "node.bootstrap.details.root";
    const cardId = "node.bootstrap.details.card";
    const provider = fakeProvider([
      assistant("Create the details screen.", [{
        id: "call-create-screen",
        toolName: "create_screen",
        input: {
          screen: { id: screenId, name: "Details", route: "/details", rootNodeId: rootId, nodeIds: [rootId] },
          rootNode: { id: rootId, screenId, parentId: null, childrenIds: [], type: "screen-root", layout: { mode: "stack", direction: "column" } },
          dryRun: true,
        },
      }]),
      assistant("Add the first semantic card.", [{
        id: "call-create-card",
        toolName: "create_node",
        input: {
          node: { id: cardId, screenId, parentId: rootId, childrenIds: [], type: "card", layout: { mode: "stack", direction: "column" }, content: { label: "Details" } },
          dryRun: true,
        },
      }]),
      assistant("Verify the generated screen.", [{
        id: "call-read-screen",
        toolName: "read_screen",
        input: { screenId },
      }]),
      assistant("The bootstrap proposal is ready for review."),
    ]);
    const result = await new AgentBrain(provider, createFullAgentToolRegistry()).run(
      context(),
      "Bootstrap the product details screen.",
    );
    expect(result.status).toBe("completed");
    expect(result.toolResults.map((item) => item.toolName)).toEqual(["create_screen", "create_node", "read_screen"]);
    const read = result.toolResults[2]?.output as { nodes?: Array<{ id: string }> } | undefined;
    expect(read?.nodes?.some((node) => node.id === cardId)).toBe(true);
    const commands = result.toolResults.flatMap((item) => {
      if (!item.ok || typeof item.output !== "object" || item.output === null) return [];
      const proposal = (item.output as { proposal?: { commands?: Array<{ type: string }> } }).proposal;
      return proposal?.commands ?? [];
    });
    expect(commands.map((command) => command.type)).toEqual(["CreateScreen", "CreateNode"]);
  });

  it("feeds tool failures back to the provider", async () => {
    let observed = "";
    const provider: AgentModelProvider = {
      complete: async (request) => {
        if (request.messages.some((message) => message.role === "tool")) observed = request.messages.at(-1)?.content ?? "";
        return observed
          ? assistant("The requested node was not found; no change was proposed.")
          : assistant("Inspect the requested node.", [{ id: "missing", toolName: "read_node", input: { nodeId: "missing.node" } }]);
      },
    };
    const result = await new AgentBrain(provider, createFullAgentToolRegistry()).run(context(), "Inspect missing node.");
    expect(result.status).toBe("completed");
    expect(observed).toContain("EXECUTION_FAILED");
  });

  it("stops after the configured iteration limit", async () => {
    const provider: AgentModelProvider = {
      complete: async () => assistant("Continue", [{ id: "loop", toolName: "read_project", input: {} }]),
    };
    const result = await new AgentBrain(provider, createFullAgentToolRegistry(), { maxIterations: 2 }).run(context(), "Keep going");
    expect(result.status).toBe("max_iterations");
    expect(result.iterations).toBe(2);
    expect(result.toolResults).toHaveLength(2);
  });
});
