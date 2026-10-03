// biome-ignore-all format: agent brain contract remains compact for review
import type { AgentContext, AgentMessage, AgentToolCall, AgentToolResult } from "./contracts";
import type { AgentToolRegistry } from "./registry";

export type AgentModelStopReason = "tool_calls" | "stop" | "max_iterations" | "error";
export interface AgentModelTool { name: string; description: string; inputSchema?: unknown; }
export interface AgentModelRequest { messages: readonly AgentMessage[]; tools: readonly AgentModelTool[]; }
export interface AgentModelResponse { message: AgentMessage; toolCalls?: readonly AgentToolCall[]; stopReason?: AgentModelStopReason; }
export interface AgentModelProvider { complete(request: AgentModelRequest): Promise<AgentModelResponse>; }
export interface AgentBrainOptions { maxIterations?: number; systemPrompt?: string; }
export interface AgentBrainResult { status: "completed" | "failed" | "max_iterations"; message: AgentMessage; toolResults: AgentToolResult[]; iterations: number; }
const now=()=>new Date().toISOString();
const id=(prefix:string,index:number)=>`${prefix}.${index}`;
export class AgentBrain {
  constructor(private readonly provider:AgentModelProvider,private readonly registry:AgentToolRegistry,private readonly options:AgentBrainOptions={}) {}
  async run(context:AgentContext,prompt:string):Promise<AgentBrainResult>{
    const maxIterations=Math.max(1,this.options.maxIterations??8);
    const messages:AgentMessage[]=[];
    if(this.options.systemPrompt)messages.push({id:id("system",0),role:"system",content:this.options.systemPrompt,createdAt:now()});
    messages.push({id:id("user",0),role:"user",content:prompt,createdAt:now()});
    const toolResults:AgentToolResult[]=[];
    for(let iteration=0;iteration<maxIterations;iteration+=1){
      let response:AgentModelResponse;
      try{response=await this.provider.complete({messages,tools:this.registry.list().map(tool=>({name:tool.name,description:tool.description,inputSchema:tool.inputSchema}))});}
      catch(error){const message={id:id("error",iteration),role:"assistant" as const,content:error instanceof Error?error.message:String(error),createdAt:now()};return{status:"failed",message,toolResults,iterations:iteration+1};}
      messages.push({...response.message,toolCalls:response.toolCalls});
      const calls=response.toolCalls??[];
      if(calls.length===0||response.stopReason==="stop")return{status:"completed",message:response.message,toolResults,iterations:iteration+1};
      for(const call of calls){
        const result=await this.registry.execute(call.toolName,call.input,context,call.id);
        toolResults.push(result);
        messages.push({id:`tool-result.${call.id}`,role:"tool",content:JSON.stringify({callId:result.callId,toolName:result.toolName,ok:result.ok,output:result.output,error:result.error}),createdAt:now()});
      }
    }
    return{status:"max_iterations",message:{id:"agent.max-iterations",role:"assistant",content:`Agent stopped after ${maxIterations} iterations to prevent an unbounded tool loop.`,createdAt:now()},toolResults,iterations:maxIterations};
  }
}
