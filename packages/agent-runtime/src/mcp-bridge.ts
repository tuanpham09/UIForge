// biome-ignore-all format: MCP bridge protocol adapter remains compact for review
import type { AgentContext, AgentToolResult } from "./contracts";
import type { AgentToolRegistry } from "./registry";

export const MCP_PROTOCOL_VERSION = "2025-06-18";

export type McpSession = {
  id: string;
  token: string;
  createdAt: string;
  document: AgentContext["document"];
  selection: NonNullable<AgentContext["selection"]>;
};

const sessions = new Map<string, McpSession>();
const mutationTools = new Set([
  "create_screen",
  "create_node","update_node","delete_node","move_node","set_style","set_token",
  "set_layout","set_responsive_rule","create_component",
]);

export function createMcpSession(document: McpSession["document"], selection: McpSession["selection"]): McpSession {
  const session: McpSession = { id: crypto.randomUUID(), token: crypto.randomUUID().replaceAll("-", ""), createdAt: new Date().toISOString(), document, selection };
  sessions.set(session.token, session);
  return session;
}

export function updateMcpSession(token: string, document: McpSession["document"], selection?: McpSession["selection"]): McpSession | undefined {
  const session = sessions.get(token);
  if (!session) return undefined;
  session.document = document;
  if (selection) session.selection = selection;
  return session;
}

export function getMcpSession(token: string): McpSession | undefined {
  return sessions.get(token);
}

export function deleteMcpSession(token: string): boolean {
  return sessions.delete(token);
}

export function mcpToolList(registry: AgentToolRegistry) {
  return registry.list().map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema ?? { type: "object", properties: {}, additionalProperties: false },
  }));
}

export async function executeMcpTool(
  registry: AgentToolRegistry,
  session: McpSession,
  name: string,
  input: unknown,
  requestId: string,
): Promise<AgentToolResult> {
  let safeInput = input;
  if (mutationTools.has(name)) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      return {
        callId: requestId,
        toolName: name,
        ok: false,
        error: { code: "INVALID_INPUT", message: "Mutation tool input must be an object." },
        durationMs: 0,
      };
    }
    safeInput = { ...(input as Record<string, unknown>), dryRun: true };
  }

  const context: AgentContext = {
    document: session.document,
    selection: session.selection,
    sessionId: session.id,
    runId: `mcp.${requestId}`,
  };
  return registry.execute(name, safeInput, context, requestId);
}

export function mcpTextResult(result: AgentToolResult) {
  return {
    content: [{ type: "text", text: JSON.stringify(result.ok ? result.output : result.error) }],
    isError: !result.ok,
  };
}

export function mcpResourceList() {
  return [
    { uri: "uiforge://document", name: "Current UIForge document", description: "Canonical UIForge UI Schema document bound to this MCP session.", mimeType: "application/json" },
    { uri: "uiforge://selection", name: "Current selection", description: "Current UIForge screen, node and frame selection.", mimeType: "application/json" },
  ];
}

export function readMcpResource(session: McpSession, uri: string) {
  if (uri === "uiforge://document") return session.document;
  if (uri === "uiforge://selection") return session.selection;
  return undefined;
}

export function mcpServerInfo() {
  return {
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: { tools: { listChanged: false }, resources: { subscribe: false, listChanged: false } },
    serverInfo: { name: "UIForge MCP Bridge", version: "0.1.0" },
    instructions: "UIForge exposes the canonical UI Schema through read tools and proposal-only mutation tools. Mutations never bypass user approval.",
  };
}
