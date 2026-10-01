import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { describe, expect, it } from "vitest";
import { sampleProject } from "../src/sample-project";
import {
  createHttpHandler,
  createMcpServer,
  validateProject,
} from "../src/server";
import type { ProjectProvider } from "../src/types";

const evidenceDir = "artifacts/mcp";
mkdirSync(evidenceDir, { recursive: true });

const expectedTools = [
  "get_project",
  "get_screen",
  "get_layout_tree",
  "get_component",
  "get_component_registry",
  "get_design_tokens",
  "get_code_mapping",
  "get_responsive_rules",
  "get_code_spec",
  "get_flows",
  "get_flow",
  "get_user_journey",
  "get_transitions",
  "get_screen_connections",
  "get_navigation_map",
  "validate_design",
  "validate_flow",
];

function modernClient() {
  return new Client(
    { name: "uiforge-contract-test", version: "0.1.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } },
  );
}

function inProcessTransport(provider?: ProjectProvider) {
  return new StreamableHTTPClientTransport(
    new URL("http://uiforge.test/mcp"),
    {
      fetch: async (url, init) =>
        createHttpHandler(provider).fetch(new Request(url, init)),
    },
  );
}

describe("UIForge MCP contract", () => {
  it("registers every read tool with schemas and read-only annotations", async () => {
    const client = modernClient();
    await client.connect(inProcessTransport());

    const result = await client.listTools();
    expect(result.tools.map((tool) => tool.name)).toEqual(expectedTools);
    expect(result.tools).toHaveLength(expectedTools.length);

    writeFileSync(
      evidenceDir + "/tool-schema-artifact.json",
      JSON.stringify({ tools: result.tools }, null, 2),
    );

    for (const tool of result.tools) {
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.annotations?.destructiveHint).toBe(false);
    }

    await client.close();
  });

  it("advertises semantic resources and templates", async () => {
    const client = modernClient();
    await client.connect(inProcessTransport());

    const resources = await client.listResources();
    const templates = await client.listResourceTemplates();

    expect(resources.resources.map((item) => item.uri)).toContain(
      "uiforge://projects/sample-project",
    );
    expect(templates.resourceTemplates).toHaveLength(9);

    const project = await client.readResource({
      uri: "uiforge://projects/sample-project",
    });
    const projectContent = project.contents[0];
    const projectText =
      projectContent && "text" in projectContent ? projectContent.text : "";
    expect(projectText).toContain("uiforge.mcp/v1");

    await client.close();
  });

  it("reads a complete flow without unrelated screen payloads", async () => {
    const client = modernClient();
    await client.connect(inProcessTransport());

    const result = await client.callTool({
      name: "get_flow",
      arguments: {
        projectId: "sample-project",
        flowId: "flow.authenticated-details",
      },
    });

    expect(result.isError).not.toBe(true);
    const body = result.structuredContent as {
      data: { transitions: unknown[] };
      revision: number;
    };
    expect(body.revision).toBe(7);
    expect(body.data.transitions).toHaveLength(1);

    const contextBytes = Buffer.byteLength(JSON.stringify(body), "utf8");
    expect(contextBytes).toBeLessThan(12000);
    writeFileSync(
      evidenceDir + "/mcp-transcript.json",
      JSON.stringify(
        { tool: "get_flow", result: body, contextBytes },
        null,
        2,
      ),
    );
    writeFileSync(
      evidenceDir + "/context-size-benchmark.json",
      JSON.stringify(
        { maxBytes: 12000, measuredBytes: contextBytes, status: "pass" },
        null,
        2,
      ),
    );

    await client.close();
  });

  it("rejects malformed project input", async () => {
    const client = modernClient();
    await client.connect(inProcessTransport());

    const result = await client.callTool({
      name: "get_project",
      arguments: {},
    });
    expect(result.isError).toBe(true);

    await client.close();
  });

  it("returns structured findings for broken flow references", async () => {
    const broken = structuredClone(sampleProject);
    const firstFlow = broken.flows[0];
    const firstTransition = firstFlow?.transitions[0];
    if (!firstTransition) {
      throw new Error("Sample flow fixture is missing a transition.");
    }
    firstTransition.destination.screenId = "screen.missing";

    const provider: ProjectProvider = {
      getProject: (projectId) =>
        projectId === broken.projectId ? broken : null,
    };

    const client = modernClient();
    await client.connect(inProcessTransport(provider));

    const result = await client.callTool({
      name: "validate_flow",
      arguments: {
        projectId: "sample-project",
        flowId: "flow.authenticated-details",
      },
    });

    const body = result.structuredContent as {
      data: { valid: boolean; findings: Array<{ code: string }> };
    };
    expect(body.data.valid).toBe(false);
    expect(
      body.data.findings.some(
        (finding) => finding.code === "MISSING_DESTINATION_SCREEN",
      ),
    ).toBe(true);

    await client.close();
  });

  it("connects over local stdio", async () => {
    const client = modernClient();
    const transport = new StdioClientTransport({
      command: "pnpm",
      args: ["exec", "tsx", "apps/mcp-server/src/stdio.ts"],
      cwd: process.cwd(),
      stderr: "pipe",
    });
    await client.connect(transport);

    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(expectedTools);

    const result = await client.callTool({
      name: "get_project",
      arguments: { projectId: "sample-project" },
    });
    expect(result.isError).not.toBe(true);

    writeFileSync(
      evidenceDir + "/stdio-smoke.log",
      "PASS: stdio MCP client connected, tools/list and get_project succeeded\n",
    );

    await client.close();
  });

  it("connects through a real local Streamable HTTP process", async () => {
    const child = spawn(
      "pnpm",
      ["exec", "tsx", "apps/mcp-server/src/http.ts"],
      {
        cwd: process.cwd(),
        env: { ...process.env, PORT: "3123" },
        stdio: ["ignore", "ignore", "pipe"],
      },
    );

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(new Error("MCP HTTP server did not start within 5 seconds")),
        5000,
      );

      child.stderr?.on("data", (chunk) => {
        if (String(chunk).includes("UIForge MCP HTTP listening")) {
          clearTimeout(timer);
          resolve();
        }
      });

      child.on("exit", (code) => {
        if (code !== null && code !== 0) {
          clearTimeout(timer);
          reject(new Error("MCP HTTP process exited with code " + code));
        }
      });
    });

    const client = modernClient();
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL("http://127.0.0.1:3123/mcp"),
      ),
    );

    const result = await client.callTool({
      name: "get_project",
      arguments: { projectId: "sample-project" },
    });
    expect(result.isError).not.toBe(true);

    writeFileSync(
      evidenceDir + "/http-smoke.log",
      "PASS: real Streamable HTTP process connected and get_project succeeded\n",
    );

    await client.close();
    child.kill("SIGTERM");
  });

  it("validates the deterministic sample project", () => {
    const report = validateProject(sampleProject);
    expect(report.valid).toBe(true);
    expect(report.findings).toEqual([]);
  });

  it("does not expose write tools", async () => {
    const server = createMcpServer();
    const client = modernClient();
    await client.connect(inProcessTransport());

    const result = await client.listTools();
    expect(
      result.tools.some(
        (tool) =>
          tool.name.startsWith("create_") ||
          tool.name.startsWith("update_") ||
          tool.name.startsWith("delete_"),
      ),
    ).toBe(false);

    await client.close();
    await server.close();
  });
});
