import { describe, expect, it, vi } from "vitest";
import { OpenAICompatibleProvider } from "../src/provider";

const config = {
  id: "gemini",
  name: "Google Gemini",
  protocol: "openai-chat" as const,
  apiKey: "test-key",
  model: "gemini-3.6-flash",
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
};

describe("OpenAICompatibleProvider", () => {
  it("replays Gemini tool calls with name and thought signature", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { role: "assistant", content: null, tool_calls: [{
          id: "call_1",
          type: "function",
          function: { name: "read_project", arguments: "{}" },
          extra_content: { google: { thought_signature: "sig-123" } },
        }] } }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { role: "assistant", content: "Inspection complete." } }],
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAICompatibleProvider(config);
    const first = await provider.complete({
      messages: [{ id: "u1", role: "user", content: "Inspect the project", createdAt: new Date().toISOString() }],
      tools: [{ name: "read_project", description: "Read project", inputSchema: { type: "object" } }],
    });

    await provider.complete({
      messages: [
        { id: "u1", role: "user", content: "Inspect the project", createdAt: new Date().toISOString() },
        first.message,
        { id: "tool-result.call_1", role: "tool", content: JSON.stringify({ ok: true }), createdAt: new Date().toISOString() },
      ],
      tools: [{ name: "read_project", description: "Read project", inputSchema: { type: "object" } }],
    });

    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as { messages: Array<Record<string, unknown>> };
    expect(body.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: "tool", name: "read_project", tool_call_id: "call_1" }),
    ]));
    const replayedAssistant = body.messages.find((message) => message.role === "assistant" && Array.isArray(message.tool_calls));
    expect(replayedAssistant?.content).toBeNull();
    expect((replayedAssistant?.tool_calls as Array<Record<string, unknown>>)?.[0]).toEqual(expect.objectContaining({
      id: "call_1",
      extra_content: { google: { thought_signature: "sig-123" } },
    }));
    vi.unstubAllGlobals();
  });

  it("includes structured provider error details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 400, status: "INVALID_ARGUMENT", message: "Invalid argument" },
    }), { status: 400 })));

    const provider = new OpenAICompatibleProvider(config);
    await expect(provider.complete({
      messages: [{ id: "u1", role: "user", content: "Inspect", createdAt: new Date().toISOString() }],
      tools: [],
    })).rejects.toThrow("HTTP 400: Invalid argument · INVALID_ARGUMENT · 400");
    vi.unstubAllGlobals();
  });

  it("includes raw provider error when response is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("INVALID_ARGUMENT: malformed tool call", { status: 400 })));

    const provider = new OpenAICompatibleProvider(config);
    await expect(provider.complete({
      messages: [{ id: "u1", role: "user", content: "Inspect", createdAt: new Date().toISOString() }],
      tools: [],
    })).rejects.toThrow("HTTP 400: INVALID_ARGUMENT: malformed tool call");
    vi.unstubAllGlobals();
  });
});
