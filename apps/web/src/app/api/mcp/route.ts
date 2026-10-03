import {
  handleMcpJsonRpc,
  mcpAuthToken,
  parseMcpBody,
} from "@uiforge/agent-runtime";

export const runtime = "nodejs";

const jsonHeaders = {
  "Content-Type": "application/json",
  "MCP-Protocol-Version": "2025-06-18",
};

export async function POST(request: Request) {
  const token = mcpAuthToken(request);
  if (!token) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32001, message: "Bearer token required." },
      }),
      { status: 401, headers: jsonHeaders },
    );
  }

  const body = parseMcpBody(await request.json());
  if (!body) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32600, message: "Invalid JSON-RPC request." },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (Array.isArray(body)) {
    const responses = (
      await Promise.all(body.map((item) => handleMcpJsonRpc(item, token)))
    ).filter((item): item is NonNullable<typeof item> => item !== null);
    return new Response(JSON.stringify(responses), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  const response = await handleMcpJsonRpc(body, token);
  if (response === null) {
    return new Response(null, { status: 202 });
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { ...jsonHeaders, "Cache-Control": "no-store" },
  });
}

export async function GET() {
  return new Response(
    "UIForge MCP Bridge. Use POST with Streamable HTTP JSON-RPC.",
    { status: 405, headers: { Allow: "POST" } },
  );
}
