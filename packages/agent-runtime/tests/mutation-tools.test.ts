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

  it("proposes a complete multi-screen flow atomically", async () => {
    const document = structuredClone(workspaceFixture);
    const root = document.screens[0]?.rootNodeId;
    const rootNode = root ? document.nodes[root] : undefined;
    if (!rootNode) throw new Error("fixture root node not found");
    const registry = createAgentToolRegistry();
    const result = await registry.execute(
      "create_flow",
      {
        screens: [
          {
            screen: {
              id: "screen.agent.dashboard",
              name: "Dashboard",
              route: "/dashboard",
              rootNodeId: "node.agent.dashboard.root",
              nodeIds: ["node.agent.dashboard.root"],
            },
            rootNode: {
              ...rootNode,
              id: "node.agent.dashboard.root",
              screenId: "screen.agent.dashboard",
              childrenIds: [],
            },
          },
          {
            screen: {
              id: "screen.agent.expenses",
              name: "Expenses",
              route: "/expenses",
              rootNodeId: "node.agent.expenses.root",
              nodeIds: ["node.agent.expenses.root"],
            },
            rootNode: {
              ...rootNode,
              id: "node.agent.expenses.root",
              screenId: "screen.agent.expenses",
              childrenIds: [],
            },
          },
        ],
        nodes: [
          {
            ...rootNode,
            id: "node.agent.dashboard.summary",
            screenId: "screen.agent.dashboard",
            parentId: "node.agent.dashboard.root",
            childrenIds: [],
            type: "section",
            content: { label: "Summary" },
          },
          {
            ...rootNode,
            id: "node.agent.expenses.list",
            screenId: "screen.agent.expenses",
            parentId: "node.agent.expenses.root",
            childrenIds: [],
            type: "section",
            content: { label: "Expense list" },
          },
        ],
      },
      AgentRuntime.createContext(document),
      "call-create-flow",
    );
    expect(result.ok).toBe(true);
    const output = result.output as {
      proposal: { commands: Array<{ type: string }> };
    };
    expect(output.proposal.commands.map((command) => command.type)).toEqual([
      "CreateScreen",
      "CreateScreen",
      "CreateNode",
      "CreateNode",
    ]);
    expect(
      document.screens.some((screen) => screen.id === "screen.agent.dashboard"),
    ).toBe(false);
    expect(
      document.screens.some((screen) => screen.id === "screen.agent.expenses"),
    ).toBe(false);
  });

  it("rejects container-only bootstrap screens", async () => {
    const document = structuredClone(workspaceFixture);
    const root = document.nodes[document.screens[0]?.rootNodeId ?? ""];
    if (!root) throw new Error("fixture root node not found");

    const result = await createAgentToolRegistry().execute(
      "create_flow",
      {
        screens: [
          {
            screen: {
              id: "screen.agent.thin",
              name: "Thin",
              route: "/thin",
              rootNodeId: "node.agent.thin.root",
              nodeIds: ["node.agent.thin.root"],
            },
            rootNode: {
              ...root,
              id: "node.agent.thin.root",
              screenId: "screen.agent.thin",
              childrenIds: [],
            },
          },
        ],
        nodes: [
          {
            ...root,
            id: "node.agent.thin.section",
            screenId: "screen.agent.thin",
            parentId: "node.agent.thin.root",
            childrenIds: [],
            type: "section",
            content: { label: "Header" },
          },
        ],
      },
      AgentRuntime.createContext(document),
      "call-thin-flow",
    );

    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain("CREATE_FLOW_WIREFRAME_TOO_THIN");
  });

  it("accepts a bootstrap screen with concrete semantic nodes", async () => {
    const document = structuredClone(workspaceFixture);
    const root = document.nodes[document.screens[0]?.rootNodeId ?? ""];
    if (!root) throw new Error("fixture root node not found");

    const result = await createAgentToolRegistry().execute(
      "create_flow",
      {
        screens: [
          {
            screen: {
              id: "screen.agent.real",
              name: "Dashboard",
              route: "/dashboard",
              rootNodeId: "node.agent.real.root",
              nodeIds: ["node.agent.real.root"],
            },
            rootNode: {
              ...root,
              id: "node.agent.real.root",
              screenId: "screen.agent.real",
              childrenIds: [],
            },
          },
        ],
        nodes: [
          {
            ...root,
            id: "node.agent.real.summary",
            screenId: "screen.agent.real",
            parentId: "node.agent.real.root",
            childrenIds: [],
            type: "card",
            content: { label: "Today's progress" },
          },
          {
            ...root,
            id: "node.agent.real.cta",
            screenId: "screen.agent.real",
            parentId: "node.agent.real.root",
            childrenIds: [],
            type: "button",
            content: { label: "Start lesson" },
          },
        ],
      },
      AgentRuntime.createContext(document),
      "call-real-flow",
    );

    expect(result.ok).toBe(true);
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
