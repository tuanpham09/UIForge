import { workspaceFixture } from "@uiforge/ui-schema";
import { describe, expect, it } from "vitest";
import { createAgentToolRegistry } from "../src/mutation-tools";
import { AgentRuntime } from "../src/runtime";

describe("semantic mutation agent tools", () => {
  it("proposes a valid node update without mutating the source document", async () => {
    const document = structuredClone(workspaceFixture);
    const node = Object.values(document.nodes).find(
      (item) => item.type === "text",
    );
    if (!node) throw new Error("fixture text node not found");
    const context = AgentRuntime.createContext(document);
    const result = await createAgentToolRegistry().execute(
      "update_node",
      {
        nodeId: node.id,
        patch: { content: { ...node.content, text: "Updated" } },
      },
      context,
      "call-update",
    );
    expect(result.ok).toBe(true);
    expect(
      (result.output as { proposal: { commands: Array<{ type: string }> } })
        .proposal.commands[0]?.type,
    ).toBe("UpdateNode");
    expect(document.nodes[node.id]?.content?.text).not.toBe("Updated");
  });

  it("rejects invalid destructive operations with a structured error", async () => {
    const document = structuredClone(workspaceFixture);
    const screen = document.screens[0];
    if (!screen) throw new Error("fixture screen not found");
    const root = screen.rootNodeId;
    const result = await createAgentToolRegistry().execute(
      "delete_node",
      { nodeId: root },
      AgentRuntime.createContext(document),
      "call-delete-root",
    );
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("EXECUTION_FAILED");
  });

  it("validates responsive, token, layout and component proposals", async () => {
    const document = structuredClone(workspaceFixture);
    const node = Object.values(document.nodes).find(
      (item) => item.type !== "screen-root",
    );
    if (!node) throw new Error("fixture node not found");
    const registry = createAgentToolRegistry();
    const context = AgentRuntime.createContext(document);
    for (const [name, input] of [
      ["set_token", { nodeId: node.id, slot: "fill", token: "primary.500" }],
      [
        "set_layout",
        { nodeId: node.id, layout: { mode: "flex", direction: "row" } },
      ],
      [
        "set_responsive_rule",
        { nodeId: node.id, rule: { breakpoint: "mobile", hidden: true } },
      ],
      [
        "create_component",
        { nodeId: node.id, registryId: "button", variant: "primary" },
      ],
    ] as const) {
      const result = await registry.execute(
        name,
        input,
        context,
        `call-${name}`,
      );
      expect(result.ok).toBe(true);
    }
  });
});
