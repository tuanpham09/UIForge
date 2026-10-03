// biome-ignore-all format: compact product UI surface
// biome-ignore-all assist/source/organizeImports: compact product import surface
"use client";

import { AGENT_PROVIDER_PRESETS, getAgentProviderPreset, runDesignChat, type AgentMessage, type AgentProviderConfig, type DesignChatResult, type DesignProposal } from "@uiforge/agent-runtime";
import type { NodeId, ScreenId, UIDocument } from "@uiforge/ui-schema";
import { useMemo, useState } from "react";
"use client";

import { type DesignChatResult, type DesignProposal, runDesignChat, type AgentMessage, type AgentProviderConfig, AGENT_PROVIDER_PRESETS, getAgentProviderPreset } from "@uiforge/agent-runtime";
import { useMemo, useState } from "react";

type Message = { id:string; role:"user"|"assistant"; text:string };
type Props = { document:UIDocument; screenId:ScreenId; nodeIds:NodeId[]; frameIds:string[]; open:boolean; onClose:()=>void; onApply:(proposal:DesignProposal)=>void; };

const sessionId=()=>`design-chat.${Date.now()}.${Math.random().toString(36).slice(2,8)}`;

export default function AgentDesignChat({ document, screenId, nodeIds, frameIds, open, onClose, onApply }:Props) {
 const [messages,setMessages]=useState<Message[]>([]);
 const [memory,setMemory]=useState<AgentMessage[]>([]);
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState<DesignChatResult|null>(null);
 const [appliedId,setAppliedId]=useState<string|null>(null);
 const [showSettings,setShowSettings]=useState(false);
 const [_session,setSession]=useState(sessionId);
 const [provider,setProvider]=useState<AgentProviderConfig>(()=>{const preset=AGENT_PROVIDER_PRESETS[0];return{id:preset.id,name:preset.name,protocol:preset.protocol,baseUrl:preset.baseUrl,model:preset.defaultModel,apiKey:""};});
 const contextLabel=useMemo(()=>nodeIds.length?`${nodeIds.length} selected node${nodeIds.length>1?"s":""}`:"No node selected",[nodeIds]);

 if(!open)return null;

 const selectProvider=(id:string)=>{
  const preset=getAgentProviderPreset(id); if(!preset)return;
  setProvider((current)=>({...current,id:preset.id,name:preset.name,protocol:preset.protocol,baseUrl:preset.baseUrl,model:preset.defaultModel}));
 };

 const resetSession=()=>{setSession(sessionId());setMemory([]);setMessages([]);setResult(null);setAppliedId(null);};

 const runServerAgent=async(request:string):Promise<DesignChatResult|null>=>{
  if(!provider.apiKey.trim())return null;
  const response=await fetch("/api/agent/design",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
   prompt:request,document,screenId,nodeIds,frameIds,sessionId,history:memory.slice(-32),
   provider:{...provider,apiKey:provider.apiKey.trim()},
  })});
  if(!response.ok)return null;
  const next=await response.json() as DesignChatResult & {memory?:AgentMessage[];sessionId?:string};
  if(next.memory)setMemory(next.memory);
  if(next.sessionId)setSession(next.sessionId);
  return next;
 };

 const send=async()=>{
  const request=draft.trim(); if(!request||busy)return;
  setDraft("");setMessages((items)=>[...items,{id:`${Date.now()}`,role:"user",text:request}]);setBusy(true);
  try{
   const next=(await runServerAgent(request))??await runDesignChat(document,request,{screenId,nodeIds,frameIds});
   setResult(next);setMessages((items)=>[...items,{id:`${Date.now()}-assistant`,role:"assistant",text:next.reply}]);
  }finally{setBusy(false);}
 };

 return <aside className="flex h-full min-w-0 flex-col border-l border-slate-800 bg-slate-950" data-testid="agent-design-chat">
  <header className="border-b border-slate-800 px-3 py-2.5">
   <div className="flex items-center justify-between">
    <div><p className="text-xs font-semibold text-white">Design Agent</p><p className="text-[10px] text-slate-500">{provider.name} · {provider.model} · {contextLabel}</p></div>
    <div className="flex gap-1"><button type="button" onClick={()=>setShowSettings((value)=>!value)} className="rounded px-2 py-1 text-[10px] text-slate-400 hover:bg-slate-800">⚙ AI</button><button type="button" aria-label="Close Design Chat" onClick={onClose} className="rounded px-2 py-1 text-slate-400 hover:bg-slate-800">✕</button></div>
   </div>
   {showSettings?<div className="mt-3 space-y-2 rounded-lg border border-slate-800 bg-slate-900 p-2" data-testid="agent-provider-settings">
    <label className="block text-[10px] text-slate-500">Provider<select value={provider.id} onChange={(event)=>selectProvider(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-white">{AGENT_PROVIDER_PRESETS.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label className="block text-[10px] text-slate-500">API key<input type="password" autoComplete="off" value={provider.apiKey} onChange={(event)=>setProvider((current)=>({...current,apiKey:event.target.value}))} placeholder="Stored only in this session" className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-white"/></label>
    <label className="block text-[10px] text-slate-500">Model<input value={provider.model} onChange={(event)=>setProvider((current)=>({...current,model:event.target.value}))} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-white"/></label>
    <label className="block text-[10px] text-slate-500">Endpoint / Base URL<input value={provider.baseUrl??""} onChange={(event)=>setProvider((current)=>({...current,baseUrl:event.target.value}))} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-white"/></label>
    <p className="text-[9px] leading-4 text-slate-600">API keys are not written to the UI document or local storage. Custom endpoints support OpenAI-compatible APIs.</p>
    <button type="button" onClick={resetSession} className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-800">New agent session</button>
   </div>:null}
  </header>
  <div className="flex-1 space-y-3 overflow-auto p-3">
   {messages.length===0?<div className="rounded-lg border border-dashed border-slate-700 p-3 text-[11px] leading-5 text-slate-500"><p className="font-medium text-slate-300">Describe a design change</p><p className="mt-1">The agent can inspect the semantic UI, use tools, remember earlier turns, and propose changes for approval.</p></div>:messages.map((message)=><div key={message.id} className={message.role==="user"?"ml-4 rounded-lg bg-cyan-500/10 p-2 text-[11px] text-cyan-100":"mr-2 rounded-lg border border-slate-800 bg-slate-900 p-2 text-[11px] text-slate-300"}><span className="mb-1 block text-[9px] uppercase tracking-wider text-slate-500">{message.role}</span>{message.text}</div>)}
   {busy?<div className="text-[10px] text-cyan-300">Agent is inspecting the current UI…</div>:null}
   {result?<details open className="rounded-lg border border-slate-800 bg-slate-900"><summary className="cursor-pointer px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Agent plan & tools</summary><div className="space-y-2 px-2 pb-2"><ol className="list-decimal pl-4 text-[10px] text-slate-400">{result.plan.steps.map((step)=><li key={step}>{step}</li>)}</ol><div className="space-y-1">{result.events.filter((event)=>event.type==="agent.tool.completed").map((event)=>event.type==="agent.tool.completed"?<div key={event.result.callId} className="text-[10px] text-emerald-300">✓ {event.result.toolName}</div>:null)}</div></div></details>:null}
   {result?.proposal?<div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3" data-testid="agent-proposal"><p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">Proposed change</p><p className="mt-1 text-xs text-slate-200">{result.proposal.summary}</p><ul className="mt-2 space-y-1 text-[10px] text-slate-400">{result.proposal.preview.map((item)=><li key={item}>• {item}</li>)}</ul>{appliedId===result.proposal.id?<p className="mt-2 text-[10px] text-emerald-300">Applied to UI Schema.</p>:<div className="mt-3 flex gap-2"><button type="button" data-testid="agent-apply" onClick={()=>{const proposal=result.proposal;if(!proposal)return;onApply(proposal);setAppliedId(proposal.id)}} className="rounded bg-cyan-500 px-3 py-1.5 text-[10px] font-medium text-slate-950">Apply</button><button type="button" data-testid="agent-reject" onClick={()=>setResult(null)} className="rounded border border-slate-700 px-3 py-1.5 text-[10px] text-slate-300">Reject</button></div>}</div>:null}
  </div>
  <footer className="border-t border-slate-800 p-2"><div className="flex gap-2"><textarea data-testid="agent-chat-input" value={draft} onChange={(event)=>setDraft(event.target.value)} onKeyDown={(event)=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();void send()}}} placeholder="Ask UIForge to change the design…" className="min-h-16 flex-1 resize-none rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-[11px] text-white outline-none focus:border-cyan-500"/><button type="button" data-testid="agent-chat-send" disabled={busy||!draft.trim()} onClick={()=>void send()} className="self-end rounded-lg bg-cyan-500 px-3 py-2 text-[10px] font-medium text-slate-950 disabled:opacity-40">Send</button></div></footer>
 </aside>;
}
