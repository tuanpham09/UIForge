// biome-ignore-all format: agent runtime contract remains compact for review
import type { AgentContext,AgentToolDefinition,AgentToolResult } from "./contracts";
export class AgentToolRegistry {
 private readonly tools=new Map<string,AgentToolDefinition<never,unknown>>();
 register<TInput,TOutput>(tool:AgentToolDefinition<TInput,TOutput>):void{if(this.tools.has(tool.name))throw new Error(`agent tool already registered: ${tool.name}`);this.tools.set(tool.name,tool as unknown as AgentToolDefinition<never,unknown>);}
 has(name:string):boolean{return this.tools.has(name);}
 list():readonly Pick<AgentToolDefinition,"name"|"description"|"inputSchema">[]{return[...this.tools.values()].map(({name,description,inputSchema})=>({name,description,inputSchema}));}
 async execute(name:string,input:unknown,context:AgentContext,callId:string):Promise<AgentToolResult>{const started=Date.now();const tool=this.tools.get(name);if(!tool)return{callId,toolName:name,ok:false,error:{code:"UNKNOWN_TOOL",message:`unknown agent tool: ${name}`},durationMs:Date.now()-started};if(!tool.validateInput(input))return{callId,toolName:name,ok:false,error:{code:"INVALID_INPUT",message:`invalid input for agent tool: ${name}`},durationMs:Date.now()-started};try{return{callId,toolName:name,ok:true,output:await tool.execute(input as never,context),durationMs:Date.now()-started};}catch(error){return{callId,toolName:name,ok:false,error:{code:"EXECUTION_FAILED",message:error instanceof Error?error.message:String(error)},durationMs:Date.now()-started};}}
}
