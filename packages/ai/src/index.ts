import { composeStrategy, validateStrategy, type DesignStrategy, type ProductIntent } from "@uiforge/design-intelligence";

export const AI_CONTRACT_VERSION = "uiforge.ai/v1" as const;
export const DEFAULT_TIMEOUT_MS = 15_000;
export const DEFAULT_MAX_RETRIES = 2;
export type PromptId = "ui-generation" | "patch-proposal" | "screenshot-analysis";
export type PromptVersion = { id: PromptId; version: string };
export type ModelVersion = { provider: string; model: string; version?: string };
export type UsageMetadata = { inputTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd?: number };
export type ProviderMetadata = { provider: string; model: ModelVersion; prompt: PromptVersion; requestId: string; usage?: UsageMetadata; latencyMs: number };
export type StructuredGenerationRequest = { intent: ProductIntent; strategy: DesignStrategy; prompt: PromptVersion };
export type UICommand = { type: "create-screen" | "update-screen" | "create-component"; id: string; props: Record<string, unknown> };
export type UIExecutionOutput = { schemaVersion: "uiforge.ui-output/v1"; commands: UICommand[] };
export type PatchProposal = { schemaVersion: "uiforge.patch/v1"; operations: Array<{ op: "add" | "replace" | "remove"; path: string; value?: unknown }> };
export type ScreenshotAnalysis = { schemaVersion: "uiforge.screenshot-analysis/v1"; findings: Array<{ id: string; severity: "info" | "warning" | "error"; message: string }> };
export type ProviderResult<T> = { raw: T; metadata: ProviderMetadata };
export type AIProvider = {
  generateStructured(request: StructuredGenerationRequest, signal?: AbortSignal): Promise<ProviderResult<unknown>>;
  proposePatch(input: { strategy: DesignStrategy; prompt: PromptVersion }, signal?: AbortSignal): Promise<ProviderResult<unknown>>;
  analyzeScreenshot(input: { image: string; prompt: PromptVersion }, signal?: AbortSignal): Promise<ProviderResult<unknown>>;
};

export const PROMPTS: Readonly<Record<PromptId, PromptVersion>> = {
  "ui-generation": { id: "ui-generation", version: "uiforge.ai-prompt/ui-generation-v1" },
  "patch-proposal": { id: "patch-proposal", version: "uiforge.ai-prompt/patch-proposal-v1" },
  "screenshot-analysis": { id: "screenshot-analysis", version: "uiforge.ai-prompt/screenshot-analysis-v1" }
};

export function normalizeIntent(intent: ProductIntent): ProductIntent {
  return {
    domain: intent.domain.trim().toLowerCase(),
    productType: intent.productType.trim().toLowerCase(),
    primaryTasks: [...new Set(intent.primaryTasks.map(x => x.trim()).filter(Boolean))],
    platforms: [...new Set(intent.platforms)]
  };
}

export function prepareDesignContext(intent: ProductIntent): { intent: ProductIntent; strategy: DesignStrategy } {
  const normalized = normalizeIntent(intent);
  const strategy = composeStrategy(normalized);
  const errors = validateStrategy(strategy);
  if (errors.length) throw new Error("DESIGN_STRATEGY_INVALID:" + errors.join(","));
  return { intent: normalized, strategy };
}

export function parseJson<T>(raw: unknown): T {
  if (typeof raw !== "string") return raw as T;
  try { return JSON.parse(raw) as T; } catch { throw new Error("MALFORMED_JSON"); }
}

export function validateUIOutput(value: unknown): UIExecutionOutput {
  if (!value || typeof value !== "object") throw new Error("SCHEMA_INVALID:ui-output");
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== "uiforge.ui-output/v1" || !Array.isArray(v.commands)) throw new Error("SCHEMA_INVALID:ui-output");
  for (const command of v.commands) {
    if (!command || typeof command !== "object") throw new Error("SCHEMA_INVALID:command");
    const c = command as Record<string, unknown>;
    if (!["create-screen", "update-screen", "create-component"].includes(String(c.type)) || typeof c.id !== "string" || !c.props || typeof c.props !== "object") throw new Error("SCHEMA_INVALID:command");
  }
  return value as UIExecutionOutput;
}

export function validatePatch(value: unknown): PatchProposal {
  if (!value || typeof value !== "object") throw new Error("SCHEMA_INVALID:patch");
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== "uiforge.patch/v1" || !Array.isArray(v.operations)) throw new Error("SCHEMA_INVALID:patch");
  return value as PatchProposal;
}

export function validateScreenshotAnalysis(value: unknown): ScreenshotAnalysis {
  if (!value || typeof value !== "object") throw new Error("SCHEMA_INVALID:screenshot-analysis");
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== "uiforge.screenshot-analysis/v1" || !Array.isArray(v.findings)) throw new Error("SCHEMA_INVALID:screenshot-analysis");
  return value as ScreenshotAnalysis;
}

export type RetryPolicy = { timeoutMs: number; maxRetries: number };

export async function executeWithPolicy<T>(operation: (signal: AbortSignal) => Promise<T>, policy: RetryPolicy = { timeoutMs: DEFAULT_TIMEOUT_MS, maxRetries: DEFAULT_MAX_RETRIES }): Promise<T> {
  if (policy.timeoutMs <= 0 || policy.maxRetries < 0 || policy.maxRetries > 5) throw new Error("INVALID_RETRY_POLICY");
  let lastError: unknown;
  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), policy.timeoutMs);
    try { return await operation(controller.signal); }
    catch (error) { lastError = error; }
    finally { clearTimeout(timer); }
  }
  throw lastError instanceof Error ? lastError : new Error("RETRY_EXHAUSTED");
}

export class MockAIProvider implements AIProvider {
  readonly metadataBase: ModelVersion = { provider: "mock", model: "deterministic-v1", version: "1" };
  async generateStructured(request: StructuredGenerationRequest): Promise<ProviderResult<unknown>> {
    const normalized = normalizeIntent(request.intent);
    return { raw: { schemaVersion: "uiforge.ui-output/v1", commands: [{ type: "create-screen", id: "screen-1", props: { domain: normalized.domain, productType: normalized.productType, skills: request.strategy.skills } }] }, metadata: this.meta(request.prompt) };
  }
  async proposePatch(input: { strategy: DesignStrategy; prompt: PromptVersion }): Promise<ProviderResult<unknown>> {
    return { raw: { schemaVersion: "uiforge.patch/v1", operations: [{ op: "add", path: "/strategyVersion", value: input.strategy.version }] }, metadata: this.meta(input.prompt) };
  }
  async analyzeScreenshot(input: { image: string; prompt: PromptVersion }): Promise<ProviderResult<unknown>> {
    return { raw: { schemaVersion: "uiforge.screenshot-analysis/v1", findings: [{ id: "deterministic-1", severity: "info", message: "image-bytes:" + input.image.length }] }, metadata: this.meta(input.prompt) };
  }
  private meta(prompt: PromptVersion): ProviderMetadata {
    return { provider: "mock", model: this.metadataBase, prompt, requestId: "mock-request-1", usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 }, latencyMs: 0 };
  }
}

export type HttpAIProviderOptions = { endpoint: string; apiKey?: string; model: ModelVersion; fetchImpl?: typeof fetch };

export class HttpAIProvider implements AIProvider {
  private readonly fetchImpl: typeof fetch;
  constructor(private readonly options: HttpAIProviderOptions) { this.fetchImpl = options.fetchImpl ?? fetch; }
  generateStructured(request: StructuredGenerationRequest, signal?: AbortSignal) { return this.call("generate", { request }, PROMPTS["ui-generation"], signal); }
  proposePatch(input: { strategy: DesignStrategy; prompt: PromptVersion }, signal?: AbortSignal) { return this.call("patch", { input }, input.prompt, signal); }
  analyzeScreenshot(input: { image: string; prompt: PromptVersion }, signal?: AbortSignal) { return this.call("screenshot", { input }, input.prompt, signal); }
  private async call(operation: string, body: unknown, prompt: PromptVersion, signal?: AbortSignal): Promise<ProviderResult<unknown>> {
    const started = Date.now();
    const response = await this.fetchImpl(this.options.endpoint.replace(/\/$/, "") + "/" + operation, {
      method: "POST",
      headers: { "content-type": "application/json", ...(this.options.apiKey ? { authorization: "Bearer " + this.options.apiKey } : {}) },
      body: JSON.stringify(body),
      signal
    });
    if (!response.ok) throw new Error("PROVIDER_HTTP_" + response.status);
    const payload = await response.json() as { output: unknown; requestId?: string; usage?: UsageMetadata };
    return { raw: payload.output, metadata: { provider: this.options.model.provider, model: this.options.model, prompt, requestId: payload.requestId ?? "unknown", usage: payload.usage, latencyMs: Date.now() - started } };
  }
}

export async function runGeneration(provider: AIProvider, intent: ProductIntent, policy?: RetryPolicy): Promise<{ output: UIExecutionOutput; metadata: ProviderMetadata; intent: ProductIntent; strategy: DesignStrategy }> {
  const context = prepareDesignContext(intent);
  const result = await executeWithPolicy(signal => provider.generateStructured({ ...context, prompt: PROMPTS["ui-generation"] }, signal), policy);
  const output = validateUIOutput(parseJson(result.raw));
  return { output, metadata: result.metadata, ...context };
}
