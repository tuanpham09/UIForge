// biome-ignore-all format: agent brain tests remain compact for review
import { workspaceFixture } from "@uiforge/ui-schema";
import { describe, expect, it } from "vitest";
import {
  AgentBrain,
  AgentRuntime,
  createFullAgentToolRegistry,
  type AgentModelProvider,
  type AgentModelResponse,
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
