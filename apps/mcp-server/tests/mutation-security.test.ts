import { mkdirSync, writeFileSync } from "node:fs";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { describe, expect, it } from "vitest";
import {
  createAuthorization,
  createMutableProvider,
  type MutableProjectProvider,
  MutationSecurity,
} from "../src/mutations";
import { sampleProjectProvider } from "../src/sample-project";
import { createHttpHandler } from "../src/server";
import type { ProjectSnapshot } from "../src/types";

const evidenceDir = "artifacts/mcp";
mkdirSync(evidenceDir, { recursive: true });

const mutationTools = [
  "create_screen",
  "update_screen",
  "create_component_instance",
  "update_node",
  "move_node",
  "update_token",
];

function clientFor() {
  return new Client(
    { name: "uiforge-mutation-security-test", version: "0.1.0" },
    { versionNegotiation: { mode: { pin: "2026-07-28" } } },
  );
}

async function connectClient(
  provider: MutableProjectProvider,
  auth: ReturnType<typeof createAuthorization>,
) {
  const client = clientFor();
  await client.connect(
    new StreamableHTTPClientTransport(new URL("http://uiforge.test/mcp"), {
      fetch: async (url, init) =>
        createHttpHandler(provider, auth, provider).fetch(
          new Request(url, init),
        ),
    }),
  );
  return client;
}

describe("UIForge MCP mutation security", () => {
  it("keeps mutation tools hidden for read-only connections", async () => {
    const provider = createMutableProvider(sampleProjectProvider);
    const client = await connectClient(
      provider,
      createAuthorization("agent-read-only", ["sample-project"], []),
    );
    const tools = await client.listTools();
    const toolNames = tools.tools.map((tool) => tool.name);
    for (const mutationTool of mutationTools) {
      expect(toolNames).not.toContain(mutationTool);
    }
    await client.close();
  });

  it("executes an authorized mutation and replays the same request", async () => {
    const provider = createMutableProvider(sampleProjectProvider);
    const auth = createAuthorization(
      "agent-writer",
      ["sample-project"],
      ["design:write"],
    );
    const client = await connectClient(provider, auth);
    const before = provider.getProject("sample-project");
    expect(before?.revision).toBe(7);

    const input = {
      projectId: "sample-project",
      baseRevision: 7,
      idempotencyKey: "mcp-update-screen-001",
      screenId: "screen.dashboard",
      patch: { name: "Dashboard from Agent" },
    };
    const first = await client.callTool({
      name: "update_screen",
      arguments: input,
    });
    const second = await client.callTool({
      name: "update_screen",
      arguments: input,
    });

    expect(first.isError).not.toBe(true);
    expect(second.isError).not.toBe(true);
    expect((first.structuredContent as { replayed: boolean }).replayed).toBe(
      false,
    );
    expect((second.structuredContent as { replayed: boolean }).replayed).toBe(
      true,
    );
    expect(provider.getProject("sample-project")?.revision).toBe(8);
    expect(
      provider
        .getProject("sample-project")
        ?.document.screens.find((screen) => screen.id === "screen.dashboard")
        ?.name,
    ).toBe("Dashboard from Agent");
    await client.close();
  });

  it("requires explicit capability and project authorization", async () => {
    const provider = createMutableProvider(sampleProjectProvider);
    const deniedAuth = createAuthorization(
      "agent-denied",
      ["sample-project"],
      [],
    );
    const deniedClient = await connectClient(provider, deniedAuth);
    const deniedTools = await deniedClient.listTools();
    expect(deniedTools.tools.map((tool) => tool.name)).not.toContain(
      "update_screen",
    );
    await deniedClient.close();

    const wrongProjectAuth = createAuthorization(
      "agent-cross-project",
      ["other-project"],
      ["design:write"],
    );
    const security = new MutationSecurity(() => "2026-10-01T09:00:00.000Z");
    const result = security.execute(
      provider,
      wrongProjectAuth,
      {
        projectId: "sample-project",
        baseRevision: 7,
        idempotencyKey: "cross-project-001",
        screenId: "screen.dashboard",
        patch: { name: "No access" },
      },
      "design:write",
      "update_screen",
      (project) => project,
    );
    expect(result.validation.valid).toBe(false);
    expect(result.validation.findings[0]?.code).toBe("CAPABILITY_DENIED");
    expect(security.getAuditEvents()).toHaveLength(1);
  });

  it("rejects stale revisions before mutation", async () => {
    const provider = createMutableProvider(sampleProjectProvider);
    const auth = createAuthorization(
      "agent-writer",
      ["sample-project"],
      ["design:write"],
    );
    const security = new MutationSecurity(() => "2026-10-01T09:00:00.000Z");
    const result = security.execute(
      provider,
      auth,
      {
        projectId: "sample-project",
        baseRevision: 6,
        idempotencyKey: "stale-revision-001",
        screenId: "screen.dashboard",
        patch: { name: "Should not commit" },
      },
      "design:write",
      "update_screen",
      () => {
        throw new Error("mutation must not execute");
      },
    );
    expect(result.validation.valid).toBe(false);
    expect(result.validation.findings[0]?.code).toBe("STALE_REVISION");
    expect(provider.getProject("sample-project")?.revision).toBe(7);
  });

  it("replays idempotent mutations without duplicating the write", async () => {
    const provider = createMutableProvider(sampleProjectProvider);
    const auth = createAuthorization(
      "agent-writer",
      ["sample-project"],
      ["design:write"],
    );
    const security = new MutationSecurity(() => "2026-10-01T09:00:00.000Z");
    const input = {
      projectId: "sample-project",
      baseRevision: 7,
      idempotencyKey: "update-screen-replay-001",
      screenId: "screen.dashboard",
      patch: { name: "Dashboard v2" },
    };
    const mutate = (project: ProjectSnapshot) => {
      const next = structuredClone(project);
      const screen = next.document.screens.find(
        (candidate) => candidate.id === "screen.dashboard",
      );
      if (!screen) throw new Error("dashboard screen missing");
      screen.name = "Dashboard v2";
      next.revision = 8;
      return next;
    };

    const first = security.execute(
      provider,
      auth,
      input,
      "design:write",
      "update_screen",
      mutate,
    );
    const second = security.execute(
      provider,
      auth,
      input,
      "design:write",
      "update_screen",
      mutate,
    );

    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.revision).toBe(first.revision);
    const reused = security.execute(
      provider,
      auth,
      { ...input, patch: { name: "Different payload" } },
      "design:write",
      "update_screen",
      mutate,
    );
    expect(reused.validation.findings[0]?.code).toBe("IDEMPOTENCY_KEY_REUSED");
    expect(provider.getProject("sample-project")?.revision).toBe(8);
    expect(
      provider
        .getProject("sample-project")
        ?.document.screens.find((s) => s.id === "screen.dashboard")?.name,
    ).toBe("Dashboard v2");

    const audits = security.getAuditEvents();
    expect(audits.map((event) => event.result)).toEqual([
      "committed",
      "replayed",
    ]);

    writeFileSync(
      `${evidenceDir}/security-audit.json`,
      JSON.stringify({ audits, first, second }, null, 2),
    );
  });

  it("validates mutations before commit and records rejection", async () => {
    const provider = createMutableProvider(sampleProjectProvider);
    const auth = createAuthorization(
      "agent-writer",
      ["sample-project"],
      ["design:write"],
    );
    const security = new MutationSecurity(() => "2026-10-01T09:00:00.000Z");
    const result = security.execute(
      provider,
      auth,
      {
        projectId: "sample-project",
        baseRevision: 7,
        idempotencyKey: "malformed-command-001",
        nodeId: "dashboard.cta",
        patch: { screenId: "screen.login" },
      },
      "design:write",
      "update_node",
      (project) => {
        const next = structuredClone(project);
        const node = next.document.nodes["dashboard.cta"];
        if (!node) throw new Error("dashboard CTA node missing");
        next.document.nodes["dashboard.cta"] = {
          ...node,
          screenId: "screen.login",
        };
        return next;
      },
    );

    expect(result.validation.valid).toBe(false);
    expect(result.validation.findings[0]?.code).toBe("VALIDATION_FAILED");
    expect(provider.getProject("sample-project")?.revision).toBe(7);
    expect(security.getAuditEvents()[0]?.result).toBe("rejected");
  });

  it("rejects cross-project identifiers through the registered tool", async () => {
    const provider = createMutableProvider(sampleProjectProvider);
    const auth = createAuthorization(
      "agent-writer",
      ["sample-project"],
      ["design:structure"],
    );
    const client = await connectClient(provider, auth);
    const before = provider.getProject("sample-project");

    const result = await client.callTool({
      name: "create_component_instance",
      arguments: {
        projectId: "sample-project",
        baseRevision: 7,
        idempotencyKey: "cross-project-node-001",
        nodeId: "node.other-project",
        screenId: "screen.other-project",
        parentId: "dashboard.root",
        registryId: "uiforge.button",
      },
    });

    expect(result.isError).toBe(true);
    expect(provider.getProject("sample-project")).toEqual(before);
    await client.close();
  });
});
