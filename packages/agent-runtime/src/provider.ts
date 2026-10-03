// biome-ignore-all format: provider adapters remain compact for review
// biome-ignore-all assist/source/organizeImports: compact provider imports
import type { AgentModelProvider, AgentModelRequest, AgentModelResponse } from "./agent-brain";
import type { AgentMessage, AgentToolCall } from "./contracts";
import { OpenAIResponsesProvider } from "./openai-provider";
import type { AgentProviderConfig } from "./provider-config";

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  name?: string;
  tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string }; extra_content?: { google?: { thought_signature?: string } } }>;
};
type ChatResponse = {
  choices?: Array<{ message?: { role?: string; content?: string | null; tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string }; extra_content?: { google?: { thought_signature?: string } } }> } }>;
  error?: { message?: string; code?: string | number; status?: string; details?: unknown };
};

function toChatMessages(request: AgentModelRequest): ChatMessage[] {
  return request.messages.map((message) => {
    if (message.role === "tool") {
      const callId = message.id.replace(/^tool-result\./, "");
      const toolCall = request.messages.flatMap((item) => item.toolCalls ?? []).find((call) => call.id === callId);
      return { role: "tool", name: toolCall?.toolName ?? callId, content: message.content, tool_call_id: callId };
    }
    if (message.role === "assistant" && message.toolCalls?.length) {
      return {
        role: "assistant",
        content: message.content || null,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id || call.toolName,
          type: "function",
          function: { name: call.toolName, arguments: JSON.stringify(call.input) },
          ...(call.providerMetadata?.gemini?.thoughtSignature
            ? { extra_content: { google: { thought_signature: call.providerMetadata.gemini.thoughtSignature } } }
            : {}),
        })),
      };
    }
    return { role: message.role, content: message.content };
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

async function readProviderResponse(response: Response): Promise<{ data: ChatResponse; raw: string }> {
  const raw = await response.text();
  if (!raw.trim()) return { data: {}, raw };
  try {
    return { data: JSON.parse(raw) as ChatResponse, raw };
  } catch {
    return { data: {}, raw };
  }
}

function providerErrorDetail(data: ChatResponse, raw: string): string {
  const error = data.error;
  const structured = [error?.message, error?.status, error?.code !== undefined ? String(error.code) : ""].filter(Boolean).join(" · ");
  if (structured) return structured;
  return raw.trim().slice(0, 4000);
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
    const { data, raw } = await readProviderResponse(response);
    if (!response.ok) {
      const detail = providerErrorDetail(data, raw);
      throw new Error(`OpenAI-compatible provider request failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
    }
    const message = data.choices?.[0]?.message;
    const calls = (message?.tool_calls ?? [])
      .filter((call) => call.id && call.function?.name)
      .map((call) => ({
        id: call.id || (call.function?.name as string),
        toolName: call.function?.name as string,
        input: JSON.parse(call.function?.arguments ?? "{}"),
        providerMetadata: call.extra_content?.google?.thought_signature
          ? { gemini: { thoughtSignature: call.extra_content.google.thought_signature } }
          : undefined,
      })) satisfies AgentToolCall[];
    const assistant: AgentMessage = {
      id: `provider.${Date.now()}`,
      role: "assistant",
      content: calls.length ? (message?.content ?? "") : (message?.content ?? ""),
      createdAt: new Date().toISOString(),
      toolCalls: calls,
    };
    return { message: assistant, toolCalls: calls, stopReason: calls.length ? "tool_calls" : "stop" };
  }
}

type AnthropicResponse = { content?: Array<{ type?: string; text?: string; id?: string; name?: string; input?: unknown }>; error?: { message?: string } };

export class AnthropicMessagesProvider implements AgentModelProvider {
  constructor(private readonly config: AgentProviderConfig) {}
  async complete(request: AgentModelRequest): Promise<AgentModelResponse> {
    const baseUrl = (this.config.baseUrl ?? "https://api.anthropic.com").replace(/\/$/, "");
    const system = request.messages.filter((message) => message.role === "system").map((message) => message.content).join("\n\n");
    const messages = request.messages.filter((message) => message.role !== "system").map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.role === "tool"
        ? [{ type: "tool_result", tool_use_id: message.id.replace(/^tool-result\./, ""), content: message.content }]
        : message.role === "assistant" && message.toolCalls?.length
          ? message.toolCalls.map((call) => ({ type: "tool_use", id: call.id, name: call.toolName, input: call.input }))
          : message.content,
    }));
    const response = await fetch(baseUrl.endsWith("/messages") ? baseUrl : `${baseUrl}/v1/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": this.config.apiKey, "anthropic-version": "2023-06-01", ...(this.config.headers ?? {}) },
      body: JSON.stringify({ model: this.config.model, max_tokens: 4096, system, messages, tools: request.tools.map((tool) => ({ name: tool.name, description: tool.description, input_schema: tool.inputSchema ?? { type: "object", additionalProperties: true } })) }),
    });
    const data = await response.json() as AnthropicResponse;
    if (!response.ok) throw new Error(data.error?.message ?? `Anthropic request failed with HTTP ${response.status}`);
    const calls = (data.content ?? []).filter((item) => item.type === "tool_use" && item.id && item.name).map((item) => ({ id: item.id as string, toolName: item.name as string, input: item.input ?? {} })) satisfies AgentToolCall[];
    const text = (data.content ?? []).filter((item) => item.type === "text").map((item) => item.text ?? "").join("\n");
    const message: AgentMessage = { id: `anthropic.${Date.now()}`, role: "assistant", content: text, createdAt: new Date().toISOString(), toolCalls: calls };
    return { message, toolCalls: calls, stopReason: calls.length ? "tool_calls" : "stop" };
  }
}

export function createAgentModelProvider(config: AgentProviderConfig): AgentModelProvider {
  switch (config.protocol) {
    case "openai-responses": return new OpenAIResponsesProvider(config);
    case "anthropic-messages": return new AnthropicMessagesProvider(config);
    case "openai-chat": return new OpenAICompatibleProvider(config);
  }
}
