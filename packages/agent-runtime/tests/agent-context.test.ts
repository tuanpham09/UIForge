// biome-ignore-all format: provider tests remain compact for review
// biome-ignore-all assist/source/organizeImports: compact test imports
import { AgentBrain } from "../src/agent-brain";
import { compactAgentMessages } from "../src/context-memory";
import { createAgentModelProvider, OpenAICompatibleProvider } from "../src/provider";
import { AGENT_PROVIDER_PRESETS } from "../src/provider-config";
import { AgentToolRegistry } from "../src/registry";
import { describe, expect, it, vi } from "vitest";
  it("keeps system context and the latest messages within the bound", () => {
    const messages = Array.from({ length: 10 }, (_, index) => ({ id: String(index), role: index === 0 ? "system" as const : "user" as const, content: String(index), createdAt: new Date().toISOString() }));
    const compacted = compactAgentMessages(messages, 4);
    expect(compacted).toHaveLength(4);
    expect(compacted[0]?.role).toBe("system");
    expect(compacted.at(-1)?.content).toBe("9");
  });

  it("passes prior history into the provider", async () => {
    const provider = { complete: vi.fn().mockResolvedValue({ message: { id: "a", role: "assistant", content: "I remember the button.", createdAt: new Date().toISOString() }, stopReason: "stop" }) };
    const registry = new AgentToolRegistry();
    const brain = new AgentBrain(provider, registry, { history: [{ id: "old", role: "user", content: "The button says Save.", createdAt: new Date().toISOString() }] });
    await brain.run({ document: {} as never, sessionId: "s", runId: "r" }, "change it");
    expect(provider.complete).toHaveBeenCalledWith(expect.objectContaining({ messages: expect.arrayContaining([expect.objectContaining({ content: "The button says Save." })]) }));
  });
});

describe("provider configuration", () => {
  it("contains OpenAI, Gemini, Anthropic, OpenRouter and custom presets", () => {
    expect(AGENT_PROVIDER_PRESETS.map((item) => item.id)).toEqual(["openai", "gemini", "anthropic", "openrouter", "custom"]);
  });

  it("maps Gemini to the OpenAI-compatible chat provider", () => {
    const provider = createAgentModelProvider({ id: "gemini", name: "Google Gemini", protocol: "openai-chat", apiKey: "test", model: "gemini-3.6-flash", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai" });
    expect(provider).toBeInstanceOf(OpenAICompatibleProvider);
  });
});
