// biome-ignore-all format: agent runtime contract remains compact for review
import type { NodeId, ScreenId, UIDocument } from "@uiforge/ui-schema";
export type AgentRunStatus="queued"|"running"|"waiting_for_approval"|"completed"|"failed"|"cancelled";
export type AgentMessageRole="user"|"assistant"|"system"|"tool";
export interface AgentMessage { id:string; role:AgentMessageRole; content:string; createdAt:string; toolCalls?:readonly AgentToolCall[]; }
export interface AgentSession { id:string; createdAt:string; messages:AgentMessage[]; }
export interface AgentPlan { id:string; goal:string; steps:string[]; createdAt:string; }
export interface AgentToolCall { id:string; toolName:string; input:unknown; providerItemId?:string; providerMetadata?:{gemini?:{thoughtSignature?:string}}; }
export interface AgentToolError { code:"UNKNOWN_TOOL"|"INVALID_INPUT"|"EXECUTION_FAILED"|"CANCELLED"; message:string; details?:unknown; }
export interface AgentToolResult { callId:string; toolName:string; ok:boolean; output?:unknown; error?:AgentToolError; durationMs:number; }
export interface AgentContext { document:UIDocument; selection?:{screenId?:ScreenId;nodeIds:NodeId[];frameIds:string[]}; sessionId:string; runId:string; }
export type AgentEvent=
 |{type:"agent.run.started";runId:string;sessionId:string}|{type:"agent.plan.created";runId:string;plan:AgentPlan}
 |{type:"agent.tool.started";runId:string;call:AgentToolCall}|{type:"agent.tool.completed";runId:string;result:AgentToolResult}
 |{type:"agent.tool.failed";runId:string;result:AgentToolResult}|{type:"agent.run.completed";runId:string}
 |{type:"agent.run.failed";runId:string;error:AgentToolError}|{type:"agent.run.cancelled";runId:string};
export interface AgentRun { id:string;sessionId:string;status:AgentRunStatus;plan?:AgentPlan;toolResults:AgentToolResult[];createdAt:string;completedAt?:string; }
export interface AgentToolDefinition<TInput=unknown,TOutput=unknown>{name:string;description:string;inputSchema?:unknown;validateInput:(input:unknown)=>input is TInput;execute:(input:TInput,context:AgentContext)=>Promise<TOutput>|TOutput;}
