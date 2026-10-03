// biome-ignore-all format: route adapter remains compact for review
// biome-ignore-all assist/source/organizeImports: compact route imports
import { AgentBrain, compactAgentMessages, createAgentModelProvider, createFullAgentToolRegistry, createProposal, type AgentContext, type AgentEvent, type AgentMessage, type AgentPlan, type AgentProviderConfig, type AgentToolResult } from "@uiforge/agent-runtime";
import type { NodeId, UIDocument } from "@uiforge/ui-schema";
import { NextResponse } from "next/server";

type Body = { prompt?: unknown; document?: unknown; screenId?: unknown; nodeIds?: unknown; frameIds?: unknown; sessionId?: unknown; history?: unknown; provider?: unknown };
const isDocument=(value:unknown):value is UIDocument=>typeof value==="object"&&value!==null&&"nodes" in value&&"screens" in value&&"revision" in value;
const isHistory=(value:unknown):value is AgentMessage[]=>Array.isArray(value)&&value.every((item)=>typeof item==="object"&&item!==null&&["user","assistant","system","tool"].includes((item as {role?:unknown}).role as string)&&typeof (item as {content?:unknown}).content==="string");
const commandsFromResults=(results:readonly AgentToolResult[])=>results.filter((result)=>result.ok&&typeof result.output==="object"&&result.output!==null&&"proposal" in result.output).flatMap((result)=>{const proposal=(result.output as {proposal?:{commands?:unknown}}).proposal;return Array.isArray(proposal?.commands)?proposal.commands:[];});
const isProvider=(value:unknown):value is AgentProviderConfig=>{
 if(typeof value!=="object"||value===null)return false;
 const item=value as Record<string,unknown>;
 return typeof item.id==="string"&&typeof item.name==="string"&&typeof item.protocol==="string"&&["openai-responses","openai-chat","anthropic-messages"].includes(item.protocol)&&typeof item.apiKey==="string"&&item.apiKey.length>0&&item.apiKey.length<10000&&typeof item.model==="string"&&item.model.length>0&&(!item.baseUrl||typeof item.baseUrl==="string");
};

export async function POST(request:Request){
 try{
  const body=await request.json() as Body;
  if(typeof body.prompt!=="string"||!body.prompt.trim())return NextResponse.json({error:{code:"INVALID_REQUEST",message:"prompt is required"}},{status:400});
  if(!isDocument(body.document))return NextResponse.json({error:{code:"INVALID_REQUEST",message:"document is required"}},{status:400});
  if(body.provider!==undefined&&!isProvider(body.provider))return NextResponse.json({error:{code:"INVALID_PROVIDER",message:"provider, API key, model and protocol are required"}},{status:400});
  const provider=(body.provider as AgentProviderConfig|undefined)??{
   id:"openai",name:"OpenAI",protocol:"openai-responses",apiKey:process.env.OPENAI_API_KEY??"",model:process.env.OPENAI_MODEL??"gpt-5",baseUrl:process.env.OPENAI_BASE_URL??"https://api.openai.com"
  } satisfies AgentProviderConfig;
  if(!provider.apiKey)return NextResponse.json({error:{code:"LLM_NOT_CONFIGURED",message:"Configure an AI provider API key in Design Agent settings."}},{status:503});
  const screenId=typeof body.screenId==="string"?body.screenId:undefined;
  const nodeIds=Array.isArray(body.nodeIds)?body.nodeIds.filter((id):id is NodeId=>typeof id==="string"):[];
  const frameIds=Array.isArray(body.frameIds)?body.frameIds.filter((id):id is string=>typeof id==="string"):[];
  const sessionId=typeof body.sessionId==="string"&&body.sessionId.length<200?body.sessionId:`design-chat.${Date.now()}`;
  const history=isHistory(body.history)?compactAgentMessages(body.history,32):[];
  const context:AgentContext={document:body.document,selection:{screenId,nodeIds,frameIds},sessionId,runId:`run.${Date.now()}`};
  const bootstrapMode=body.document.screens.length===1&&Object.keys(body.document.nodes).length<=1;
  const bootstrapTools=["read_project","read_screen","inspect_selection","validate_ui","create_flow"] as const;
  const plan:AgentPlan={id:`plan.${Date.now()}`,goal:body.prompt,steps:["Use prior conversation context","Inspect the current selection","Read relevant semantic UI","Validate the UI Schema","Propose semantic changes","Wait for user approval"],createdAt:new Date().toISOString()};
  const systemPrompt=[
   "You are UIForge Design Agent. Work only through the provided semantic UI tools.",
   "You are a persistent multi-turn design agent. Resolve references such as 'that button', 'it', and 'again' using the conversation and fresh UI inspection.",
   "Never claim a change was applied. Mutation tools create proposals; the user must explicitly Apply.",
   "Inspect before mutating. Prefer the smallest semantic changes that satisfy the user's request.",
   "For deletion, use delete_node only when the user explicitly asks to remove something.",
   "Use dryRun=true for every mutation.",
   "When bootstrapping a new empty product, prefer create_flow: generate the complete initial screen set and semantic nodes in one proposal. Use create_screen/create_node only for incremental edits or when a flow cannot be expressed by create_flow.",
   "For initial wireframes, prioritize product flow, hierarchy, content structure, and actionable states; do not apply visual styling unless the user explicitly asks for visual design.",
   "A wireframe screen must contain concrete UI semantics, not just empty containers. Use text for headings/labels, cards for grouped content, list/list-item for repeated records, buttons for primary actions, inputs/selects for data entry, images/icons when the product needs them. Sections are containers only and do not count as meaningful screen content.",
   "For every bootstrap screen, create at least two concrete UI nodes appropriate to that screen's purpose. Prefer a realistic hierarchy such as screen-root → section/card/list → text/button/input/list-item. Do not create placeholder nodes such as 'Header' or 'Lesson Root' unless they contain real child UI elements.",
   "Use the actual Product Intent to choose labels and controls. The generated wireframe should be understandable to a human reviewing the canvas without opening the layer inspector.",
   "When bootstrapping an empty or nearly empty project, do not stop after inspecting the Home screen. Infer the main user journey from Product Intent, create the necessary destination screens, then populate those screens with semantic nodes. Aim for a coherent 3-7 screen journey when the product scope supports it.",
   "Build incrementally: create screens first, then create their child nodes, then add interaction targets only after destination screen IDs are known. Re-read the working screens after mutations to verify the hierarchy before finishing.",
   "The working document is updated after every successful mutation. You may reference IDs created by earlier tool calls in the same run.",
   "For bootstrap: inspect once, create one coherent flow, validate/re-read it, then stop and return the proposal. Do not spend iterations repeatedly searching or rereading unchanged nodes.",
   ...(bootstrapMode ? [
    "BOOTSTRAP MODE IS ACTIVE: this is an empty project.",
    "You may only use read_project, read_screen, inspect_selection, validate_ui, and create_flow.",
    "create_flow is the only mutation tool available. Do not attempt create_node, create_screen, create_frame, update_node, delete_node, move_node, set_style, set_token, set_layout, set_responsive_rule, or create_component.",
    "After a successful create_flow, validate or re-read the generated flow once and finish with the proposal."
   ].join("\n") : ""),
   "A successful create_flow call is sufficient to propose the initial wireframe only when every screen has concrete content. If create_flow rejects the proposal as too thin, fix the flow by adding concrete semantic nodes and call create_flow once more; do not enter a read/search loop.",
   "Do not invent node IDs, screen IDs, token names, or schema values; read them first.",
   `Current document revision: ${body.document.revision.revision}. Active screen: ${screenId??"none"}. Selected nodes: ${nodeIds.join(", ")||"none"}.`,
  ].join("\n");
  const brain=new AgentBrain(createAgentModelProvider(provider),createFullAgentToolRegistry(),{maxIterations:bootstrapMode?6:16,systemPrompt,history,maxContextMessages:40,allowedTools:bootstrapMode?bootstrapTools:undefined});
  const run=await brain.run(context,body.prompt);
  const commands=commandsFromResults(run.toolResults);
  const proposal=commands.length?createProposal(body.document,commands,run.message.content||"Proposed UI changes."):undefined;
  const events:AgentEvent[]=run.toolResults.map(result=>({type:result.ok?"agent.tool.completed":"agent.tool.failed",runId:context.runId,result} as AgentEvent));
  return NextResponse.json({reply:run.message.content||"I prepared the requested design analysis.",plan,events,proposal,status:run.status,iterations:run.iterations,sessionId,memory:run.messages});
 }catch(error){
  return NextResponse.json({error:{code:"AGENT_REQUEST_FAILED",message:error instanceof Error?error.message:String(error)}},{status:500});
 }
}
