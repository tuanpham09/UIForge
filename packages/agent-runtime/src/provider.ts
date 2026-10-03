// biome-ignore-all format: provider adapters remain compact for review
import type { AgentModelProvider, AgentModelRequest, AgentModelResponse } from "./agent-brain";
import type { AgentMessage, AgentToolCall } from "./contracts";
import type { AgentProviderConfig } from "./provider-config";

type ChatMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string; tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }> };
type ChatResponse = { choices?: Array<{ message?: { role?: string; content?: string; tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string } }> } }>; error?: { message?: string } };

function toChatMessages(request: AgentModelRequest): ChatMessage[] {
  return request.messages.map((message) => {
    if (message.role === "tool") return { role: "tool", content: message.content, tool_call_id: message.id.replace(/^tool-result\./, "") };
    if (message.role === "assistant" && message.toolCalls?.length) {
      return {
        role: "assistant",
        content: message.content,
        tool_calls: message.toolCalls.map((call) => ({ id: call.id, type: "function", function: { name: call.toolName, arguments: JSON.stringify(call.input) } })),
      };
    }
    return { role: message.role === "system" ? "system" : message.role, content: message.content };
  });
}

function toolsForChat(request: AgentModelRequest) {
  return request.tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema ?? { type: "object", additionalProperties: true },
    },
  }));
}

export class OpenAICompatibleProvider implements AgentModelProvider {
  constructor(private readonly config: AgentProviderConfig) {}

  async complete(request: AgentModelRequest): Promise<AgentModelResponse> {
    const baseUrl = (this.config.baseUrl ?? "").replace(/\/$/, "");
    const response = await fetch(baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.config.apiKey}`, ...(this.config.headers ?? {}) },
      body: JSON.stringify({ model: this.config.model, messages: toChatMessages(request), tools: toolsForChat(request), tool_choice: "auto" }),
    });
    const data = await response.json() as ChatResponse;
    if (!response.ok) throw new Error(data.error?.message ?? `Provider request failed with HTTP ${response.status}`);
    const message = data.choices?.[0]?.message;
    const calls = (message?.tool_calls ?? []).filter((call) => call.id && call.function?.name).map((call) => ({
      id: call.id as string,
      toolName: call.function?.name as string,
      input: JSON.parse(call.function?.arguments ?? "{}"),
    })) satisfies AgentToolCall[];
    const assistant: AgentMessage = { id: `provider.${Date.now()}`, role: "assistant", content: message?.content ?? "", createdAt: new Date().toISOString(), toolCalls: calls };
    return { message: assistant, toolCalls: calls, stopReason: calls.length ? "tool_calls" : "stop" };
  }
}

type AnthropicResponse = {
  content?: Array<{ type?: string; text?: string; id?: string; name?: string; input?: unknown }>;
  error?: { message?: string };
};

export class AnthropicMessagesProvider implements AgentModelProvider {
  constructor(private readonly config: AgentProviderConfig) {}

  async complete(request: AgentModelRequest): Promise<AgentModelResponse> {
    const baseUrl = (this.config.baseUrl ?? "https://api.anthropic.com").replace(/\/$/, "");
    const system = request.messages.filter((message) => message.role === "system").map((message) => message.content).join("\n\n");
    const messages = request.messages.filter((message) => message.role !== "system").map((message) => ({
      role: message.role === "assistant" ? "assistant" : message.role === "tool" ? "user" : "user",
      content: message.role === "tool"
        ? [{ type: "tool_result", tool_use_id: message.id.replace(/^tool-result\./, ""), content: message.content }]
        : message.role === "assistant" && message.toolCalls?.length
          ? message.toolCalls.map((call) => ({ type: "tool_use", id: call.id, name: call.toolName, input: call.input }))
          : message.content,
    }));
    const response = await fetch(baseUrl.endsWith("/messages") ? baseUrl : `${baseUrl}/v1/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": this.config.apiKey, "anthropic-version": "2023-06-01", ...(this.config.headers ?? {}) },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 4096,
        system,
        messages,
        tools: request.tools.map((tool) => ({ name: tool.name, description: tool.description, input_schema: tool.inputSchema ?? { type: "object", additionalProperties: true } })),
      }),
    });
    const data = await response.json() as AnthropicResponse;
    if (!response.ok) throw new Error(data.error?.message ?? `Anthropic request failed with HTTP ${response.status}`);
    const calls = (data.content ?? []).filter((item) => item.type === "tool_use" && item.id && item.name).map((item) => ({
      id: item.id as string,
      toolName: item.name as string,
      input: item.input ?? {},
    })) satisfies AgentToolCall[];
    const text = (data.content ?? []).filter((item) => item.type === "text").map((item) => item.text ?? "").join("\n");
    const message: AgentMessage = { id: `anthropic.${Date.now()}`, role: "assistant", content: text, createdAt: new Date().toISOString(), toolCalls: calls };
    return { message, toolCalls: calls, stopReason: calls.length ? "tool_calls" : "stop" };
  }
}

export function createAgentModelProvider(config: AgentProviderConfig): AgentModelProvider {
  switch (config.protocol) {
    case "openai-responses": {
      const { OpenAIResponsesProvider } = requireProvider("./openai-provider");
      return new OpenAIResponsesProvider(config);
    }
    case "anthropic-messages": return new AnthropicMessagesProvider(config);
    case "openai-chat": return new OpenAICompatibleProvider(config);
  }
}

function requireProvider(_path: string): { OpenAIResponsesProvider: new (options: AgentProviderConfig) => AgentModelProvider } {
  // Static import is intentionally avoided here to keep this adapter file protocol-focused.
  return { OpenAIResponsesProvider: OpenAIResponsesProviderImpl };
}

class OpenAIResponsesProviderImpl implements AgentModelProvider {
  private readonly delegate: import("./openai-provider").OpenAIResponsesProvider;
  constructor(config: AgentProviderConfig) {
    const { OpenAIResponsesProvider } = getOpenAIProvider();
    this.delegate = new OpenAIResponsesProvider(config);
  }
  complete(request: AgentModelRequest): Promise<AgentModelResponse> { return this.delegate.complete(request); }
}

function getOpenAIProvider(): typeof import("./openai-provider") {
  throw new Error("OpenAI Responses provider loader must be replaced at build time");
}
