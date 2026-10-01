// biome-ignore-all format: validator is kept compact as a deterministic domain contract
// biome-ignore-all assist/source/organizeImports: implementation imports are intentionally compact
// biome-ignore-all lint/style/useTemplate: paths are assembled deterministically

import{EXPERIENCE_GRAPH_VERSION,type Action,type Destination,type ExperienceGraph,type GraphIssue,type Transition,type ValidationReport}from"./types";
const destinationOf=(a:Action):Destination|null=>a.type==="navigate"||a.type==="overlay"||a.type==="replace"?a.destination:null;
const add=(i:GraphIssue[],code:GraphIssue["code"],path:string,message:string,severity:GraphIssue["severity"])=>i.push({code,path,message,severity});
const semanticKey=(t:Transition)=>JSON.stringify({source:t.source,trigger:t.trigger,action:t.action,condition:t.condition});
export function validateExperienceGraph(graph:ExperienceGraph):ValidationReport{
 const issues:GraphIssue[]=[];if(graph.version!==EXPERIENCE_GRAPH_VERSION)add(issues,"INVALID_SOURCE_REFERENCE","version","Unsupported graph version.","error");
 const screenIds=[...new Set(graph.flows.flatMap(f=>f.screenIds))].sort(),screens=new Set(screenIds),transitionIds=new Set<string>(),semantic=new Map<string,string>(),starts=new Map(graph.startingPoints.map(p=>[p.id,p]));
 for(const[p]of graph.startingPoints.entries())if(!screens.has(p.destination.screenId))add(issues,"MISSING_DESTINATION","startingPoints."+p,"Starting point references a missing screen.","error");
 for(const[n,t]of graph.transitions.entries()){if(transitionIds.has(t.id))add(issues,"DUPLICATE_TRANSITION","transitions."+n+".id","Transition ID is duplicated.","error");transitionIds.add(t.id);if(!screens.has(t.source.screenId))add(issues,"INVALID_SOURCE_REFERENCE","transitions."+n+".source","Transition source screen does not exist.","error");const d=destinationOf(t.action);if(d&&!screens.has(d.screenId))add(issues,"MISSING_DESTINATION","transitions."+n+".action","Transition destination screen does not exist.","error");const k=semanticKey(t),prev=semantic.get(k);if(prev&&prev!==t.id)add(issues,"CONFLICTING_TRANSITION","transitions."+n,"Transition duplicates another transition.","error");semantic.set(k,t.id)}
 for(const j of graph.journeys){if(!starts.has(j.startingPointId))add(issues,"MISSING_STARTING_POINT","journeys."+j.id,"Journey references a missing starting point.","error");for(const id of j.transitionIds)if(!transitionIds.has(id))add(issues,"UNKNOWN_TRANSITION","journeys."+j.id,"Journey references a missing transition.","error")}
 const adjacency=new Map(screenIds.map(id=>[id,new Set<string>()]));for(const t of graph.transitions){const d=destinationOf(t.action);if(d)adjacency.get(t.source.screenId)?.add(d.screenId)}
 const reachable=new Set<string>(),queue=[...new Set(graph.startingPoints.map(p=>p.destination.screenId))].filter(id=>screens.has(id)).sort();
 while(queue.length){const id=queue.shift() as string;if(reachable.has(id))continue;reachable.add(id);for(const next of[...(adjacency.get(id)??[])].sort())if(!reachable.has(next))queue.push(next)}
 const orphan=screenIds.filter(id=>!graph.transitions.some(t=>t.source.screenId===id||destinationOf(t.action)?.screenId===id)),unreachable=screenIds.filter(id=>!reachable.has(id));
 for(const id of orphan)add(issues,"ORPHAN_SCREEN","screens."+id,"Screen has no incoming or outgoing graph relationship.","warning");for(const id of unreachable)add(issues,"UNREACHABLE_SCREEN","screens."+id,"Screen cannot be reached from a starting point.","warning");for(const id of screenIds)if(!graph.transitions.some(t=>t.source.screenId===id)&&!graph.startingPoints.some(p=>p.destination.screenId===id))add(issues,"DEAD_END","screens."+id,"Screen has no outgoing transition and is not a starting point.","warning");
 issues.sort((a,b)=>(a.path+":"+a.code).localeCompare(b.path+":"+b.code));return{valid:!issues.some(x=>x.severity==="error"),issues,reachableScreenIds:[...reachable].sort(),orphanScreenIds:orphan,unreachableScreenIds:unreachable}
}
