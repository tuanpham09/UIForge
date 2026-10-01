// biome-ignore-all format: screenshot reconstruction contract is kept compact for review
// biome-ignore-all assist/source/organizeImports: domain imports are intentionally grouped
import {PROMPTS,executeWithPolicy,parseJson,type ProviderResult} from "@uiforge/ai";
import {componentRegistry} from "@uiforge/component-registry";
import {validateUIDocument,type UIDocument} from "@uiforge/ui-schema";
import {SCREENSHOT_ANALYSIS_VERSION,SCREENSHOT_TO_UI_VERSION,type ConfidenceLevel,type ScreenshotAnalysisOutput,type ScreenshotFinding,type ScreenshotInput,type ScreenshotRegion,type ReconstructionReport,type ScreenshotToUIProvider} from "./types";

export * from "./types";

const MAX_PIXELS=8_000_000;
const MAX_BYTES=10_000_000;
const MIN_DIMENSION=64;
const ALLOWED_MIME=new Set(["image/png","image/jpeg","image/webp"]);

function sha256Hex(input:string):string {
  let hash=2166136261;
  for(let i=0;i<input.length;i++) hash=Math.imul(hash^input.charCodeAt(i),16777619);
  return (hash>>>0).toString(16).padStart(8,"0");
}

export function validateScreenshotInput(input:ScreenshotInput):void {
  if(!ALLOWED_MIME.has(input.mimeType)) throw new Error("IMAGE_UNSUPPORTED_TYPE");
  if(!Number.isInteger(input.width)||!Number.isInteger(input.height)||input.width<MIN_DIMENSION||input.height<MIN_DIMENSION) throw new Error("IMAGE_UNSUPPORTED_DIMENSIONS");
  if(input.width*input.height>MAX_PIXELS) throw new Error("IMAGE_TOO_LARGE");
  if(typeof input.data!=="string"||input.data.length===0) throw new Error("IMAGE_MALFORMED");
  if(input.data.length>MAX_BYTES) throw new Error("IMAGE_TOO_LARGE");
}

function confidenceLevel(score:number):ConfidenceLevel {
  if(score>=0.85) return "high";
  if(score>=0.6) return "medium";
  return "low";
}

function registryIds():Set<string> {
  return new Set(Object.keys(componentRegistry));
}

function validateAnalysis(value:unknown):ScreenshotAnalysisOutput {
  if(!value||typeof value!=="object") throw new Error("ANALYSIS_SCHEMA_INVALID");
  const v=value as Record<string,unknown>;
  if(v.schemaVersion!==SCREENSHOT_ANALYSIS_VERSION||!v.image||!Array.isArray(v.regions)||!Array.isArray(v.findings)||!Array.isArray(v.unresolvedRegions)||!Array.isArray(v.interactionHints)) throw new Error("ANALYSIS_SCHEMA_INVALID");
  const image=v.image as Record<string,unknown>;
  if(!ALLOWED_MIME.has(String(image.mimeType))||typeof image.width!=="number"||typeof image.height!=="number"||typeof image.sha256!=="string") throw new Error("ANALYSIS_IMAGE_INVALID");
  const ids=registryIds();
  for(const finding of v.findings as ScreenshotFinding[]){
    if(finding.confidence<0||finding.confidence>1) throw new Error("CONFIDENCE_INVALID");
    if(finding.registryComponentId&&!ids.has(finding.registryComponentId)) throw new Error(`REGISTRY_COMPONENT_UNKNOWN:${finding.registryComponentId}`);
    if(finding.kind==="interaction"&&!finding.unresolved) throw new Error("INTERACTION_MUST_REMAIN_UNCERTAIN");
    if(finding.interactionHint&&!finding.interactionHint.canonical) continue;
  }
  for(const hint of v.interactionHints as Array<Record<string,unknown>>){
    if(hint.canonical!==false||typeof hint.uncertainty!=="string"||typeof hint.confidence!=="number") throw new Error("INTERACTION_HINT_INVALID");
  }
  return value as ScreenshotAnalysisOutput;
}

export function validateScreenshotAnalysis(value:unknown):ScreenshotAnalysisOutput {
  return validateAnalysis(value);
}

function regionFromFinding(finding:ScreenshotFinding,index:number):ScreenshotRegion {
  const score=finding.confidence;
  return {
    id:finding.regionId??`region-${index+1}`,
    kind:(finding.label.toLowerCase().includes("header")?"header":finding.label.toLowerCase().includes("sidebar")?"sidebar":finding.label.toLowerCase().includes("card")?"card":finding.label.toLowerCase().includes("table")?"table":finding.label.toLowerCase().includes("form")?"form":"content"),
    bounds:{x:0,y:0,width:1,height:1},
    confidence:score,
    confidenceLevel:confidenceLevel(score),
    nodeIds:finding.nodeId?[finding.nodeId]:[],
    unresolved:finding.unresolved,
    notes:finding.unresolved?[finding.evidence]:[]
  };
}

function assertEditableDocument(document:UIDocument):void {
  validateUIDocument(document);
  for(const node of Object.values(document.nodes)){
    if(node.type==="custom") throw new Error(`UNSUPPORTED_SEMANTIC_NODE:${node.id}`);
  }
}

export async function reconstructScreenshot(input:ScreenshotInput,provider:ScreenshotToUIProvider):Promise<ReconstructionReport>{
  validateScreenshotInput(input);
  const result=await executeWithPolicy(signal=>provider.analyzeScreenshot({
    image:input.data,mimeType:input.mimeType,width:input.width,height:input.height,prompt:PROMPTS["screenshot-analysis"]
  },signal));
  const parsed=parseJson(result.raw);
  const analysis=validateAnalysis(parsed);
  if(analysis.image.width!==input.width||analysis.image.height!==input.height||analysis.image.mimeType!==input.mimeType) throw new Error("ANALYSIS_SOURCE_MISMATCH");
  const documentCandidate=(parsed as Record<string,unknown>).document;
  if(!documentCandidate) throw new Error("SCHEMA_INVALID:reconstructed-document");
  assertEditableDocument(documentCandidate as UIDocument);
  const regions=analysis.regions.length?analysis.regions:analysis.findings.map(regionFromFinding);
  const unresolvedCount=analysis.unresolvedRegions.length+analysis.findings.filter(f=>f.unresolved).length;
  const confidence=analysis.findings.length?analysis.findings.reduce((sum,f)=>sum+f.confidence,0)/analysis.findings.length:0;
  return {
    version:SCREENSHOT_TO_UI_VERSION,
    source:input,
    analysis:{...analysis,regions},
    document:documentCandidate as UIDocument,
    confidence:{
      overall:confidence,
      highConfidenceFindings:analysis.findings.filter(f=>f.confidence>=0.85).length,
      mediumConfidenceFindings:analysis.findings.filter(f=>f.confidence>=0.6&&f.confidence<0.85).length,
      lowConfidenceFindings:analysis.findings.filter(f=>f.confidence<0.6).length,
      unresolvedCount
    },
    reviewRequired:true,
    originalEvidenceRef:input.filename??"uploaded-screenshot",
    provenance:{
      provider:result.metadata.provider,
      model:`${result.metadata.model.provider}/${result.metadata.model.model}`,
      promptVersion:result.metadata.prompt.version,
      requestId:result.metadata.requestId
    }
  };
}

export function createMockScreenshotProvider(document:UIDocument):ScreenshotToUIProvider{
  return {
    async analyzeScreenshot(input):Promise<ProviderResult<unknown>>{
      return {raw:{
        schemaVersion:SCREENSHOT_ANALYSIS_VERSION,
        image:{mimeType:input.mimeType,width:input.width,height:input.height,sha256:sha256Hex(input.image)},
        regions:[{id:"header",kind:"header",bounds:{x:0,y:0,width:1,height:.12},confidence:.96,confidenceLevel:"high",nodeIds:["screen.title"],unresolved:false,notes:[]}],
        findings:[
          {id:"title",kind:"component",label:"Header title",confidence:.94,regionId:"header",nodeId:"screen.title",registryComponentId:"uiforge.text",evidence:"Visible heading typography and placement",unresolved:false},
          {id:"button",kind:"component",label:"Primary action",confidence:.88,regionId:"content",nodeId:"screen.action",registryComponentId:"uiforge.button",evidence:"Visible button shape and label",unresolved:false},
          {id:"interaction",kind:"interaction",label:"Possible navigation",confidence:.42,regionId:"content",nodeId:"screen.action",evidence:"Button could navigate, but screenshot contains no destination evidence",unresolved:true,interactionHint:{id:"hint-1",kind:"navigation",targetNodeId:"screen.action",confidence:.42,uncertainty:"No destination is visible in the screenshot",canonical:false}}
        ],
        unresolvedRegions:["content.behavior"],
        interactionHints:[{id:"hint-1",kind:"navigation",targetNodeId:"screen.action",confidence:.42,uncertainty:"No destination is visible in the screenshot",canonical:false}]
      ,document},
        metadata:{provider:"mock",model:{provider:"mock",model:"screenshot-deterministic",version:"1"},prompt:{id:"screenshot-analysis",version:"uiforge.ai-prompt/screenshot-analysis-v1"},requestId:"screenshot-mock-1",usage:{inputTokens:0,outputTokens:0,totalTokens:0,estimatedCostUsd:0},latencyMs:0}};
    }
  };
}

export {sha256Hex};
