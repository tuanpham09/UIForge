// biome-ignore-all format: agent runtime contract remains compact for review
import { describe, expect, it } from "vitest";
import { workspaceFixture } from "@uiforge/ui-schema";
import { AgentRuntime, AgentToolRegistry, createCoreAgentToolRegistry } from "../src";

const context = () => AgentRuntime.createContext(structuredClone(workspaceFixture), "session.test", "run.test");

describe("AgentToolRegistry", () => {
  it("registers and executes a typed tool", async () => {
    const registry = new AgentToolRegistry();
    registry.register({
      name: "echo",
      description: "Echo input",
      validateInput: (input): input is { value: string } => typeof input === "object" && input !== null && "value" in input && typeof (input as { value?: unknown }).value === "string",
      execute: (input) => ({ value: input.value }),
    });
    const result = await registry.execute("echo", { value: "hello" }, context(), "call-1");
    expect(result.ok).toBe(true);
    expect(result.output).toEqual({ value: "hello" });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("returns structured errors for unknown and invalid tools", async () => {
    const registry = new AgentToolRegistry();
    const unknown = await registry.execute("missing", {}, context(), "call-1");
    expect(unknown.error?.code).toBe("UNKNOWN_TOOL");
    registry.register({
      name: "required-string",
      description: "Requires a string",
      validateInput: (input): input is { value: string } => typeof input === "object" && input !== null && "value" in input && typeof (input as { value?: unknown }).value === "string",
      execute: (input) => input.value,
    });
    const invalid = await registry.execute("required-string", { value: 123 }, context(), "call-2");
    expect(invalid.error?.code).toBe("INVALID_INPUT");
  });
});

describe("core semantic tools", () => {
  it("reads project, screen, node and selection context", async () => {
    const registry = createCoreAgentToolRegistry();
    const ctx = AgentRuntime.createContext(structuredClone(workspaceFixture), "session.test", "run.test", {
      screenId: "screen.dashboard", nodeIds: ["dashboard.cta"], frameIds: ["frame.dashboard.iphone13"],
    });
    const project = await registry.execute("read_project", {}, ctx, "1");
    expect(project.output).toMatchObject({ name: "UIForge Workspace fixture", screens: expect.arrayContaining([expect.objectContaining({ id: "screen.dashboard" })]) });
    const screen = await registry.execute("read_screen", { screenId: "screen.dashboard" }, ctx, "2");
    expect(screen.output).toMatchObject({ id: "screen.dashboard" });
    const node = await registry.execute("read_node", { nodeId: "dashboard.cta" }, ctx, "3");
    expect(node.output).toMatchObject({ id: "dashboard.cta", type: "button" });
    const selection = await registry.execute("inspect_selection", {}, ctx, "4");
    expect(selection.output).toMatchObject({ nodeIds: ["dashboard.cta"], frameIds: ["frame.dashboard.iphone13"] });
  });

  it("searches nodes and validates the document", async () => {
    const registry = createCoreAgentToolRegistry();
    const ctx = context();
    const search = await registry.execute("search_nodes", { query: "button" }, ctx, "1");
    expect(search.output).toEqual(expect.arrayContaining([expect.objectContaining({ id: "dashboard.cta" })]));
    const validation = await registry.execute("validate_ui", {}, ctx, "2");
    expect(validation.output).toMatchObject({ valid: true });
  });
});

describe("AgentRuntime", () => {
  it("runs tools sequentially and emits lifecycle events", async () => {
    const events: string[] = [];
    const runtime = new AgentRuntime(createCoreAgentToolRegistry(), (event) => events.push(event.type));
    const run = await runtime.run(context(), [
      { id: "call-1", toolName: "read_project", input: {} },
      { id: "call-2", toolName: "validate_ui", input: {} },
    ], {
      id: "plan-1", goal: "Inspect the project", steps: ["Read project", "Validate UI"], createdAt: "2026-10-03T00:00:00.000Z",
    });
    expect(run.status).toBe("completed");
    expect(run.toolResults).toHaveLength(2);
    expect(events).toEqual(["agent.run.started", "agent.plan.created", "agent.tool.started", "agent.tool.completed", "agent.tool.started", "agent.tool.completed", "agent.run.completed"]);
  });

  it("stops on a failed tool and emits failure events", async () => {
    const registry = new AgentToolRegistry();
    registry.register({ name: "fail", description: "Always fails", validateInput: () => true, execute: () => { throw new Error("boom"); } });
    const events: string[] = [];
    const runtime = new AgentRuntime(registry, (event) => events.push(event.type));
    const run = await runtime.run(context(), [{ id: "call-1", toolName: "fail", input: {} }]);
    expect(run.status).toBe("failed");
    expect(run.toolResults[0]?.error?.code).toBe("EXECUTION_FAILED");
    expect(events).toEqual(["agent.run.started", "agent.tool.started", "agent.tool.failed", "agent.run.failed"]);
  });
});
