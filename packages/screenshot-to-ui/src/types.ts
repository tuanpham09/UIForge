export const SCREENSHOT_TO_UI_VERSION="uiforge.screenshot-to-ui/v1" as const;
export const SCREENSHOT_ANALYSIS_VERSION="uiforge.screenshot-analysis/v2" as const;

export type ImageMimeType="image/png"|"image/jpeg"|"image/webp";

export type ScreenshotInput={
  data:string;
  mimeType:ImageMimeType;
  width:number;
  height:number;
  filename?:string;
};

export type ConfidenceLevel="high"|"medium"|"low";

export type RegionKind="header"|"sidebar"|"navigation"|"content"|"card"|"form"|"table"|"footer"|"unknown";

export type InteractionHint={
  id:string;
  kind:"clickable"|"input"|"navigation";
  targetNodeId:string;
  confidence:number;
  uncertainty:string;
  canonical:false;
};

export type ScreenshotRegion={
  id:string;
  kind:RegionKind;
  bounds:{x:number;y:number;width:number;height:number};
  confidence:number;
  confidenceLevel:ConfidenceLevel;
  nodeIds:string[];
  unresolved:boolean;
  notes:string[];
};

export type ScreenshotFinding={
  id:string;
  kind:"region"|"component"|"token"|"interaction";
  label:string;
  confidence:number;
  regionId?:string;
  nodeId?:string;
  registryComponentId?:string;
  evidence:string;
  unresolved:boolean;
  interactionHint?:InteractionHint;
};

export type ScreenshotAnalysisOutput={
  schemaVersion:typeof SCREENSHOT_ANALYSIS_VERSION;
  image:{mimeType:ImageMimeType;width:number;height:number;sha256:string};
  regions:ScreenshotRegion[];
  findings:ScreenshotFinding[];
  unresolvedRegions:string[];
  interactionHints:InteractionHint[];
};

export type ReconstructionReport={
  version:typeof SCREENSHOT_TO_UI_VERSION;
  source:ScreenshotInput;
  analysis:ScreenshotAnalysisOutput;
  document:import("@uiforge/ui-schema").UIDocument;
  confidence:{
    overall:number;
    highConfidenceFindings:number;
    mediumConfidenceFindings:number;
    lowConfidenceFindings:number;
    unresolvedCount:number;
  };
  reviewRequired:boolean;
  originalEvidenceRef:string;
  provenance:{
    provider:string;
    model:string;
    promptVersion:string;
    requestId:string;
  };
};

export type ScreenshotToUIProvider={
  analyzeScreenshot(input:{
    image:string;
    mimeType:ImageMimeType;
    width:number;
    height:number;
    prompt:import("@uiforge/ai").PromptVersion;
  },signal?:AbortSignal):Promise<import("@uiforge/ai").ProviderResult<unknown>>;
};
