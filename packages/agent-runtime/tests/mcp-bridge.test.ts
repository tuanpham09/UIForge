import { workspaceFixture } from "@uiforge/ui-schema";
import { describe, expect, it } from "vitest";
import {
  createMcpSession,
  executeMcpTool,
  mcpServerInfo,
  mcpToolList,
} from "../src/mcp-bridge";
import { handleMcpJsonRpc } from "../src/mcp-jsonrpc";
import { createFullAgentToolRegistry } from "../src/tools";

describe("UIForge MCP bridge", () => {
  it("advertises the semantic agent tools", () => {
    const tools = mcpToolList(createFullAgentToolRegistry());
    expect(tools.some((tool) => tool.name === "read_project")).toBe(true);
    expect(tools.some((tool) => tool.name === "create_node")).toBe(true);
  });

  it("forces mutations into proposal-only dry runs", async () => {
    const session = createMcpSession(structuredClone(workspaceFixture), {
      nodeIds: [],
      frameIds: [],
    });
    const result = await executeMcpTool(
      createFullAgentToolRegistry(),
      session,
      "delete_node",
      { nodeId: "missing", recursive: true, dryRun: false },
      "1",
    );
    expect(result.ok).toBe(false);
    expect(session.document.revision.revision).toBe(0);
  });

  it("supports initialize, tools/list and resource reads", async () => {
    const session = createMcpSession(structuredClone(workspaceFixture), {
      nodeIds: [],
      frameIds: [],
    });
    const init = await handleMcpJsonRpc(
      { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
      session.token,
    );
    const tools = await handleMcpJsonRpc(
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      session.token,
    );
    const resource = await handleMcpJsonRpc(
      {
        jsonrpc: "2.0",
        id: 3,
        method: "resources/read",
        params: { uri: "uiforge://document" },
      },
      session.token,
    );
    expect(init?.result).toMatchObject({
      serverInfo: { name: "UIForge MCP Bridge" },
    });
    expect(
      (tools?.result as { tools: unknown[] }).tools.length,
    ).toBeGreaterThan(5);
    expect(resource?.result).toBeTruthy();
  });

  it("rejects an unknown session", async () => {
    const response = await handleMcpJsonRpc(
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      "invalid",
    );
    expect(response?.error?.code).toBe(-32001);
  });

  it("advertises the negotiated protocol version", () => {
    expect(mcpServerInfo().protocolVersion).toBe("2025-06-18");
  });
});
