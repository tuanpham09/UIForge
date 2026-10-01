import {describe,expect,it} from "vitest";
import {reconstructScreenshot,validateScreenshotInput,validateScreenshotAnalysis,createMockScreenshotProvider} from "../src";
import type {ScreenshotInput} from "../src";
import type {UIDocument} from "@uiforge/ui-schema";

const document:UIDocument={
  schemaVersion:"uiforge.schema/v1",id:"shot",metadata:{name:"Screenshot"},
  revision:{revision:1,createdAt:"2026-10-01T00:00:00.000Z",updatedAt:"2026-10-01T00:00:00.000Z",source:"ai"},
  screens:[{id:"screen",name:"Screen",rootNodeId:"screen.root",nodeIds:["screen.root","screen.title","screen.action"]}],
  nodes:{
    "screen.root":{id:"screen.root",screenId:"screen",parentId:null,childrenIds:["screen.title","screen.action"],type:"screen-root",layout:{mode:"stack"}},
    "screen.title":{id:"screen.title",screenId:"screen",parentId:"screen.root",childrenIds:[],type:"text",layout:{mode:"flex"},content:{text:"Dashboard"}},
    "screen.action":{id:"screen.action",screenId:"screen",parentId:"screen.root",childrenIds:[],type:"button",layout:{mode:"flex"},content:{label:"Continue"},component:{registryId:"uiforge.button",variant:"primary"},interaction:{interactive:true,trigger:"click",action:"unknown"},accessibility:{accessibleName:"Continue"}}
  },assets:{}
};

const valid:ScreenshotInput={data:"a".repeat(100),mimeType:"image/png",width:1200,height:700,filename:"reference.png"};

describe("screenshot-to-ui",()=>{
 it("turns a screenshot into editable schema with confidence and mandatory review",async()=>{
  const result=await reconstructScreenshot(valid,createMockScreenshotProvider(document));
  expect(result.document.schemaVersion).toBe("uiforge.schema/v1");
  expect(result.reviewRequired).toBe(true);
  expect(result.confidence.highConfidenceFindings).toBe(2);
  expect(result.analysis.unresolvedRegions).toContain("content.behavior");
  expect(result.analysis.interactionHints[0]?.canonical).toBe(false);
 });
 it("rejects unsupported image type",()=>expect(()=>validateScreenshotInput({...valid,mimeType:"image/gif" as never})).toThrow("IMAGE_UNSUPPORTED_TYPE"));
 it("rejects unsupported dimensions",()=>expect(()=>validateScreenshotInput({...valid,width:32})).toThrow("IMAGE_UNSUPPORTED_DIMENSIONS"));
 it("rejects malformed image",()=>expect(()=>validateScreenshotInput({...valid,data:""})).toThrow("IMAGE_MALFORMED"));
 it("rejects too many pixels",()=>expect(()=>validateScreenshotInput({...valid,width:4000,height:4000})).toThrow("IMAGE_TOO_LARGE"));
 it("rejects canonical interaction inference",()=>expect(()=>validateScreenshotAnalysis({
  schemaVersion:"uiforge.screenshot-analysis/v2",image:{mimeType:"image/png",width:1200,height:700,sha256:"x"},
  regions:[],findings:[{id:"i",kind:"interaction",label:"nav",confidence:.9,evidence:"x",unresolved:false}],
  unresolvedRegions:[],interactionHints:[]
 })).toThrow("INTERACTION_MUST_REMAIN_UNCERTAIN"));
 it("rejects unknown registry component",()=>expect(()=>validateScreenshotAnalysis({
  schemaVersion:"uiforge.screenshot-analysis/v2",image:{mimeType:"image/png",width:1200,height:700,sha256:"x"},
  regions:[],findings:[{id:"c",kind:"component",label:"x",confidence:.9,evidence:"x",unresolved:false,registryComponentId:"uiforge.not-real"}],
  unresolvedRegions:[],interactionHints:[]
 })).toThrow("REGISTRY_COMPONENT_UNKNOWN"));
});
