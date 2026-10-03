import { createAgentModelProvider, type AgentProviderConfig } from "@uiforge/agent-runtime";
import { NextResponse } from "next/server";

type Body={provider?:unknown};
const isProvider=(value:unknown):value is AgentProviderConfig=>{
 if(typeof value!=="object"||value===null)return false;
 const item=value as Record<string,unknown>;
 return typeof item.id==="string"&&typeof item.name==="string"&&["openai-responses","openai-chat","anthropic-messages"].includes(item.protocol as string)&&typeof item.apiKey==="string"&&item.apiKey.length>0&&item.apiKey.length<10000&&typeof item.model==="string"&&item.model.length>0&&(!item.baseUrl||typeof item.baseUrl==="string");
};

export async function POST(request:Request){
 try{
  const body=await request.json() as Body;
  if(!isProvider(body.provider))return NextResponse.json({ok:false,error:{code:"INVALID_PROVIDER",message:"Provider, API key and model are required."}},{status:400});
  const provider=createAgentModelProvider(body.provider);
  await provider.complete({messages:[{id:"connection-test",role:"user",content:"Reply with exactly: UIForge connection OK",createdAt:new Date().toISOString()}],tools:[]});
  return NextResponse.json({ok:true});
 }catch(error){
  return NextResponse.json({ok:false,error:{code:"PROVIDER_CONNECTION_FAILED",message:error instanceof Error?error.message:"Provider connection failed."}},{status:502});
 }
}
