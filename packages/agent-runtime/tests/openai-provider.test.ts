// biome-ignore-all format: provider tests remain compact for review
import { describe, expect, it, vi } from "vitest";
import { OpenAIResponsesProvider } from "../src/openai-provider";

describe("OpenAIResponsesProvider", () => {
  it("maps Responses API function calls into AgentBrain tool calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output: [
        { type: "function_call", call_id: "call_1", name: "read_screen", arguments: JSON.stringify({ screenId: "screen.home" }) },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new OpenAIResponsesProvider({ apiKey: "test-key", model: "test-model" });
    const result = await provider.complete({
      messages: [{ id: "u1", role: "user", content: "Inspect the home screen", createdAt: new Date().toISOString() }],
      tools: [{ name: "read_screen", description: "Read a screen", inputSchema: { type: "object", properties: { screenId: { type: "string" } }, required: ["screenId"] } }],
    });
    expect(result.toolCalls).toEqual([{ id: "call_1", toolName: "read_screen", input: { screenId: "screen.home" } }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(init.body)).toContain('"model":"test-model"');
    vi.unstubAllGlobals();
  });

  it("returns structured assistant text when there are no tool calls", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output_text: "I inspected the screen and found no safe change to propose.",
      output: [{ type: "message", content: [{ type: "output_text", text: "I inspected the screen and found no safe change to propose." }] }],
    }), { status: 200 })));
    const provider = new OpenAIResponsesProvider({ apiKey: "test-key" });
    const result = await provider.complete({ messages: [{ id: "u1", role: "user", content: "Review it", createdAt: new Date().toISOString() }], tools: [] });
    expect(result.stopReason).toBe("stop");
    expect(result.message.content).toContain("no safe change");
    vi.unstubAllGlobals();
  });
});
