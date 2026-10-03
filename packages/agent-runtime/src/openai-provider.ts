// biome-ignore-all format: server-side provider adapter remains compact for review
import type { AgentModelProvider, AgentModelRequest, AgentModelResponse } from "./agent-brain";
import type { AgentMessage, AgentToolCall } from "./contracts";

type ResponseItem={type?:string;id?:string;call_id?:string;name?:string;arguments?:string;content?:Array<{type?:string;text?:string}>};
type OpenAIResponse={output?:ResponseItem[];output_text?:string;error?:{message?:string;type?:string;code?:string;param?:string}};
export interface OpenAIProviderOptions{apiKey:string;model?:string;baseUrl?:string;instructions?:string;}
export class OpenAIResponsesProvider implements AgentModelProvider{
 private readonly apiKey:string;private readonly model:string;private readonly baseUrl:string;private readonly instructions?:string;
 constructor(options:OpenAIProviderOptions){this.apiKey=options.apiKey;this.model=options.model??"gpt-5";this.baseUrl=(options.baseUrl??"https://api.openai.com").replace(/\/$/,"");this.instructions=options.instructions;}
 async complete(request:AgentModelRequest):Promise<AgentModelResponse>{
  const input:unknown[]=request.messages.flatMap((message):unknown[]=>{
   if(message.role==="tool")return[{type:"function_call_output",call_id:message.id.replace(/^tool-result\./,""),output:message.content}];
   if(message.role==="assistant"&&message.toolCalls?.length)return message.toolCalls.map((call)=>({type:"function_call",id:call.providerItemId??call.id,call_id:call.id,name:call.toolName,arguments:JSON.stringify(call.input)}));
   return[{role:message.role==="system"?"system":message.role,content:message.content}];
  });
  const tools=request.tools.map((tool)=>({type:"function",name:tool.name,description:tool.description,parameters:tool.inputSchema??{type:"object",additionalProperties:true},strict:false}));
  const endpoint=this.baseUrl.endsWith("/responses")?this.baseUrl:this.baseUrl.endsWith("/v1")?`${this.baseUrl}/responses`:`${this.baseUrl}/v1/responses`;
  const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.apiKey}`},body:JSON.stringify({model:this.model,instructions:this.instructions,input,tools,tool_choice:"auto",store:false})});
  const data=await response.json() as OpenAIResponse;
  if(!response.ok){const detail=[data.error?.type,data.error?.code,data.error?.param,data.error?.message].filter(Boolean).join(" · ");throw new Error(`OpenAI Responses request failed with HTTP ${response.status}${detail?`: ${detail}`:""}`);}
  const calls=(data.output??[]).filter((item)=>item.type==="function_call"&&item.name&&item.call_id).map((item)=>({id:item.call_id as string,providerItemId:item.id,toolName:item.name as string,input:JSON.parse(item.arguments??"{}")})) satisfies AgentToolCall[];
  const text=data.output_text??(data.output??[]).filter((item)=>item.type==="message").flatMap((item)=>item.content??[]).map((item)=>item.text??"").join("\n");
  const message:AgentMessage={id:`openai.${Date.now()}`,role:"assistant",content:text,createdAt:new Date().toISOString(),toolCalls:calls};
  return{message,toolCalls:calls,stopReason:calls.length?"tool_calls":"stop"};
 }
}