// biome-ignore-all format: route adapter remains compact for review
// biome-ignore-all assist/source/organizeImports: compact route imports
type Body={prompt?:unknown;document?:unknown;screenId?:unknown;nodeIds?:unknown;frameIds?:unknown;sessionId?:unknown;history?:unknown;provider?:unknown};
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
  const plan:AgentPlan={id:`plan.${Date.now()}`,goal:body.prompt,steps:["Use prior conversation context","Inspect the current selection","Read relevant semantic UI","Validate the UI Schema","Propose semantic changes","Wait for user approval"],createdAt:new Date().toISOString()};
  const systemPrompt=[
   "You are UIForge Design Agent. Work only through the provided semantic UI tools.",
   "You are a persistent multi-turn design agent. Resolve references such as 'that button', 'it', and 'again' using the conversation and fresh UI inspection.",
   "Never claim a change was applied. Mutation tools create proposals; the user must explicitly Apply.",
   "Inspect before mutating. Prefer the smallest semantic changes that satisfy the user's request.",
   "For deletion, use delete_node only when the user explicitly asks to remove something.",
   "Use dryRun=true for every mutation.",
   "Do not invent node IDs, screen IDs, token names, or schema values; read them first.",
   `Current document revision: ${body.document.revision.revision}. Active screen: ${screenId??"none"}. Selected nodes: ${nodeIds.join(", ")||"none"}.`,
  ].join("\n");
  const brain=new AgentBrain(createAgentModelProvider(provider),createFullAgentToolRegistry(),{maxIterations:8,systemPrompt,history,maxContextMessages:32});
  const run=await brain.run(context,body.prompt);
  const commands=commandsFromResults(run.toolResults);
  const proposal=commands.length?createProposal(body.document,commands,run.message.content||"Proposed UI changes."):undefined;
  const events:AgentEvent[]=run.toolResults.map(result=>({type:result.ok?"agent.tool.completed":"agent.tool.failed",runId:context.runId,result} as AgentEvent));
  return NextResponse.json({reply:run.message.content||"I prepared the requested design analysis.",plan,events,proposal,status:run.status,iterations:run.iterations,sessionId,memory:run.messages});
 }catch(error){
  return NextResponse.json({error:{code:"AGENT_REQUEST_FAILED",message:error instanceof Error?error.message:String(error)}},{status:500});
 }
}
