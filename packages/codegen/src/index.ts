import type { ComponentDecision } from "@uiforge/component-intelligence";
import { type CodeComponentMapping, type CodeLibrary, resolveCodeMapping } from "@uiforge/component-registry";
import { toCssVariable } from "@uiforge/design-tokens";
import type {
  AccessibilityRequirement, CodeSpecContext, CodeSpecResult, CodeSpecification,
  CodeSpecTarget, CodeSpecWarning, ComponentRequirement, ExperienceGraphAdapter,
  ExperienceTransition, FilePlanEntry, ImportRequirement, InteractionRequirement,
  ResponsiveRequirement, StrategyProvenance, TokenRequirement,
} from "./types";
import type { UIDocument, UINode } from "@uiforge/ui-schema";

export * from "./types";


const DEFAULT_TARGET: CodeSpecTarget = {
  framework: "react", runtime: "nextjs", styling: "tailwind-v4", library: "shadcn-ui",
};
const uniqueSorted = (values: readonly string[]) => [...new Set(values)].sort((a,b)=>a.localeCompare(b));
const mappingTarget = (target: CodeSpecTarget) => ({
  framework: target.framework, runtime: target.runtime, library: target.library as CodeLibrary,
});
function routeForScreen(screen: UIDocument["screens"][number]): string {
  return screen.route ?? `/${screen.id.replace(/^screen[.-]?/,"").replace(/\\./g,"/").toLowerCase()}`;
}
function classForBreakpoint(breakpoint: string): string {
  const normalized = breakpoint.toLowerCase();
  if (normalized==="mobile" || normalized==="sm") return "sm:";
  if (normalized==="tablet" || normalized==="md") return "md:";
  if (normalized==="desktop" || normalized==="lg") return "lg:";
  if (/^\\d+$/.test(normalized)) return `min-[${normalized}px]:`;
  return `${normalized}:`;
}
const tokenClass = (token:string) => `var(${toCssVariable(token)})`;

function buildFilePlan(document: UIDocument, target: CodeSpecTarget): FilePlanEntry[] {
  const entries: FilePlanEntry[] = [
    {path:"app/layout.tsx",kind:"layout",owner:"generated",reason:`Target runtime ${target.runtime} application shell`,screenIds:[]},
    {path:"app/globals.css",kind:"style",owner:"generated",reason:"Semantic design tokens and Tailwind entry styles",screenIds:[]},
  ];
  for (const screen of [...document.screens].sort((a,b)=>a.id.localeCompare(b.id))) {
    const route = routeForScreen(screen).replace(/^\//,"") || "(root)";
    entries.push({path:`app/${route}/page.tsx`,kind:"page",owner:"generated",reason:`Generated page for screen ${screen.name}`,screenIds:[screen.id]});
  }
  return entries;
}

function buildComponentGraph(document: UIDocument,target:CodeSpecTarget,warnings:CodeSpecWarning[],mappings:CodeComponentMapping[],decisions:readonly ComponentDecision[]):ComponentRequirement[] {
  const result:ComponentRequirement[]=[];
  for(const node of Object.values(document.nodes).sort((a,b)=>a.id.localeCompare(b.id))){
    if(!node.component?.registryId) continue;
    const resolution=resolveCodeMapping(node.component.registryId,mappingTarget(target));
    const requirement:ComponentRequirement={
      nodeId:node.id,screenId:node.screenId,registryId:node.component.registryId,
      mappingId:resolution.mapping?.mappingId,componentName:resolution.mapping?.componentName,
      importPath:resolution.mapping?.importPath,variant:node.component.variant,props:node.component.props??{},
      requiredStates:decisions.filter(d=>d.record.nodeId===node.id).map(d=>d.state).filter((s):s is string=>Boolean(s)).sort(),
      warnings:[],
    };
    if(!resolution.mapping){
      const code=resolution.reason==="unsupported-target"?"UNSUPPORTED_TARGET":"MISSING_CODE_MAPPING";
      requirement.warnings.push(code);
      warnings.push({code,path:`nodes.${node.id}.component`,message:`No code mapping for registry component "${node.component.registryId}" targeting ${target.framework}/${target.runtime}/${target.library}.`,severity:"warning"});
    }else mappings.push(resolution.mapping);
    result.push(requirement);
  }
  return result;
}

function buildImportPlan(components:readonly ComponentRequirement[],document:UIDocument):ImportRequirement[]{
  const groups=new Map<string,ImportRequirement>();
  for(const component of components){
    if(!component.importPath || !component.componentName) continue;
    const current=groups.get(component.importPath)??{source:component.importPath,imports:[],kind:"component" as const,requiredBy:[]};
    current.imports.push(component.componentName); current.requiredBy.push(component.nodeId); groups.set(component.importPath,current);
  }
  const navigationNodes=Object.values(document.nodes).filter(n=>n.interaction?.action==="navigate");
  const utility:ImportRequirement={
    source:"next/navigation",imports:navigationNodes.length?["useRouter"]:[],kind:"utility",
    requiredBy:navigationNodes.map(n=>n.id),
  };
  return [...groups.values(),utility].filter(e=>e.imports.length>0).map(e=>({...e,imports:uniqueSorted(e.imports),requiredBy:uniqueSorted(e.requiredBy)})).sort((a,b)=>a.source.localeCompare(b.source));
}

function buildTokenRequirements(document:UIDocument):TokenRequirement[]{
  const result:TokenRequirement[]=[];
  for(const node of Object.values(document.nodes).sort((a,b)=>a.id.localeCompare(b.id))){
    for(const [slot,token] of Object.entries(node.style?.tokens??{}).sort(([a],[b])=>a.localeCompare(b))){
      result.push({nodeId:node.id,slot,token,cssVariable:toCssVariable(token),tailwindValue:tokenClass(token)});
    }
  }
  return result;
}

function buildResponsiveRequirements(document:UIDocument):ResponsiveRequirement[]{
  const result:ResponsiveRequirement[]=[];
  for(const node of Object.values(document.nodes).sort((a,b)=>a.id.localeCompare(b.id))){
    for(const rule of node.responsive??[]){
      const prefix=classForBreakpoint(rule.breakpoint),classes:string[]=[];
      if(rule.hidden===true) classes.push(`${prefix}hidden`);
      if(rule.variant) classes.push(`${prefix}[data-variant="${rule.variant}"]`);
      for(const [slot,token] of Object.entries(rule.tokenOverrides??{}).sort(([a],[b])=>a.localeCompare(b))){
        const variable=slot.replace(/[^a-zA-Z0-9]+/g,"-").toLowerCase();
        classes.push(`${prefix}[--ui-${variable}:${tokenClass(token)}]`);
      }
      result.push({nodeId:node.id,breakpoint:rule.breakpoint,classes,hidden:rule.hidden,variant:rule.variant,tokenOverrides:Object.fromEntries(Object.entries(rule.tokenOverrides??{}).sort(([a],[b])=>a.localeCompare(b)))});
    }
  }
  return result.sort((a,b)=>`${a.nodeId}:${a.breakpoint}`.localeCompare(`${b.nodeId}:${b.breakpoint}`));
}

function buildAccessibilityRequirements(document:UIDocument):AccessibilityRequirement[]{
  return Object.values(document.nodes).filter(n=>n.accessibility).sort((a,b)=>a.id.localeCompare(b.id)).map(node=>({
    nodeId:node.id,role:node.accessibility?.role,accessibleName:node.accessibility?.accessibleName,
    required:node.accessibility?.required??false,keyboard:uniqueSorted(node.accessibility?.keyboard??[]),
    describedBy:uniqueSorted(node.accessibility?.describedBy??[]),labelledBy:uniqueSorted(node.accessibility?.labelledBy??[]),
  }));
}
function transitionForNode(node:UINode,graph?:ExperienceGraphAdapter):ExperienceTransition|undefined{
  return graph?.transitions.filter(t=>t.sourceNodeId===node.id).sort((a,b)=>a.id.localeCompare(b.id))[0];
}
function buildInteractionRequirements(document:UIDocument,graph:ExperienceGraphAdapter|undefined,warnings:CodeSpecWarning[]):InteractionRequirement[]{
  const result:InteractionRequirement[]=[];
  for(const node of Object.values(document.nodes).sort((a,b)=>a.id.localeCompare(b.id))){
    const interaction=node.interaction;
    if(!interaction?.interactive || !interaction.trigger || !interaction.action) continue;
    const transition=transitionForNode(node,graph);
    if(interaction.action==="navigate" && !transition && !interaction.targetScreenId){
      warnings.push({code:"MISSING_GRAPH_TRANSITION",path:`nodes.${node.id}.interaction`,message:"Navigation interaction has no Experience Graph transition or explicit target.",severity:"warning"});
    }
    result.push({nodeId:node.id,trigger:interaction.trigger,action:interaction.action,sourceScreenId:node.screenId,destinationScreenId:transition?.toScreenId??interaction.targetScreenId,destinationNodeId:interaction.targetNodeId,transitionId:transition?.id,kind:transition?.kind,condition:transition?.condition});
  }
  return result;
}
function buildProvenance(context:CodeSpecContext):StrategyProvenance{
  const strategy=context.designStrategy,color=context.colorStrategy,craft=context.visualCraftStrategy;
  const componentVersion=context.componentDecisions?.[0]?.version??"uiforge.component-intelligence/v1";
  const requirements=[
    ...(strategy?.responsive??[]).map(v=>`responsive:${v}`),
    ...(strategy?.accessibility??[]).map(v=>`accessibility:${v}`),
    ...(craft?[ `visual-craft:${craft.version}` ]:[]),
    ...(color?color.roles.map(r=>`color-role:${r.name}`):[]),
  ];
  return {
    designStrategyVersion:strategy?.version??"unprovided",colorStrategyVersion:color?.version??"unprovided",
    componentIntelligenceVersion:componentVersion,visualCraftVersion:craft?.version??"unprovided",
    skillIds:uniqueSorted(strategy?.skills??[]),requirements:uniqueSorted(requirements),
  };
}
function uniqueMappings(mappings:readonly CodeComponentMapping[]):CodeComponentMapping[]{
  const map=new Map<string,CodeComponentMapping>(); for(const mapping of mappings) map.set(mapping.mappingId,mapping);
  return [...map.values()].sort((a,b)=>a.mappingId.localeCompare(b.mappingId));
}
export function buildCodeSpecification(context:CodeSpecContext):CodeSpecResult{
  const target={...DEFAULT_TARGET,...context.target};
  const warnings:CodeSpecWarning[]=[],mappings:CodeComponentMapping[]=[];
  const componentGraph=buildComponentGraph(context.document,target,warnings,mappings,context.componentDecisions??[]);
  const specWithoutKey={
    version:CODE_SPEC_VERSION,target,documentId:context.document.id,documentRevision:context.document.revision.revision,
    filePlan:buildFilePlan(context.document,target),componentGraph,importPlan:buildImportPlan(componentGraph,context.document),
    tokenRequirements:buildTokenRequirements(context.document),responsiveRequirements:buildResponsiveRequirements(context.document),
    accessibilityRequirements:buildAccessibilityRequirements(context.document),interactionRequirements:buildInteractionRequirements(context.document,context.graph,warnings),
    warnings:[...warnings].sort((a,b)=>`${a.path}:${a.code}`.localeCompare(`${b.path}:${b.code}`)),strategyProvenance:buildProvenance(context),
  };
  for(const screen of context.document.screens) if(!screen.route) warnings.push({code:"MISSING_SCREEN_ROUTE",path:`screens.${screen.id}.route`,message:`Screen "${screen.name}" has no explicit route; generator will derive one from the stable screen ID.`,severity:"warning"});
  const normalized={...specWithoutKey,warnings:[...warnings].sort((a,b)=>`${a.path}:${a.code}`.localeCompare(`${b.path}:${b.code}`))};
  const deterministicKey=JSON.stringify(normalized);
  const spec:CodeSpecification={...normalized,deterministicKey};
  return {spec,mappings:uniqueMappings(mappings)};
}
