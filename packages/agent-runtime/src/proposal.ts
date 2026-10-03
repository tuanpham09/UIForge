// biome-ignore-all format: proposal engine contract remains compact for review
import { applyCommands, type NodeId, type UICommand, type UIDocument } from "@uiforge/ui-schema";

export type ProposalStatus = "pending" | "applied" | "rejected" | "invalid";
export type ProposalRisk = "safe" | "destructive";
export interface AgentProposal { id: string; baseRevision: number; commands: UICommand[]; summary: string; preview: string[]; risk: ProposalRisk; status: ProposalStatus; }
export interface ProposalApplyResult { status: "applied" | "invalid"; document?: UIDocument; error?: { code: "STALE_PROPOSAL" | "INVALID_PROPOSAL"; message: string }; }
const stableId=(prefix:string,value:unknown)=>{const input=JSON.stringify(value);let hash=2166136261;for(let i=0;i<input.length;i+=1){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619);}return `proposal.${prefix}.${(hash>>>0).toString(16)}`;};
const commandNodeId=(command:UICommand):NodeId|undefined=>{"nodeId" in command&&typeof command.nodeId==="string"?command.nodeId:command.type==="CreateNode"?command.node.id:undefined};
const previewCommand = (command: UICommand): string => {
  const nodeId = commandNodeId(command);
  switch (command.type) {
    case "CreateNode": return `Create ${command.node.type} ${command.node.id}`;
    case "UpdateNode": return `Update node ${nodeId ?? "unknown"}`;
    case "DeleteNode": return `Delete node ${nodeId ?? "unknown"}${command.recursive ? " and descendants" : ""}`;
    case "MoveNode": return `Move node ${nodeId ?? "unknown"} to index ${command.toIndex}`;
    case "SetToken": return `Set ${command.slot} token on ${nodeId ?? "unknown"} → ${command.token}`;
    case "SetResponsiveRule": return `Set ${command.rule.breakpoint} responsive rule on ${nodeId ?? "unknown"}`;
    case "SetVariant": return `Set component variant on ${nodeId ?? "unknown"} → ${command.variant}`;
    case "SetCodeMapping": return `Set code mapping on ${nodeId ?? "unknown"}`;
    case "CreateFrame": return `Create frame ${command.frame.id}`;
    case "UpdateFrame": return `Update frame ${command.frameId}`;
    case "DeleteFrame": return `Delete frame ${command.frameId}`;
    case "ReparentNode": return `Reparent node ${nodeId ?? "unknown"}`;
    case "ApplyVisualDesign": return `Apply visual design to ${command.patches.length} nodes`;
    default: return "Apply semantic UI change";
  }
};

const isDestructive=(command:UICommand)=>command.type==="DeleteNode"||command.type==="DeleteFrame";
export function createProposal(document:UIDocument,commands:readonly UICommand[],summary:string,preview?:readonly string[]):AgentProposal{if(commands.length===0)throw new Error("proposal must contain at least one command");applyCommands(document,commands);return{id:stableId("change",{revision:document.revision.revision,commands}),baseRevision:document.revision.revision,commands:[...commands],summary,preview:[...(preview??commands.map(previewCommand))],risk:commands.some(isDestructive)?"destructive":"safe",status:"pending"};}
export function applyProposal(document:UIDocument,proposal:AgentProposal):ProposalApplyResult{if(proposal.status!=="pending")return{status:"invalid",error:{code:"INVALID_PROPOSAL",message:`proposal is already ${proposal.status}`}};if(document.revision.revision!==proposal.baseRevision)return{status:"invalid",error:{code:"STALE_PROPOSAL",message:`proposal targets revision ${proposal.baseRevision}, current revision is ${document.revision.revision}`}};try{return{status:"applied",document:applyCommands(document,proposal.commands)};}catch(error){return{status:"invalid",error:{code:"INVALID_PROPOSAL",message:error instanceof Error?error.message:String(error)}};}}
export function rejectProposal(proposal:AgentProposal):AgentProposal{return{...proposal,status:"rejected"};}

