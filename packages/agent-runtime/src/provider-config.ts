// biome-ignore-all format: provider catalog remains compact for review
export type AgentProviderProtocol = "openai-responses" | "openai-chat" | "anthropic-messages";

export interface AgentProviderConfig {
  id: string;
  name: string;
  protocol: AgentProviderProtocol;
  apiKey: string;
  model: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  enabled?: boolean;
}

export interface AgentProviderPreset {
  id: string;
  name: string;
  protocol: AgentProviderProtocol;
  baseUrl: string;
  defaultModel: string;
  description: string;
}

export const AGENT_PROVIDER_PRESETS: readonly AgentProviderPreset[] = [
  { id: "openai", name: "OpenAI", protocol: "openai-responses", baseUrl: "https://api.openai.com", defaultModel: "gpt-5", description: "OpenAI Responses API" },
  { id: "gemini", name: "Google Gemini", protocol: "openai-chat", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", defaultModel: "gemini-3.6-flash", description: "Gemini OpenAI-compatible API" },
  { id: "anthropic", name: "Anthropic", protocol: "anthropic-messages", baseUrl: "https://api.anthropic.com", defaultModel: "claude-sonnet-4-5", description: "Anthropic Messages API" },
  { id: "openrouter", name: "OpenRouter", protocol: "openai-chat", baseUrl: "https://openrouter.ai/api/v1", defaultModel: "openai/gpt-5", description: "OpenAI-compatible multi-model gateway" },
  { id: "custom", name: "Custom / Local", protocol: "openai-chat", baseUrl: "http://localhost:11434/v1", defaultModel: "qwen3", description: "Any OpenAI-compatible endpoint" },
];

export function getAgentProviderPreset(id: string): AgentProviderPreset | undefined {
  return AGENT_PROVIDER_PRESETS.find((provider) => provider.id === id);
}

export function sanitizeProviderConfig(config: AgentProviderConfig): Omit<AgentProviderConfig, "apiKey"> & { hasApiKey: boolean } {
  const { apiKey, ...safe } = config;
  return { ...safe, hasApiKey: Boolean(apiKey) };
}
