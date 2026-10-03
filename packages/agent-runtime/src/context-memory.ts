// biome-ignore-all format: bounded session memory helpers remain compact for review
import type { AgentMessage, AgentSession } from "./contracts";

export function createAgentSession(id: string): AgentSession {
  return { id, createdAt: new Date().toISOString(), messages: [] };
}

export function appendAgentMessages(
  session: AgentSession,
  messages: readonly AgentMessage[],
): AgentSession {
  return { ...session, messages: [...session.messages, ...messages] };
}

export function compactAgentMessages(
  messages: readonly AgentMessage[],
  maxMessages = 32,
): AgentMessage[] {
  if (messages.length <= maxMessages) return [...messages];
  const system = messages
    .filter((message) => message.role === "system")
    .slice(0, 1);
  const recent = messages
    .filter((message) => message.role !== "system")
    .slice(-Math.max(1, maxMessages - system.length));
  return [...system, ...recent];
}

export function sessionSummary(session: AgentSession): string {
  const turns = session.messages.filter(
    (message) => message.role === "user",
  ).length;
  return `Session ${session.id}: ${turns} user turn(s), ${session.messages.length} context message(s).`;
}
