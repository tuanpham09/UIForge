// biome-ignore-all format: route adapter remains compact for review
import type { AgentContext, AgentEvent, AgentPlan, AgentToolResult } from "@uiforge/agent-runtime";
import { AgentBrain, OpenAIResponsesProvider, createFullAgentToolRegistry, createProposal } from "@uiforge/agent-runtime";
import type { NodeId, UIDocument } from "@uiforge/ui-schema";
import { NextResponse } from "next/server";

type Body={prompt?:unknown;document?:unknown;screenId?:unknown;nodeIds?:unknown;frameIds?:unknown};
const isDocument=(value:unknown):value is UIDocument=>typeof value==="object"&&value!==null&&"nodes" in value&&"screens" in value&&"revision" in value;
const commandsFromResults=(results:readonly AgentToolResult[])=>results.filter(result=>result.ok&&typeof result.output==="object"&&result.output!==null&&"proposal" in result.output).flatMap(result=>{const proposal=(result.output as {proposal?:{commands?:unknown}}).proposal;return Array.isArray(proposal?.commands)?proposal.commands:[];});
export async function POST(request:Request){
 try{
  const body=await request.json() as Body;
  if(typeof body.prompt!=="string"||!body.prompt.trim())return NextResponse.json({error:{code:"INVALID_REQUEST",message:"prompt is required"}},{status:400});
  if(!isDocument(body.document))return NextResponse.json({error:{code:"INVALID_REQUEST",message:"document is required"}},{status:400});
  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey)return NextResponse.json({error:{code:"LLM_NOT_CONFIGURED",message:"OPENAI_API_KEY is not configured on the server."}},{status:503});
  const screenId=typeof body.screenId==="string"?body.screenId:undefined;
  const nodeIds=Array.isArray(body.nodeIds)?body.nodeIds.filter((id):id is NodeId=>typeof id==="string"):[];
  const frameIds=Array.isArray(body.frameIds)?body.frameIds.filter((id):id is string=>typeof id==="string"):[];
  const context:AgentContext={document:body.document,selection:{screenId,nodeIds,frameIds},sessionId:`design-chat.${Date.now()}`,runId:`run.${Date.now()}`};
  const plan:AgentPlan={id:`plan.${Date.now()}`,goal:body.prompt,steps:["Inspect the current selection","Read relevant semantic UI","Validate the UI Schema","Propose semantic changes","Wait for user approval"],createdAt:new Date().toISOString()};
  const systemPrompt=[
   "You are UIForge Design Agent. Work only through the provided semantic UI tools.",
   "Never claim a change was applied. Mutation tools create proposals; the user must explicitly Apply.",
   "Inspect before mutating. Prefer the smallest semantic changes that satisfy the user's request.",
   "For deletion, use delete_node only when the user explicitly asks to remove something.",
   "Use dryRun=true for every mutation.",
   "Do not invent node IDs, screen IDs, token names, or schema values; read them first.",
   `Current document revision: ${body.document.revision.revision}. Active screen: ${screenId??"none"}. Selected nodes: ${nodeIds.join(", ")||"none"}.`,
  ].join("\n");
  const brain=new AgentBrain(new OpenAIResponsesProvider({apiKey,model:process.env.OPENAI_MODEL??"gpt-5",baseUrl:process.env.OPENAI_BASE_URL,instructions:systemPrompt}),createFullAgentToolRegistry(),{maxIterations:8,systemPrompt});
  const run=await brain.run(context,body.prompt);
  const commands=commandsFromResults(run.toolResults);
  const proposal=commands.length?createProposal(body.document,commands,run.message.content||"Proposed UI changes."):undefined;
  const events:AgentEvent[]=run.toolResults.map(result=>({type:result.ok?"agent.tool.completed":"agent.tool.failed",runId:context.runId,result} as AgentEvent));
  return NextResponse.json({reply:run.message.content||"I prepared the requested design analysis.",plan,events,proposal,status:run.status,iterations:run.iterations});
 }catch(error){
  return NextResponse.json({error:{code:"AGENT_REQUEST_FAILED",message:error instanceof Error?error.message:String(error)}},{status:500});
 }
}
