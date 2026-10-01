// biome-ignore-all format: test contract is kept compact for review
import { describe, expect, it } from "vitest";
import { executeWithPolicy, MockAIProvider, PROMPTS, parseJson, prepareDesignContext, runGeneration, validateUIOutput } from "../src/index";

const intent = { domain: "Finance", productType: "Expense Manager", primaryTasks: ["Add transaction", "Review spending"], platforms: ["web", "mobile"] as ("web" | "mobile")[] };

describe("AI orchestration", () => {
  it("uses Design Intelligence before generation", () => {
    const ctx = prepareDesignContext(intent);
    expect(ctx.strategy.version).toBe("uiforge.design-strategy/v1");
    expect(ctx.strategy.skills.length).toBeGreaterThan(0);
  });

  it("is deterministic for the mock provider", async () => {
    const provider = new MockAIProvider();
    const a = await provider.generateStructured({ intent, strategy: prepareDesignContext(intent).strategy, prompt: PROMPTS["ui-generation"] });
    const b = await provider.generateStructured({ intent, strategy: prepareDesignContext(intent).strategy, prompt: PROMPTS["ui-generation"] });
    expect(a.raw).toEqual(b.raw);
    expect(a.metadata.model.model).toBe("deterministic-v1");
    expect(a.metadata.usage?.estimatedCostUsd).toBe(0);
  });

  it("rejects malformed JSON", () => { expect(() => parseJson("{broken")).toThrow("MALFORMED_JSON"); });
  it("rejects schema-invalid output", () => { expect(() => validateUIOutput({ schemaVersion: "wrong", commands: [] })).toThrow("SCHEMA_INVALID"); });

  it("enforces timeout and retry exhaustion", async () => {
    let calls = 0;
    await expect(executeWithPolicy(async signal => {
      calls++;
      await new Promise((_, reject) => {
        const timer = setTimeout(() => reject(new Error("TIMEOUT")), 25);
        signal.addEventListener("abort", () => { clearTimeout(timer); reject(new Error("ABORTED")); }, { once: true });
      });
    }, { timeoutMs: 5, maxRetries: 2 })).rejects.toThrow();
    expect(calls).toBe(3);
  });

  it("records prompt/model metadata and preserves strategy", async () => {
    const result = await runGeneration(new MockAIProvider(), intent);
    expect(result.metadata.prompt.version).toBe("uiforge.ai-prompt/ui-generation-v1");
    expect(result.metadata.model.provider).toBe("mock");
    expect(result.intent.domain).toBe("finance");
    expect(result.strategy.version).toBe("uiforge.design-strategy/v1");
  });
});
