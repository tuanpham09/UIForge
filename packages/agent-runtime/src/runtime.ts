import type { AgentContext, AgentEvent, AgentPlan, AgentRun, AgentToolCall, AgentToolError } from "./contracts";
import { AgentToolRegistry } from "./registry";

const now = () => new Date().toISOString();
const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export type AgentEventListener = (event: AgentEvent) => void;

export class AgentRuntime {
  constructor(private readonly registry: AgentToolRegistry, private readonly emitEvent: AgentEventListener = () => {}) {}

  async run(context: AgentContext, calls: readonly AgentToolCall[], plan?: AgentPlan): Promise<AgentRun> {
    const run: AgentRun = { id: context.runId, sessionId: context.sessionId, status: "running", plan, toolResults: [], createdAt: now() };
    this.emitEvent({ type: "agent.run.started", runId: run.id, sessionId: run.sessionId });
    if (plan) this.emitEvent({ type: "agent.plan.created", runId: run.id, plan });

    for (const call of calls) {
      this.emitEvent({ type: "agent.tool.started", runId: run.id, call });
      const result = await this.registry.execute(call.toolName, call.input, context, call.id);
      run.toolResults.push(result);
      if (!result.ok) {
        this.emitEvent({ type: "agent.tool.failed", runId: run.id, result });
        const error: AgentToolError = result.error ?? { code: "EXECUTION_FAILED", message: "Agent tool failed" };
        run.status = "failed";
        run.completedAt = now();
        this.emitEvent({ type: "agent.run.failed", runId: run.id, error });
        return run;
      }
      this.emitEvent({ type: "agent.tool.completed", runId: run.id, result });
    }

    run.status = "completed";
    run.completedAt = now();
    this.emitEvent({ type: "agent.run.completed", runId: run.id });
    return run;
  }

  static createContext(document: UIDocument, sessionId = createId("session"), runId = createId("run"), selection?: AgentContext["selection"]): AgentContext {
    return { document, sessionId, runId, selection };
  }
}
