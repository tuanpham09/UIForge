// biome-ignore-all format: agent runtime contract remains compact for review
import type { AgentContext,AgentToolDefinition,AgentToolResult } from "./contracts";

const defaultInputSchema=(name:string):unknown=>{
 const object=(properties:Record<string,unknown>,required:string[]=[])=>
   ({type:"object",properties,required,additionalProperties:false});
 const string={type:"string"};
 switch(name){
  case"read_project":case"inspect_selection":case"validate_ui":return object();
  case"read_screen":return object({screenId:string},["screenId"]);
  case"read_node":return object({nodeId:string},["nodeId"]);
  case"search_nodes":return object({query:string},["query"]);
  case"create_node":return object({node:{type:"object"},dryRun:{type:"boolean"}},["node"]);
  case"update_node":return object({nodeId:string,patch:{type:"object"},dryRun:{type:"boolean"}},["nodeId","patch"]);
  case"delete_node":return object({nodeId:string,recursive:{type:"boolean"},dryRun:{type:"boolean"}},["nodeId"]);
  case"move_node":return object({nodeId:string,toIndex:{type:"integer",minimum:0},dryRun:{type:"boolean"}},["nodeId","toIndex"]);
  case"set_style":return object({nodeId:string,style:{type:"object"},dryRun:{type:"boolean"}},["nodeId","style"]);
  case"set_token":return object({nodeId:string,slot:string,token:string,dryRun:{type:"boolean"}},["nodeId","slot","token"]);
  case"set_layout":return object({nodeId:string,layout:{type:"object"},dryRun:{type:"boolean"}},["nodeId","layout"]);
  case"set_responsive_rule":return object({nodeId:string,rule:{type:"object"},dryRun:{type:"boolean"}},["nodeId","rule"]);
  case"create_component":return object({nodeId:string,registryId:string,variant:string,props:{type:"object"},dryRun:{type:"boolean"}},["nodeId","registryId"]);
  default:return object();
 }
};

export class AgentToolRegistry {
 private readonly tools=new Map<string,AgentToolDefinition<never,unknown>>();
 register<TInput,TOutput>(tool:AgentToolDefinition<TInput,TOutput>):void{if(this.tools.has(tool.name))throw new Error(`agent tool already registered: ${tool.name}`);this.tools.set(tool.name,tool as unknown as AgentToolDefinition<never,unknown>);}
 has(name:string):boolean{return this.tools.has(name);}
 list():readonly Pick<AgentToolDefinition,"name"|"description"|"inputSchema">[]{return[...this.tools.values()].map(({name,description,inputSchema})=>({name,description,inputSchema}));}
 async execute(name:string,input:unknown,context:AgentContext,callId:string):Promise<AgentToolResult>{const started=Date.now();const tool=this.tools.get(name);if(!tool)return{callId,toolName:name,ok:false,error:{code:"UNKNOWN_TOOL",message:`unknown agent tool: ${name}`},durationMs:Date.now()-started};if(!tool.validateInput(input))return{callId,toolName:name,ok:false,error:{code:"INVALID_INPUT",message:`invalid input for agent tool: ${name}`},durationMs:Date.now()-started};try{return{callId,toolName:name,ok:true,output:await tool.execute(input as never,context),durationMs:Date.now()-started};}catch(error){return{callId,toolName:name,ok:false,error:{code:"EXECUTION_FAILED",message:error instanceof Error?error.message:String(error)},durationMs:Date.now()-started};}}
}
