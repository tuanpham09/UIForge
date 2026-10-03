// biome-ignore-all format: MCP JSON-RPC adapter remains compact for review
import {
  executeMcpTool,
  getMcpSession,
  mcpResourceList,
  mcpServerInfo,
  mcpTextResult,
  mcpToolList,
  readMcpResource,
} from "./mcp-bridge";
import { createFullAgentToolRegistry } from "./tools";

type JsonRpcRequest = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
type JsonRpcResponse = { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string; data?: unknown } };

const error=(id:JsonRpcRequest["id"],code:number,message:string,data?:unknown):JsonRpcResponse=>({jsonrpc:"2.0",id:id??null,error:{code,message,data}});
const result=(id:JsonRpcRequest["id"],value:unknown):JsonRpcResponse=>({jsonrpc:"2.0",id:id??null,result:value});

export async function handleMcpJsonRpc(request: JsonRpcRequest, token: string): Promise<JsonRpcResponse | null> {
  const session = getMcpSession(token);
  if (!session) return error(request.id, -32001, "Invalid or expired UIForge MCP session.");
  const method = request.method ?? "";
  if (!request.jsonrpc || request.jsonrpc !== "2.0") return error(request.id, -32600, "Invalid JSON-RPC request.");
  if (method === "notifications/initialized" || method === "notifications/cancelled") return null;

  if (method === "initialize") {
    return result(request.id, { ...mcpServerInfo(), protocolVersion: typeof request.params?.protocolVersion === "string" ? request.params.protocolVersion : mcpServerInfo().protocolVersion });
  }
  if (method === "ping") return result(request.id, {});
  if (method === "tools/list") return result(request.id, { tools: mcpToolList(createFullAgentToolRegistry()) });
  if (method === "resources/list") return result(request.id, { resources: mcpResourceList() });
  if (method === "resources/read") {
    const uri = request.params?.uri;
    if (typeof uri !== "string") return error(request.id, -32602, "uri is required.");
    const value = readMcpResource(session, uri);
    if (value === undefined) return error(request.id, -32004, `Unknown resource: ${uri}`);
    return result(request.id, { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(value) }] });
  }
  if (method === "tools/call") {
    const name = request.params?.name;
    if (typeof name !== "string") return error(request.id, -32602, "Tool name is required.");
    const args = request.params?.arguments ?? {};
    const toolResult = await executeMcpTool(createFullAgentToolRegistry(), session, name, args, String(request.id ?? "notification"));
    return result(request.id, mcpTextResult(toolResult));
  }
  return error(request.id, -32601, `Unsupported MCP method: ${method}`);
}

export function parseMcpBody(value: unknown): JsonRpcRequest | JsonRpcRequest[] | undefined {
  if (Array.isArray(value)) return value.every(isRequest) ? value : undefined;
  return isRequest(value) ? value : undefined;
}

function isRequest(value: unknown): value is JsonRpcRequest {
  return typeof value === "object" && value !== null && (value as JsonRpcRequest).jsonrpc === "2.0" && typeof (value as JsonRpcRequest).method === "string";
}

export function mcpAuthToken(request: Request): string | undefined {
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) return authorization.slice(7).trim();
  return new URL(request.url).searchParams.get("token") ?? undefined;
}
