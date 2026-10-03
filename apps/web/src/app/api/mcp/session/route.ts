import {
  createMcpSession,
  mcpAuthToken,
  updateMcpSession,
} from "@uiforge/agent-runtime";
import type { NodeId, UIDocument } from "@uiforge/ui-schema";
import { NextResponse } from "next/server";

type Body = {
  document?: unknown;
  selection?: {
    screenId?: unknown;
    nodeIds?: unknown;
    frameIds?: unknown;
  };
};

const isDocument = (value: unknown): value is UIDocument =>
  typeof value === "object" &&
  value !== null &&
  "nodes" in value &&
  "screens" in value &&
  "revision" in value;

const selection = (value: Body["selection"]) => ({
  screenId: typeof value?.screenId === "string" ? value.screenId : undefined,
  nodeIds: Array.isArray(value?.nodeIds)
    ? value.nodeIds.filter((id): id is NodeId => typeof id === "string")
    : [],
  frameIds: Array.isArray(value?.frameIds)
    ? value.frameIds.filter((id): id is string => typeof id === "string")
    : [],
});

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  if (!isDocument(body.document)) {
    return NextResponse.json(
      { error: { code: "INVALID_DOCUMENT", message: "document is required" } },
      { status: 400 },
    );
  }

  const session = createMcpSession(body.document, selection(body.selection));
  return NextResponse.json({
    sessionId: session.id,
    token: session.token,
    endpoint: "/api/mcp",
    protocolVersion: "2025-06-18",
  });
}

export async function PUT(request: Request) {
  const token = mcpAuthToken(request);
  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Bearer token required" } },
      { status: 401 },
    );
  }

  const body = (await request.json()) as Body;
  if (!isDocument(body.document)) {
    return NextResponse.json(
      { error: { code: "INVALID_DOCUMENT", message: "document is required" } },
      { status: 400 },
    );
  }

  const session = updateMcpSession(
    token,
    body.document,
    selection(body.selection),
  );
  if (!session) {
    return NextResponse.json(
      { error: { code: "INVALID_SESSION", message: "Unknown MCP session" } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    sessionId: session.id,
    updatedAt: new Date().toISOString(),
  });
}
